import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const read = (path) => fs.readFileSync(new URL(path, root), 'utf8');
const manifest = JSON.parse(read('manifest.json'));

test('manifest references existing files and only asks for storage', () => {
  const refs = [
    manifest.background.service_worker,
    manifest.action.default_popup,
    ...Object.values(manifest.icons),
    ...manifest.content_scripts.flatMap((entry) => entry.js),
  ];
  for (const ref of refs) assert.ok(fs.existsSync(new URL(ref, root)), ref);
  assert.deepEqual(manifest.permissions, ['storage']);
  assert.equal(manifest.manifest_version, 3);
});

test('bulk script is loaded after the action machinery', () => {
  const scripts = manifest.content_scripts.flatMap((entry) => entry.js);
  assert.ok(scripts.includes('src/content/bulk.js'));
  assert.ok(scripts.indexOf('src/content/bulk.js') > scripts.indexOf('src/content/actions.js'));
  assert.ok(scripts.indexOf('src/content/bulk.js') > scripts.indexOf('src/content/profile.js'));
});

test('en and tr dictionaries have identical keys', () => {
  const sandbox = { WIBX: {}, chrome: { i18n: { getUILanguage: () => 'en' } }, navigator: { language: 'en' }, console };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(read('src/i18n.js'), sandbox, { filename: 'src/i18n.js' });
  const { en, tr } = sandbox.WIBX.i18n;
  assert.deepEqual(Object.keys(en).sort(), Object.keys(tr).sort());
});

test('popup markup and JS reference existing translations', () => {
  const sandbox = { WIBX: {}, chrome: { i18n: { getUILanguage: () => 'en' } }, navigator: { language: 'en' }, console };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(read('src/i18n.js'), sandbox, { filename: 'src/i18n.js' });
  const { en, tr } = sandbox.WIBX.i18n;
  const html = read('src/popup/popup.html');
  const keys = [...html.matchAll(/data-i18n(?:-placeholder|-aria)?="([^"]+)"/g)].map((match) => match[1]);
  for (const key of keys) {
    assert.ok(Object.hasOwn(en, key), `en missing ${key}`);
    assert.ok(Object.hasOwn(tr, key), `tr missing ${key}`);
  }
});

test('bulk UI strings exist in both languages', () => {
  const sandbox = { WIBX: {}, chrome: { i18n: { getUILanguage: () => 'en' } }, navigator: { language: 'en' }, console };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(read('src/i18n.js'), sandbox, { filename: 'src/i18n.js' });
  const keys = ['bulkTitle', 'bulkFound', 'bulkLoading', 'bulkHint', 'bulkStart', 'bulkConfirm', 'bulkConfirmAction', 'bulkStop', 'bulkStopped', 'bulkDone', 'bulkProgress', 'bulkWorking', 'bulkNoUsers', 'bulkPaused', 'bulkPageChanged', 'bulkLogin', 'bulkNoMenu', 'bulkNav', 'bulkPageTitle', 'bulkPageHint', 'bulkUrl', 'bulkLaunch', 'bulkFetching', 'bulkFastBlocking', 'bulkFastFailed', 'bulkFastFallback', 'bulkMenuReposts', 'bulkMenuLikes', 'bulkTitleReposts', 'bulkFoundReposts', 'bulkLoadingReposts', 'bulkFetchingReposts', 'bulkNoUsersReposts', 'bulkHintReposts', 'bulkConfirmReposts'];
  for (const lang of ['en', 'tr']) for (const key of keys) assert.ok(Object.hasOwn(sandbox.WIBX.i18n[lang], key), `${lang} missing ${key}`);
});
