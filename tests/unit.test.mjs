import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const shared = fs.readFileSync(new URL('src/shared.js', root), 'utf8');
const sandbox = { URL, console };
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
vm.runInContext(shared, sandbox, { filename: 'src/shared.js' });
const W = sandbox.WIBX;

test('tweetURL accepts canonical X/Twitter post links', () => {
  assert.equal(W.tweetURL('https://x.com/alice/status/123'), 'https://x.com/alice/status/123');
  assert.equal(W.tweetURL('https://twitter.com/alice/status/123?s=20'), 'https://x.com/alice/status/123');
  assert.equal(W.tweetURL('https://www.x.com/alice/status/123/photo/1'), 'https://x.com/alice/status/123');
  assert.equal(W.tweetURL('https://x.com/i/web/status/123'), 'https://x.com/i/web/status/123');
  assert.equal(W.tweetURL('https://x.com/alice/status/123/likes'), '');
});

test('tweetURL rejects unsafe or malformed links', () => {
  for (const value of ['http://x.com/alice/status/123', 'javascript:alert(1)', 'https://evilx.com/alice/status/123', 'https://x.com/alice/status/abc', 'not a url', '']) {
    assert.equal(W.tweetURL(value), '', String(value));
  }
});

test('listURL canonicalizes post, likes and reposts links', () => {
  assert.equal(W.listURL('https://x.com/alice/status/123', 'retweets'), 'https://x.com/alice/status/123/retweets');
  assert.equal(W.listURL('https://twitter.com/alice/status/123?s=20', 'likes'), 'https://x.com/alice/status/123/likes');
  assert.equal(W.listURL('https://x.com/alice/status/123/likes', 'retweets'), 'https://x.com/alice/status/123/retweets');
  assert.equal(W.listURL('https://x.com/alice/status/123/retweets', 'likes'), 'https://x.com/alice/status/123/likes');
  assert.equal(W.listURL('https://x.com/i/web/status/123', 'retweets'), 'https://x.com/i/web/status/123/retweets');
  assert.equal(W.listURL('https://x.com/i/status/123/likes', 'likes'), 'https://x.com/i/web/status/123/likes');
  for (const value of ['https://x.com/alice', 'https://x.com/alice/status/abc/likes', 'http://x.com/alice/status/123', 'javascript:alert(1)']) {
    assert.equal(W.listURL(value, 'retweets'), '', String(value));
  }
  assert.equal(W.listURL('https://x.com/alice/status/123', 'quotes'), '');
});

test('listKind only accepts likes and reposts routes', () => {
  assert.equal(W.listKind('/alice/status/123/likes'), 'likes');
  assert.equal(W.listKind('/alice/status/123/likes/'), 'likes');
  assert.equal(W.listKind('/alice/status/123/retweets'), 'retweets');
  assert.equal(W.listKind('/i/web/status/123/retweets'), 'retweets');
  assert.equal(W.listKind('/i/status/123/likes'), 'likes');
  for (const value of ['/alice/status/123', '/alice/likes', '/alice/status/123/quotes', '/i/web/status/123', '/home', '']) {
    assert.equal(W.listKind(value), '', value);
  }
});

test('draftKey uses record id or owner/target/action', () => {
  assert.equal(W.draftKey({ id: 'abc' }, { owner: 'me', handle: 'alice' }, 'block'), 'record:abc');
  assert.equal(W.draftKey(null, { owner: 'Me', handle: 'Alice' }, 'mute'), 'new:me:alice:mute');
});

test('palette and style expose theme tokens', () => {
  assert.equal(W.palette('auto', 'dim').bg, W.themes.dim.bg);
  assert.equal(W.palette('light').fg, W.themes.light.fg);
  assert.match(W.style(W.themes.black), /--bg:#000000/);
});
