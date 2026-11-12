/* Observe only block/mute responses. No requests, tokens, cookies or headers are saved. */
(() => {
  // Runs before X installs shortcuts. Keep the browser's native typing/paste defaults.
  const consumed = new Set();
  for (const type of ['keydown', 'keypress', 'keyup']) window.addEventListener(type, event => {
    const key = event.code || event.key;
    if (type !== 'keydown' && consumed.has(key)) { event.stopImmediatePropagation(); if (type === 'keyup') consumed.delete(key); return; }
    const host = document.activeElement;
    if (host?.getAttribute('data-wibx-host') !== '1' || host.getAttribute('data-wibx-typing') !== '1') return;
    event.stopImmediatePropagation();
    if (type !== 'keydown' || event.isComposing || event.keyCode === 229) return;
    const command = event.key === 'Enter' && (event.ctrlKey || event.metaKey) && !event.altKey ? 'save' : event.key === 'Escape' ? 'close' : '';
    if (command) { event.preventDefault(); consumed.add(key); if (!event.repeat) host.dispatchEvent(new CustomEvent('wibx-editor-command',{detail:command})); }
  }, true);
  const CHANNEL = 'neden.network.v1';
  function endpoint(value, method) {
    try {
      const url = new URL(value, location.href);
      if (!/(^|\.)(x\.com|twitter\.com)$/.test(url.hostname) || method?.toUpperCase() !== 'POST') return null;
      if (/\/blocks\/create\.json$/.test(url.pathname) || /\/graphql\/[^/]+\/BlockUser$/.test(url.pathname)) return 'block';
      if (/\/mutes\/users\/create\.json$/.test(url.pathname) || /\/graphql\/[^/]+\/MuteUser$/.test(url.pathname)) return 'mute';
      if (/\/blocks\/destroy\.json$/.test(url.pathname) || /\/graphql\/[^/]+\/UnblockUser$/.test(url.pathname)) return 'unblock';
      if (/\/mutes\/users\/destroy\.json$/.test(url.pathname) || /\/graphql\/[^/]+\/UnmuteUser$/.test(url.pathname)) return 'unmute';
    } catch {}
    return null;
  }
  function emit(data) { window.postMessage({ channel: CHANNEL, ...data }, location.origin); }
  // Request templates are kept in memory only so the isolated world can replay
  // X's own GraphQL calls for a fast bulk block. Nothing here is stored.
  const LIKES = /\/graphql\/[^/]+\/(?:Favoriters|Likes)$/;
  function likesEndpoint(value, method) {
    try {
      const url = new URL(value, location.href);
      return /(^|\.)(x\.com|twitter\.com)$/.test(url.hostname) && /^(GET|POST)$/.test(method?.toUpperCase() || '') && LIKES.test(url.pathname);
    } catch {}
    return false;
  }
  function headerObject(source) {
    const out = {};
    if (!source) return out;
    if (typeof source.forEach === 'function' && !Array.isArray(source)) source.forEach((value, key) => { out[key] = value; });
    else if (Array.isArray(source)) for (const pair of source) if (pair?.length === 2) out[pair[0]] = pair[1];
    else for (const [key, value] of Object.entries(source)) out[key] = value;
    return out;
  }
  function requestTarget(input, init) {
    const raw = typeof input === 'string' || input instanceof URL ? String(input) : input?.url;
    return { url: new URL(raw || location.href, location.href).href, method: (init?.method || input?.method || 'GET').toUpperCase() };
  }
  function requestInfo(input, init, target = requestTarget(input, init)) {
    const headers = headerObject(init?.headers || input?.headers);
    let body = init?.body;
    if (body == null && input && typeof input !== 'string' && !(input instanceof URL)) body = input.body;
    if (body instanceof URLSearchParams) body = body.toString();
    if (typeof body !== 'string') body = null;
    return { url: target.url, method: target.method, headers, body };
  }
  function timelineRoot(body) {
    const names = ['favoriters_timeline', 'likes_timeline'], queue = [body];
    while (queue.length) {
      const node = queue.shift();
      if (!node || typeof node !== 'object') continue;
      for (const name of names) if (node[name] && typeof node[name] === 'object') return node[name];
      for (const value of Object.values(node)) if (value && typeof value === 'object') queue.push(value);
    }
    return null;
  }
  function collectUsers(body) {
    const root = timelineRoot(body), users = new Map();
    if (!root) return [];
    (function walk(node, depth) {
      if (!node || typeof node !== 'object' || depth > 12) return;
      if (node.__typename === 'User' && node.rest_id && node.legacy && typeof node.legacy.screen_name === 'string') {
        users.set(String(node.rest_id), {
          id: String(node.rest_id), handle: node.legacy.screen_name,
          name: typeof node.legacy.name === 'string' ? node.legacy.name.slice(0, 150) : ''
        });
      }
      for (const value of Object.values(node)) if (value && typeof value === 'object') walk(value, depth + 1);
    })(root, 0);
    return [...users.values()].slice(0, 200);
  }
  function bottomCursor(body) {
    const root = timelineRoot(body);
    let found = '';
    if (!root) return found;
    (function walk(node, depth) {
      if (found || !node || typeof node !== 'object' || depth > 12) return;
      if (node.cursorType === 'Bottom' && typeof node.value === 'string') { found = node.value; return; }
      for (const value of Object.values(node)) if (value && typeof value === 'object') walk(value, depth + 1);
    })(root, 0);
    return found;
  }
  function identity(body, depth = 0) {
    if (!body || typeof body !== 'object' || depth > 7) return null;
    if (/^[A-Za-z0-9_]{1,15}$/.test(body.screen_name || '')) return { handle: body.screen_name, name: typeof body.name === 'string' ? body.name.slice(0, 150) : '' };
    for (const value of Object.values(body)) { const found = identity(value, depth + 1); if (found) return found; }
    return null;
  }
  function failed(body, depth = 0) {
    if (!body || typeof body !== 'object' || depth > 8) return false;
    if (body.error || (Array.isArray(body.errors) && body.errors.length) || body.success === false) return true;
    return Object.values(body).some(value => value && typeof value === 'object' && failed(value, depth + 1));
  }
  function finish(id, status, body) {
    const ok = status >= 200 && status < 300 && body && typeof body === 'object' && !failed(body);
    emit({ phase: 'end', id, ok: Boolean(ok), user: ok ? identity(body) : null });
  }
  const originalFetch = window.fetch;
  window.fetch = function (input, init) {
    const target = requestTarget(input, init);
    const action = endpoint(target.url, target.method);
    const likes = !action && likesEndpoint(target.url, target.method);
    if (!action && !likes) return Reflect.apply(originalFetch, this, arguments);
    const info = requestInfo(input, init, target);
    const id = action ? crypto.randomUUID() : '';
    if (action && (action === 'block' || action === 'mute')) emit({ phase: 'template', kind: action, request: info });
    if (action) emit({ phase: 'start', id, action });
    let result;
    try { result = Reflect.apply(originalFetch, this, arguments); } catch (error) { if (action) finish(id, 0, null); throw error; }
    if (action) {
      result.then(response => {
        response.clone().json().then(body => finish(id, response.status, body), () => finish(id, 0, null));
      }, () => finish(id, 0, null)).catch(() => {});
    }
    if (likes) {
      result.then(response => {
        response.clone().json().then(body => emit({
          phase: 'template', kind: 'likes', request: info,
          users: collectUsers(body), cursor: bottomCursor(body)
        }), () => {});
      }, () => {}).catch(() => {});
    }
    return result;
  };
  const requests = new WeakMap();
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function (method, url) {
    requests.set(this, endpoint(url, method));
    return Reflect.apply(originalOpen, this, arguments);
  };
  XMLHttpRequest.prototype.send = function () {
    const action = requests.get(this);
    if (action) {
      const id = crypto.randomUUID();
      emit({ phase: 'start', id, action });
      this.addEventListener('loadend', () => {
        let body = null;
        try { body = this.responseType === 'json' ? this.response : JSON.parse(this.responseText); } catch {}
        finish(id, this.status, body);
      }, { once: true });
    }
    return Reflect.apply(originalSend, this, arguments);
  };
})();
