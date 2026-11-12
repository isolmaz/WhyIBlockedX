import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const read = (path) => fs.readFileSync(new URL(path, root), 'utf8');
const plain = (value) => JSON.parse(JSON.stringify(value));

class FakeElement {
  constructor(tag) {
    this.tag = tag; this.children = []; this.listeners = {}; this.attrs = {};
    this.style = { cssText: '' }; this.dataset = {}; this.hidden = false; this.disabled = false; this.textContent = '';
  }
  append(...nodes) { this.children.push(...nodes); }
  addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }
  setAttribute(key, value) { this.attrs[key] = String(value); }
  getAttribute(key) { return this.attrs[key] ?? null; }
  attachShadow() { return new FakeElement('#shadow'); }
  remove() {}
  click() { for (const fn of this.listeners.click || []) fn({ isTrusted: true, detail: 1 }); }
}

function listTemplate(tweetId, list = 'likes') {
  const variables = encodeURIComponent(JSON.stringify({ tweetId, count: 20 }));
  const op = list === 'retweets' ? 'Retweeters' : 'Favoriters';
  return { url: `https://x.com/i/api/graphql/q/${op}?variables=${variables}`, method: 'GET', headers: {}, body: null, list };
}
const blockTemplate = { url: 'https://x.com/i/api/graphql/q/BlockUser', method: 'POST', headers: {}, body: JSON.stringify({ variables: { user_id: '0' } }) };

// `shape: 'core'` matches X's current user objects, which carry screen_name under core.
function listBody(handles, root = 'favoriters_timeline', shape = 'legacy') {
  return {
    data: { [root]: { timeline: { instructions: [{ entries: handles.map((handle, index) => ({
      content: { itemContent: { user_results: { result: { __typename: 'User', rest_id: String(index + 1), [shape]: { screen_name: handle, name: handle } } } } }
    })) }] } } }
  };
}
const restBlockTemplate = { url: 'https://x.com/i/api/1.1/blocks/create.json', method: 'POST', headers: {}, body: 'user_id=0' };
const json = (status, body) => ({ ok: status >= 200 && status < 300, status, json: async () => body });

// Loads bulk.js against a minimal fake X likes or reposts page and returns handles to drive it.
function harness({ path = '/alice/status/123/likes', visible = [], likes, runAction, saveSkipped = 0, blockStatus = 200 }) {
  const created = [], windowListeners = {}, blockCalls = [], uiAttempts = [], sent = [];
  const column = { querySelectorAll: () => page.visible.map(handle => ({ handle, isConnected: true, closest: () => null, querySelectorAll: () => [], querySelector: () => ({}) })) };
  const body = new FakeElement('body');
  const document = {
    body,
    createElement(tag) { const el = new FakeElement(tag); created.push(el); return el; },
    querySelector: (selector) => (selector === '[data-testid="primaryColumn"]' ? column : null),
    addEventListener() {},
  };
  const page = { visible, likes };
  const sandbox = {
    URL, URLSearchParams, console, JSON, Promise, Error, Map, Set, Math,
    setTimeout: (fn) => setTimeout(fn, 0), clearTimeout,
    AbortSignal: {},
    MutationObserver: class { observe() {} disconnect() {} },
    location: { pathname: path },
    document,
    window: { addEventListener: (type, fn) => { (windowListeners[type] ||= []).push(fn); } },
    fetch: async (url, init) => {
      if (url.includes('/BlockUser')) { blockCalls.push(JSON.parse(init.body).variables.user_id); return json(200, { data: {} }); }
      if (url.includes('/blocks/create.json')) { blockCalls.push(new URLSearchParams(init.body).get('user_id')); return json(blockStatus, blockStatus === 200 ? { id_str: '1' } : { errors: [{ code: 1 }] }); }
      const tweetId = JSON.parse(new URL(url).searchParams.get('variables')).tweetId;
      return page.likes(tweetId);
    },
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(read('src/shared.js'), sandbox, { filename: 'src/shared.js' });
  Object.assign(sandbox.WIBX, {
    t: (key, ...values) => (values.length ? `${key}:${values.join(',')}` : key),
    owner: () => 'me',
    contextFor: (cell) => ({ handle: cell.handle }),
    classify: () => '',
    style: () => '',
    sitePalette: () => ({}),
    templates: {},
    send: async (message) => { sent.push(message); return { ok: true, added: message.records.length - saveSkipped, skipped: saveSkipped }; },
    runAction: async ({ context }) => { uiAttempts.push(context.handle); if (runAction) await runAction(context); },
  });
  vm.runInContext(read('src/content/bulk.js'), sandbox, { filename: 'src/content/bulk.js' });
  const host = body.children[0];
  const buttons = created.filter(el => el.tag === 'button');
  const paragraphs = created.filter(el => el.tag === 'p');
  return {
    sandbox, page, host, blockCalls, uiAttempts,
    primary: buttons[0],
    countLine: paragraphs[0],
    progress: paragraphs[1],
    status: paragraphs[2],
    navigate(next) { sandbox.location.pathname = next; for (const fn of windowListeners.popstate || []) fn(); },
  };
}

async function until(condition, label) {
  for (let i = 0; i < 400; i++) {
    if (condition()) return;
    await new Promise(resolve => setTimeout(resolve, 2));
  }
  assert.fail(`timed out waiting for ${label}`);
}

test('a failed liker load confirms only visible users and never blocks a reloaded list', async () => {
  let loads = 0;
  const h = harness({
    visible: ['v1'],
    likes: async () => (++loads === 1 ? json(429, {}) : json(200, listBody(['v1', 'u1', 'u2', 'u3']))),
  });
  h.sandbox.WIBX.templates.list = listTemplate('123');
  h.sandbox.WIBX.templates.block = blockTemplate;
  h.primary.click();
  await until(() => h.host.dataset.state === 'confirm', 'confirm');
  assert.equal(h.countLine.textContent, 'bulkFound:1');
  h.primary.click();
  await until(() => h.host.dataset.state === 'finished', 'finished');
  assert.deepEqual(h.blockCalls, []);
  assert.deepEqual(plain(h.uiAttempts), ['v1']);
  assert.equal(loads, 1);
});

test('a liker load from a previous likes page cannot fill the confirmation on the next page', async () => {
  const pending = {};
  const h = harness({
    likes: (tweetId) => new Promise(resolve => { pending[tweetId] = resolve; }),
  });
  h.sandbox.WIBX.templates.list = listTemplate('123');
  h.sandbox.WIBX.templates.block = blockTemplate;
  h.primary.click();
  await until(() => pending['123'], 'first load');

  h.navigate('/bob/status/456/likes');
  await until(() => h.host.dataset.state === 'idle', 'idle after navigation');
  h.sandbox.WIBX.templates.list = listTemplate('456');
  h.primary.click();
  await until(() => pending['456'], 'second load');

  pending['123'](json(200, listBody(['a1', 'a2'])));
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.equal(h.host.dataset.state, 'loading');

  pending['456'](json(200, listBody(['b1'])));
  await until(() => h.host.dataset.state === 'confirm', 'confirm');
  assert.equal(h.countLine.textContent, 'bulkFound:1');
  h.primary.click();
  await until(() => h.host.dataset.state === 'finished', 'finished');
  assert.deepEqual(plain(h.blockCalls), ['1']);
});

test('UI warm-up blocks only confirmed likers and pauses after three failures', async () => {
  const h = harness({
    visible: ['x9', 'u1', 'u2', 'u3', 'u4'],
    likes: async () => json(200, listBody(['u1', 'u2', 'u3', 'u4'])),
    runAction: async () => { throw Error('boom'); },
  });
  h.sandbox.WIBX.templates.list = listTemplate('123');
  h.primary.click();
  await until(() => h.host.dataset.state === 'confirm', 'confirm');
  assert.equal(h.countLine.textContent, 'bulkFound:4');
  h.primary.click();
  await until(() => h.host.dataset.state === 'finished', 'finished');
  assert.deepEqual(plain(h.uiAttempts), ['u1', 'u2', 'u3']);
  assert.equal(h.status.textContent, 'bulkPaused');
  assert.deepEqual(h.blockCalls, []);
});

test('confirming after the URL changed but before the panel reset blocks nobody', async () => {
  const h = harness({ likes: async () => json(200, listBody(['a1', 'a2'])) });
  h.sandbox.WIBX.templates.list = listTemplate('123');
  h.sandbox.WIBX.templates.block = blockTemplate;
  h.primary.click();
  await until(() => h.host.dataset.state === 'confirm', 'confirm');
  h.sandbox.location.pathname = '/bob/status/456/likes';
  h.primary.click();
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.deepEqual(h.blockCalls, []);
  assert.notEqual(h.host.dataset.state, 'running');
});

test('fast path counts accounts with an existing record as blocked', async () => {
  const h = harness({ likes: async () => json(200, listBody(['a1', 'a2', 'a3'])), saveSkipped: 1 });
  h.sandbox.WIBX.templates.list = listTemplate('123');
  h.sandbox.WIBX.templates.block = blockTemplate;
  h.primary.click();
  await until(() => h.host.dataset.state === 'confirm', 'confirm');
  h.primary.click();
  await until(() => h.host.dataset.state === 'finished', 'finished');
  assert.equal(h.blockCalls.length, 3);
  assert.equal(h.progress.textContent, 'bulkDone:3,0,0');
});

test('reposts page loads and blocks the full reposter list', async () => {
  const h = harness({
    path: '/alice/status/123/retweets',
    likes: async () => json(200, listBody(['r1', 'r2'], 'retweeters_timeline')),
  });
  h.sandbox.WIBX.templates.list = listTemplate('123', 'retweets');
  h.sandbox.WIBX.templates.block = blockTemplate;
  h.primary.click();
  await until(() => h.host.dataset.state === 'confirm', 'confirm');
  assert.equal(h.countLine.textContent, 'bulkFoundReposts:2');
  assert.equal(h.status.textContent, 'bulkConfirmReposts:2');
  h.primary.click();
  await until(() => h.host.dataset.state === 'finished', 'finished');
  assert.deepEqual(plain(h.blockCalls).sort(), ['1', '2']);
});

test('a REST blocks/create template blocks the full reposter list in X\'s current response shape', async () => {
  const h = harness({
    path: '/alice/status/123/retweets',
    likes: async () => json(200, listBody(['r1', 'r2', 'r3'], 'retweeters_timeline', 'core')),
  });
  h.sandbox.WIBX.templates.list = listTemplate('123', 'retweets');
  h.sandbox.WIBX.templates.block = restBlockTemplate;
  h.primary.click();
  await until(() => h.host.dataset.state === 'confirm', 'confirm');
  assert.equal(h.countLine.textContent, 'bulkFoundReposts:3');
  h.primary.click();
  await until(() => h.host.dataset.state === 'finished', 'finished');
  assert.deepEqual(plain(h.blockCalls).sort(), ['1', '2', '3']);
  assert.deepEqual(plain(h.uiAttempts), []);
});

test('when X rejects every replayed block, confirmed visible accounts are blocked one by one', async () => {
  const h = harness({
    path: '/alice/status/123/retweets',
    visible: ['r1', 'x9'],
    likes: async () => json(200, listBody(['r1', 'r2'], 'retweeters_timeline', 'core')),
    blockStatus: 403,
  });
  h.sandbox.WIBX.templates.list = listTemplate('123', 'retweets');
  h.sandbox.WIBX.templates.block = restBlockTemplate;
  h.primary.click();
  await until(() => h.host.dataset.state === 'confirm', 'confirm');
  h.primary.click();
  await until(() => h.host.dataset.state === 'finished', 'finished');
  assert.ok(h.blockCalls.length > 0, 'fast path was tried first');
  assert.deepEqual(plain(h.uiAttempts), ['r1']);
});

test('a rate-limited fast path stops instead of falling back', async () => {
  const h = harness({
    path: '/alice/status/123/retweets',
    visible: ['r1'],
    likes: async () => json(200, listBody(['r1', 'r2'], 'retweeters_timeline', 'core')),
    blockStatus: 429,
  });
  h.sandbox.WIBX.templates.list = listTemplate('123', 'retweets');
  h.sandbox.WIBX.templates.block = restBlockTemplate;
  h.primary.click();
  await until(() => h.host.dataset.state === 'confirm', 'confirm');
  h.primary.click();
  await until(() => h.host.dataset.state === 'finished', 'finished');
  assert.deepEqual(plain(h.uiAttempts), []);
  assert.equal(h.status.textContent, 'bulkFastFailed');
});

test('a likes template is not used on a reposts page', async () => {
  let loads = 0;
  const h = harness({
    path: '/alice/status/123/retweets',
    visible: ['v1'],
    likes: async () => { loads++; return json(200, listBody(['a1', 'a2', 'a3'])); },
  });
  h.sandbox.WIBX.templates.list = listTemplate('123', 'likes');
  h.primary.click();
  await until(() => h.host.dataset.state === 'confirm', 'confirm');
  assert.equal(loads, 0);
  assert.equal(h.countLine.textContent, 'bulkFoundReposts:1');
});

test('observer copies request headers from plain objects, Headers and pairs', async () => {
  const messages = [];
  const sandbox = {
    URL, URLSearchParams, console, Headers, Promise, Reflect, WeakMap, Set,
    location: { href: 'https://x.com/home', origin: 'https://x.com' },
    crypto: { randomUUID: () => 'id' },
    addEventListener() {},
    postMessage: (message) => messages.push(message),
    fetch: async () => ({ ok: true, status: 200, clone: () => ({ json: async () => ({}) }) }),
    XMLHttpRequest: class { open() {} send() {} },
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(read('src/content/observer.js'), sandbox, { filename: 'src/content/observer.js' });

  const url = 'https://x.com/i/api/graphql/q/BlockUser';
  const expected = { authorization: 'Bearer t', 'x-csrf-token': 'c' };
  for (const headers of [{ ...expected }, new Headers(expected), Object.entries(expected)]) {
    messages.length = 0;
    await sandbox.window.fetch(url, { method: 'POST', headers, body: '{}' });
    const template = messages.find(message => message.phase === 'template');
    assert.ok(template, 'template emitted');
    assert.deepEqual(plain(template.request.headers), expected);
  }
});

test('observer copies list and REST block templates from XMLHttpRequest', () => {
  const messages = [];
  class FakeXHR {
    constructor() { this.listeners = {}; this.status = 0; this.responseText = '{}'; }
    open() {} setRequestHeader() {} send() {}
    addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }
    finish(status) { this.status = status; for (const fn of this.listeners.loadend || []) fn(); }
  }
  const sandbox = {
    URL, URLSearchParams, console, Headers, Promise, Reflect, WeakMap, Set,
    location: { href: 'https://x.com/alice/status/123/retweets', origin: 'https://x.com' },
    crypto: { randomUUID: () => 'id' },
    addEventListener() {},
    postMessage: (message) => messages.push(message),
    fetch: async () => ({ ok: true }),
    XMLHttpRequest: FakeXHR,
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(read('src/content/observer.js'), sandbox, { filename: 'src/content/observer.js' });

  const failedList = new FakeXHR();
  failedList.open('GET', '/i/api/graphql/q/Retweeters?variables=%7B%7D');
  failedList.send();
  failedList.finish(429);
  assert.equal(messages.filter(message => message.phase === 'template').length, 0);

  const list = new FakeXHR();
  list.open('GET', '/i/api/graphql/q/Retweeters?variables=%7B%7D');
  list.setRequestHeader('authorization', 'Bearer t');
  list.send();
  assert.equal(messages.filter(message => message.phase === 'template').length, 0, 'list template waits for a successful response');
  list.finish(200);
  const listTemplateMessage = messages.find(message => message.phase === 'template');
  assert.equal(listTemplateMessage.kind, 'list');
  assert.equal(listTemplateMessage.request.url, 'https://x.com/i/api/graphql/q/Retweeters?variables=%7B%7D');
  assert.deepEqual(plain(listTemplateMessage.request.headers), { authorization: 'Bearer t' });

  messages.length = 0;
  const block = new FakeXHR();
  block.open('POST', 'https://x.com/i/api/1.1/blocks/create.json');
  block.setRequestHeader('x-csrf-token', 'c');
  block.send('user_id=42');
  const blockTemplateMessage = messages.find(message => message.phase === 'template');
  assert.equal(blockTemplateMessage.kind, 'block');
  assert.equal(blockTemplateMessage.request.method, 'POST');
  assert.equal(blockTemplateMessage.request.body, 'user_id=42');
  assert.deepEqual(plain(blockTemplateMessage.request.headers), { 'x-csrf-token': 'c' });
  assert.ok(messages.some(message => message.phase === 'start' && message.action === 'block'));
});
