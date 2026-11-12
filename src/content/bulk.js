/* Blocks every liker of the current post. Only runs on an X likes timeline. */
(() => {
  const PANEL_ID = 'wibx-bulk-panel', MAX_HANDLES = 5000;
  const FAST_CONCURRENCY = 24, FAST_PAGE = 100, FAST_PAGES = 60;
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const jitter = () => 1200 + Math.floor(Math.random() * 601);
  const t = (key, ...values) => WIBX.t(key, ...values);
  let host = null, root = null, els = null, observer = null, mutationTimer = 0, pathTimer = 0;
  let state = 'idle', note = '', running = false, stopRequested = false, runToken = 0, pendingReset = false;
  let counts = { blocked: 0, skipped: 0, failed: 0 }, current = '', failures = 0, processed = new Set();
  let mountedPath = '', count = 0, fastUsers = null, approved = new Set(), paletteCss = '';

  const css = `:host{position:fixed;right:16px;bottom:16px;z-index:2147483646;max-width:calc(100vw - 32px);font-family:var(--font);color:var(--fg);text-align:left}
*{box-sizing:border-box}
.card{width:300px;max-width:100%;background:var(--bg);border:1px solid var(--line);border-radius:16px;padding:12px 16px;font-size:14px;line-height:18px;box-shadow:0 0 15px rgba(0,0,0,.2),0 0 3px 1px rgba(0,0,0,.15)}
.title{display:block;margin:0 0 6px;font-size:15px;line-height:20px;font-weight:700}
.line{margin:0 0 4px}.muted{color:var(--muted);font-size:13px;line-height:16px}
.status{min-height:16px;overflow-wrap:anywhere}
.row{display:flex;gap:8px;justify-content:flex-end;margin-top:10px;min-height:32px}
.btn{min-height:32px;padding:0 16px;border-radius:9999px;font:inherit;font-weight:700;cursor:pointer;border:1px solid var(--line);background:transparent;color:var(--fg)}
.btn:hover{background:var(--hover)}
.btn.primary{background:var(--primary);border-color:var(--primary);color:#fff}
.btn:disabled{opacity:.5;cursor:default}
.btn:focus-visible{outline:2px solid var(--primary);outline-offset:2px}
[hidden]{display:none!important}`;

  function node(tag, cls) { const el = document.createElement(tag); if (cls) el.className = cls; return el; }
  function button(cls) { const el = node('button', cls); el.type = 'button'; return el; }
  function postURL() {
    const match = location.pathname.match(/^\/(?:([A-Za-z0-9_]{1,15})\/status|i\/(?:web\/)?status)\/(\d+)\/likes\/?$/);
    return match ? 'https://x.com/' + (match[1] ? match[1] + '/status' : 'i/web/status') + '/' + match[2] : '';
  }
  function cells() {
    const root = document.querySelector('[data-testid="primaryColumn"]') || document.querySelector('main') || document;
    return [...root.querySelectorAll('[data-testid="UserCell"]')].filter(cell => !cell.closest('[data-wibx-host]'));
  }
  function collect() {
    const owner = WIBX.owner().toLowerCase(), map = new Map();
    for (const cell of cells()) {
      const handle = WIBX.contextFor(cell).handle;
      if (!handle) continue;
      const key = handle.toLowerCase();
      if (owner && key === owner) continue;
      if (!map.has(key)) map.set(key, { handle, cell });
    }
    return map;
  }
  function hasUnblock(cell) {
    for (const el of cell.querySelectorAll('button,[role="button"],[role="menuitem"],[data-testid]')) if (WIBX.classify(el) === 'unblock') return true;
    return false;
  }


  function mount() {
    if (!document.body || host) return;
    host = document.createElement('div');
    host.id = PANEL_ID;
    host.setAttribute('data-wibx-host', '1');
    root = host.attachShadow({ mode: 'open' });
    const style = node('style'); style.textContent = css;
    const region = node('section'); region.setAttribute('role', 'region');
    const card = node('div', 'card');
    const title = node('h2', 'title');
    const countLine = node('p', 'line muted');
    const progress = node('p', 'line');
    const status = node('p', 'line muted status');
    status.setAttribute('aria-live', 'polite'); status.setAttribute('role', 'status');
    const row = node('div', 'row');
    const primary = button('btn primary'), secondary = button('btn');
    primary.addEventListener('click', onPrimary); secondary.addEventListener('click', onSecondary);
    row.append(primary, secondary); card.append(title, countLine, progress, status, row);
    region.append(card); root.append(style, region);
    els = { region, title, countLine, progress, status, primary, secondary };
    document.body.append(host);
    watch();
    mountedPath = location.pathname;
    state = 'idle'; note = ''; counts = { blocked: 0, skipped: 0, failed: 0 }; current = ''; failures = 0;
    processed = new Set(); fastUsers = null; approved = new Set();
    count = collect().size;
    paletteCss = WIBX.style(WIBX.sitePalette());
    sync();
  }
  function teardown() {
    runToken++; stopRequested = true; running = false;
    observer?.disconnect(); observer = null; clearTimeout(mutationTimer);
    host?.remove();
    host = null; root = null; els = null; mountedPath = ''; count = 0; pendingReset = false;
    state = 'idle'; note = ''; current = ''; failures = 0;
    counts = { blocked: 0, skipped: 0, failed: 0 }; processed = new Set(); fastUsers = null; approved = new Set(); paletteCss = '';
  }
  function sync() {
    if (!els || !host) return;
    host.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:2147483646;max-width:calc(100vw - 32px);' + (paletteCss || WIBX.style(WIBX.sitePalette()));
    host.dataset.state = state;
    els.region.setAttribute('aria-label', t('bulkTitle'));
    els.title.textContent = t('bulkTitle');
    els.progress.hidden = true; els.countLine.hidden = false;
    els.primary.hidden = false; els.primary.disabled = false;
    els.secondary.hidden = true; els.secondary.disabled = false;
    if (state === 'idle') {
      els.countLine.textContent = count ? t('bulkFound', count) : t('bulkNoUsers');
      els.status.textContent = WIBX.owner() ? t('bulkHint') : t('bulkLogin');
      els.primary.textContent = t('bulkStart');
      els.primary.disabled = !count || !WIBX.owner();
    } else if (state === 'loading') {
      els.countLine.hidden = true; els.progress.hidden = true;
      els.status.textContent = note || t('bulkLoading');
      els.primary.hidden = true; els.secondary.hidden = false; els.secondary.textContent = t('cancel');
    } else if (state === 'confirm') {
      els.countLine.textContent = t('bulkFound', count);
      els.status.textContent = t('bulkConfirm', count);
      els.primary.textContent = t('bulkConfirmAction');
      els.secondary.hidden = false; els.secondary.textContent = t('cancel');
    } else if (state === 'running') {
      els.countLine.hidden = true; els.progress.hidden = false;
      els.progress.textContent = t('bulkProgress', counts.blocked, counts.skipped, counts.failed);
      els.status.textContent = note || (current ? t('bulkWorking', current) : t('bulkLoading'));
      els.primary.hidden = true;
      els.secondary.hidden = false; els.secondary.textContent = t('bulkStop'); els.secondary.disabled = stopRequested;
    } else {
      els.countLine.hidden = true; els.progress.hidden = false;
      els.progress.textContent = t('bulkDone', counts.blocked, counts.skipped, counts.failed);
      els.status.textContent = note;
      els.primary.textContent = t('bulkStart');
    }
  }
  async function onPrimary(event) {
    if (!event?.isTrusted || event.detail > 1) return;
    if (state === 'idle' || state === 'finished') {
      if (!WIBX.owner()) { state = 'idle'; sync(); return; }
      stopRequested = false; count = collect().size;
      fastUsers = null; approved = new Set();
      if (WIBX.templates?.likes) {
        state = 'loading'; note = t('bulkLoading'); sync();
        try {
          const users = await allLikers(WIBX.templates.likes);
          if (stopRequested || state !== 'loading') return;
          if (users?.length) { fastUsers = users; count = users.length; }
        } catch { if (state !== 'loading') return; }
      }
      if (!count) { state = 'idle'; note = ''; sync(); return; }
      approved = new Set(collect().keys());
      state = 'confirm'; note = ''; sync();
    } else if (state === 'confirm') run();
  }
  function onSecondary(event) {
    if (!event?.isTrusted) return;
    if (state === 'loading') { stopRequested = true; state = 'idle'; note = ''; fastUsers = null; approved = new Set(); count = collect().size; sync(); }
    else if (state === 'confirm') { state = 'idle'; note = ''; fastUsers = null; approved = new Set(); count = collect().size; sync(); }
    else if (state === 'running') { stopRequested = true; note = t('bulkStopped'); sync(); }
  }

  function postId() {
    const match = location.pathname.match(/\/status\/(\d+)\/likes\/?$/);
    return match ? match[1] : '';
  }
  function templateVariables(template) {
    try {
      if (template?.method === 'GET') {
        const raw = new URL(template.url).searchParams.get('variables');
        return raw ? JSON.parse(raw) : null;
      }
      const body = template?.body ? JSON.parse(template.body) : null;
      return body?.variables && typeof body.variables === 'object' ? body.variables : null;
    } catch { return null; }
  }
  function templateRequest(template, variables) {
    if (template.method === 'GET') {
      const url = new URL(template.url);
      url.searchParams.set('variables', JSON.stringify(variables));
      return { url: url.href, init: { method: 'GET', headers: template.headers, credentials: 'include' } };
    }
    const body = JSON.parse(template.body);
    body.variables = variables;
    return { url: template.url, init: { method: 'POST', headers: template.headers, body: JSON.stringify(body), credentials: 'include' } };
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
  function usersIn(body) {
    const root = timelineRoot(body), users = new Map();
    if (!root) return [];
    (function walk(node, depth) {
      if (!node || typeof node !== 'object' || depth > 14) return;
      const handle = node.legacy?.screen_name || node.core?.screen_name;
      if (node.__typename === 'User' && node.rest_id && typeof handle === 'string' && /^[A-Za-z0-9_]{1,15}$/.test(handle)) {
        users.set(handle.toLowerCase(), {
          id: String(node.rest_id), handle,
          name: typeof (node.legacy?.name || node.core?.name) === 'string' ? (node.legacy?.name || node.core?.name).slice(0, 150) : ''
        });
      }
      for (const value of Object.values(node)) if (value && typeof value === 'object') walk(value, depth + 1);
    })(root, 0);
    return [...users.values()];
  }
  function cursorIn(body) {
    const root = timelineRoot(body);
    let found = '';
    if (!root) return found;
    (function walk(node, depth) {
      if (found || !node || typeof node !== 'object' || depth > 14) return;
      if (node.cursorType === 'Bottom' && typeof node.value === 'string') { found = node.value; return; }
      for (const value of Object.values(node)) if (value && typeof value === 'object') walk(value, depth + 1);
    })(root, 0);
    return found;
  }
  async function likesPage(template, variables, cursor) {
    const request = templateRequest(template, { ...variables, count: FAST_PAGE, cursor });
    if (typeof AbortSignal.timeout === 'function') request.init.signal = AbortSignal.timeout(20000);
    const response = await fetch(request.url, request.init);
    if (!response.ok) throw Error('likes-' + response.status);
    const body = await response.json();
    return { users: usersIn(body), cursor: cursorIn(body) };
  }
  async function allLikers(template) {
    const variables = templateVariables(template);
    if (!variables || String(variables.tweetId || variables.tweet_id || '') !== postId()) return null;
    const users = new Map();
    let cursor = null, pages = 0;
    while (users.size < MAX_HANDLES && pages < FAST_PAGES) {
      if (stopRequested) return null;
      const page = await likesPage(template, variables, cursor);
      for (const user of page.users) if (!users.has(user.handle.toLowerCase())) users.set(user.handle.toLowerCase(), user);
      count = users.size;
      note = t('bulkFetching', count); sync();
      if (!page.cursor || page.cursor === cursor) break;
      cursor = page.cursor; pages++;
    }
    return [...users.values()].filter(user => user.handle.toLowerCase() !== WIBX.owner().toLowerCase());
  }
  async function blockRequest(template, user) {
    if (!template?.body || template.method !== 'POST') throw Error('template');
    const body = JSON.parse(template.body);
    if (!body?.variables) throw Error('template');
    body.variables = { ...body.variables, user_id: String(user.id) };
    const init = { method: 'POST', headers: template.headers, body: JSON.stringify(body), credentials: 'include' };
    if (typeof AbortSignal.timeout === 'function') init.signal = AbortSignal.timeout(15000);
    const response = await fetch(template.url, init);
    let payload = null;
    try { payload = await response.json(); } catch {}
    if (!response.ok) { const error = Error('block-' + response.status); error.status = response.status; throw error; }
    if (payload && (payload.error || (Array.isArray(payload.errors) && payload.errors.length))) throw Error('block-api');
    return true;
  }
  async function uiBlockOne() {
    for (const [key, entry] of collect()) {
      if (processed.has(key)) continue;
      processed.add(key);
      const result = await attempt(entry.handle, key);
      if (result === 'blocked') return true;
      if (result === 'stop' || result === 'paused') return false;
    }
    return false;
  }
  async function runFast(token, route, account) {
    const likes = WIBX.templates?.likes;
    if (!likes || !WIBX.isLikesPath(location.pathname)) return false;
    let users = fastUsers;
    if (!users) {
      try { users = await allLikers(likes); } catch { return false; }
    }
    if (!users?.length) return false;
    if (token !== runToken || stopRequested || location.pathname !== route || WIBX.owner() !== account) return true;
    if (!WIBX.templates.block) {
      note = t('bulkFastFallback'); sync();
      if (!(await uiBlockOne())) return false;
      if (!WIBX.templates.block) return false;
    }
    const blockTemplate = WIBX.templates.block;
    try {
      if (!/\/BlockUser\/?$/.test(new URL(blockTemplate.url).pathname) || !JSON.parse(blockTemplate.body)?.variables) return false;
    } catch { return false; }
    const pending = users.filter(user => !processed.has(user.handle.toLowerCase()));
    if (!pending.length) return true;
    const records = [], base = counts.blocked;
    let next = 0, done = 0, failed = 0, stopped = false, saved = 0, saveFailed = 0, writeChain = Promise.resolve();
    const flush = () => {
      if (!records.length) return writeChain;
      const batch = records.splice(0, 100);
      writeChain = writeChain.then(async () => {
        try {
          const result = await WIBX.send({ type: 'bulkAdd', records: batch });
          saved += result.added || 0;
          counts.skipped += result.skipped || 0;
        } catch { saveFailed += batch.length; }
        counts.blocked = base + saved;
        counts.failed = failed + saveFailed;
        sync();
      }).catch(() => {});
      return writeChain;
    };
    note = t('bulkFastBlocking', 0, pending.length); sync();
    const worker = async () => {
      while (true) {
        if (token !== runToken || stopRequested || stopped) return;
        if (location.pathname !== route || WIBX.owner() !== account) { stopped = true; note = t('bulkPageChanged'); return; }
        const index = next++;
        if (index >= pending.length) return;
        try {
          await blockRequest(blockTemplate, pending[index]);
          records.push({ handle: pending[index].handle, name: pending[index].name, owner: account, action: 'block', tweetUrl: postURL() });
          processed.add(pending[index].handle.toLowerCase());
          if (records.length >= 100) flush();
        } catch (error) {
          failed++;
          if ([400, 401, 403, 404, 429].includes(error.status) && !stopped) { stopped = true; note = t('bulkFastFailed'); }
          if (failed >= 5 && !stopped) { stopped = true; note = t('bulkPaused'); }
        }
        done++;
        if (done % 5 === 0 || done === pending.length) {
          counts.blocked = base + saved + records.length;
          counts.failed = failed + saveFailed;
          if (!stopped) note = t('bulkFastBlocking', done, pending.length);
          sync();
        }
      }
    };
    await Promise.all(Array.from({ length: Math.min(FAST_CONCURRENCY, pending.length) }, worker));
    await flush();
    counts.blocked = base + saved;
    counts.failed = failed + saveFailed;
    sync();
    return true;
  }
  async function once(handle, key) {
    const entry = collect().get(key);
    if (!entry || !entry.cell.isConnected) return { code: 'gone' };
    const cell = entry.cell;
    if (hasUnblock(cell)) return { code: 'already' };
    const menu = cell.querySelector('[data-testid="userActions"]');
    if (!menu) return { code: 'nomenu' };
    const context = { handle: entry.handle, owner: WIBX.owner(), scope: 'Lists', path: location.pathname, at: Date.now(), tweetUrl: postURL(), bulk: true };
    try {
      await WIBX.runAction({ context, menu, kind: 'block', action: 'block', silent: true });
      return { code: 'ok' };
    } catch (error) { return { code: 'error', message: String(error?.message || '') }; }
  }
  async function attempt(handle, key) {
    let result = await once(handle, key);
    if (result.code === 'error' && result.message === t('errBusy')) {
      note = t('bulkLoading'); sync();
      await sleep(800);
      if (stopRequested) return 'skip';
      result = await once(handle, key);
    }
    if (result.code === 'ok') { counts.blocked++; failures = 0; sync(); return 'blocked'; }
    if (result.code === 'already' || result.code === 'gone') { counts.skipped++; sync(); return 'skip'; }
    if (result.code === 'nomenu') { note = t('bulkNoMenu'); counts.skipped++; sync(); return 'skip'; }
    const message = result.message || '';
    if ([t('errPageChanged'), t('errPageChangedSent'), t('errProfileChanged')].includes(message)) { note = t('bulkPageChanged'); return 'stop'; }
    if (message === t('errNoOption')) { counts.skipped++; sync(); return 'skip'; }
    counts.failed++; failures++; sync();
    return failures >= 3 ? 'paused' : 'failed';
  }
  async function runUI(token, route, account) {
    note = ''; sync();
    while (true) {
      if (token !== runToken || stopRequested) break;
      if (!WIBX.isLikesPath(location.pathname) || location.pathname !== route || WIBX.owner() !== account) { note = t('bulkPageChanged'); break; }
      if (processed.size >= MAX_HANDLES) break;
      const found = collect();
      let item = null;
      for (const [key, value] of found) if (approved.has(key) && !processed.has(key)) { item = { key, ...value }; break; }
      if (!item) break;
      processed.add(item.key); current = item.handle; note = ''; sync();
      const result = await attempt(item.handle, item.key);
      current = '';
      if (token !== runToken) return;
      if (result === 'stop') break;
      if (result === 'paused') { note = t('bulkPaused'); break; }
      if (result !== 'skip') await sleep(result === 'failed' ? jitter() + Math.min(3000, failures * 500) : jitter());
      sync();
    }
  }
  async function run() {
    if (running) return;
    const token = ++runToken;
    running = true; stopRequested = false; failures = 0; current = ''; note = '';
    counts = { blocked: 0, skipped: 0, failed: 0 }; processed = new Set();
    state = 'running'; sync();
    const route = location.pathname, account = WIBX.owner();
    try {
      if (!(await runFast(token, route, account))) await runUI(token, route, account);
    } catch { note = t('bulkPageChanged'); }
    finally {
      if (token === runToken) {
        running = false; current = '';
        if (pendingReset) { pendingReset = false; state = 'idle'; note = ''; counts = { blocked: 0, skipped: 0, failed: 0 }; processed = new Set(); }
        else {
          state = 'finished';
          if (stopRequested) note = note === t('bulkPageChanged') ? note : t('bulkStopped');
        }
        count = collect().size; sync();
      }
    }
  }

  function checkPath() {
    if (typeof WIBX.isLikesPath !== 'function') return;
    if (!WIBX.isLikesPath(location.pathname)) { if (host) teardown(); return; }
    if (!host) { mount(); return; }
    if (mountedPath !== location.pathname) {
      mountedPath = location.pathname;
      if (running) { stopRequested = true; pendingReset = true; }
      else { state = 'idle'; note = ''; count = collect().size; sync(); }
    }
  }
  function watch() {
    if (observer || !document.body) return;
    observer = new MutationObserver(() => {
      clearTimeout(mutationTimer);
      mutationTimer = setTimeout(() => {
        checkPath();
        if (state === 'idle' && els) { count = collect().size; sync(); }
      }, 150);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
  function watchPath() {
    const debounced = () => { clearTimeout(pathTimer); pathTimer = setTimeout(checkPath, 150); };
    window.addEventListener('popstate', debounced);
    if (window.navigation?.addEventListener) {
      window.navigation.addEventListener('navigate', debounced);
      window.navigation.addEventListener('navigatesuccess', debounced);
    }
    document.addEventListener('wibx-refresh', () => {
      if (!els) return;
      paletteCss = WIBX.style(WIBX.sitePalette());
      if (!running) count = collect().size;
      sync();
    });
  }
  function init() {
    if (!document.body) { document.addEventListener('DOMContentLoaded', init, { once: true }); return; }
    watchPath(); checkPath();
  }
  init();
})();
