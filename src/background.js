/* All writes are serialized here so parallel tabs cannot overwrite each other. */
importScripts('shared.js');
// Errors are message keys; the popup and content scripts translate them.
const USER_ERRORS = new Set(['errInvalidDraft', 'errTweetUrl', 'errInvalidRecord', 'errInvalidAction', 'errNotFound', 'errBackup', 'errBackupDate']);
const KEY = 'neden.records.v1';
const SETTINGS = 'wibx.settings.v1';
const XTHEME = 'wibx.xTheme.v1';
const DRAFTS = 'wibx.drafts.v1';
let writes = Promise.resolve();
const clean = (value, max = 2000) => typeof value === 'string' ? value.slice(0, max) : '';
const handle = value => /^@?[a-zA-Z0-9_]{1,15}$/.test(value || '') ? value.replace(/^@/, '') : '';
const tweetURL = value => WIBX.tweetURL(value);
async function records() { return (await chrome.storage.local.get(KEY))[KEY] || []; }
async function drafts() { return (await chrome.storage.local.get(DRAFTS))[DRAFTS] || {}; }
function draftKey(value) { if (typeof value !== 'string' || !/^(?:record:[A-Za-z0-9-]{1,80}|new:[A-Za-z0-9_]{0,15}:[A-Za-z0-9_]{1,15}:(?:block|mute))$/.test(value)) throw Error('errInvalidDraft'); return value; }
function updateDetails(record, message) {
  if (Object.hasOwn(message,'note')) record.note=clean(message.note);
  if (Object.hasOwn(message,'tweetUrl')) {
    const input=typeof message.tweetUrl==='string'?message.tweetUrl.trim():'';
    const next=tweetURL(input);if(input&&!next)throw Error('errTweetUrl');
    if(next!==record.tweetUrl){record.tweetUrl=next;record.tweetText='';}
  }
}
async function saveRecord(rows, record, message) {
  const pending=await drafts(); delete pending['record:'+record.id];
  if(message.draftKey)delete pending[draftKey(message.draftKey)];
  await chrome.storage.local.set({[KEY]:rows,[DRAFTS]:pending});
}
async function settings() { return { ...WIBX.defaults, ...(await chrome.storage.local.get(SETTINGS))[SETTINGS] }; }
function normalizeSettings(input) {
  const result = {};
  for (const [key, value] of Object.entries(input || {})) {
    if (!(key in WIBX.defaults)) continue;
    if (typeof WIBX.defaults[key] === 'boolean' && typeof value === 'boolean') result[key] = value;
    if (key === 'theme' && ['black', 'dim', 'auto'].includes(value)) result[key] = value;
    if (key === 'preview' && ['compact', 'full'].includes(value)) result[key] = value;
    if (key === 'language' && ['auto', 'en', 'tr'].includes(value)) result[key] = value;
  }
  return result;
}
function normalizeRecord(input, source = 'manual') {
  const username = handle(input?.handle);
  if (!username || !['block', 'mute'].includes(input.action)) throw Error('errInvalidRecord');
  return {
    id: crypto.randomUUID(), handle: username, name: clean(input.name, 150), owner: handle(input.owner),
    action: input.action, createdAt: new Date().toISOString(), tweetUrl: tweetURL(input.tweetUrl),
    tweetText: clean(input.tweetText, 30000), note: clean(input.note), source
  };
}
async function run(message, trustedUI) {
  if (message.type==='draftGet') return {draft:(await drafts())[draftKey(message.key)]||null};
  if (message.type==='draftSet') {
    const pending=await drafts(),key=draftKey(message.key);
    pending[key]={note:clean(message.note),tweetUrl:clean(message.tweetUrl,2000),updatedAt:new Date().toISOString()};
    await chrome.storage.local.set({[DRAFTS]:pending});return {draft:pending[key]};
  }
  if (message.type === 'actionDone' && !trustedUI) {
    const input = message.record || {}, action = input.action;
    if (!['block','mute','unblock','unmute'].includes(action)) throw Error('errInvalidAction');
    if (action.startsWith('un')) {
      const rows = await records(), kind = action.slice(2), now = new Date().toISOString();
      const matching = rows.filter(row => row.handle.toLowerCase() === handle(input.handle).toLowerCase() && (row.owner || '').toLowerCase() === handle(input.owner).toLowerCase() && row.action === kind);
      for (const row of matching) if (!row.endedAt) row.endedAt = now;
      await chrome.storage.local.set({[KEY]: rows}); return {record:matching[0] || null};
    }
    const rows = await records(), target = handle(input.handle).toLowerCase(), account = handle(input.owner).toLowerCase();
    const active = rows.find(row => row.handle.toLowerCase() === target && (row.owner || '').toLowerCase() === account && row.action === action && !row.endedAt);
    if (active) {
      if (!active.tweetUrl && !active.tweetText && (await settings()).autoTweet) { active.tweetUrl = tweetURL(input.tweetUrl); active.tweetText = clean(input.tweetText, 30000); }
      active.name = clean(input.name, 150) || active.name;
      await chrome.storage.local.set({[KEY]: rows}); return {record: active};
    }
    return run({type:'add',record:input},false);
  }
  if (message.type === 'settings') return { settings: await settings(), xTheme: (await chrome.storage.local.get(XTHEME))[XTHEME] || 'black' };
  if (message.type === 'setSettings' && trustedUI) {
    const next = { ...await settings(), ...normalizeSettings(message.settings) };
    await chrome.storage.local.set({ [SETTINGS]: next }); return { settings: next };
  }
  if (message.type === 'themeHint' && ['black', 'dim', 'light'].includes(message.theme)) {
    if ((await chrome.storage.local.get(XTHEME))[XTHEME] !== message.theme) await chrome.storage.local.set({ [XTHEME]: message.theme });
    return {};
  }
  if (message.type === 'profile') {
    const username = handle(message.handle).toLowerCase(), account = handle(message.owner).toLowerCase();
    return { records: (await records()).filter(row => row.handle.toLowerCase() === username && (!row.owner || row.owner.toLowerCase() === account)) };
  }
  if (message.type === 'profileNote') {
    const rows = await records();
    const record = message.id ? rows.find(row => row.id === message.id) : normalizeRecord(message.record);
    if (!record) throw Error('errNotFound');
    updateDetails(record,message);
    if (!message.id) rows.unshift(record);
    await saveRecord(rows,record,message); return { record };
  }
  if (message.type === 'list' && trustedUI) return { records: await records(), drafts: await drafts() };
  if (message.type === 'add') {
    const input = message.record || {};
    const rows = await records();
    const record = normalizeRecord(input, trustedUI ? 'manual' : 'observed');
    if (!trustedUI && !(await settings()).autoTweet) { record.tweetUrl = ''; record.tweetText = ''; }
    rows.unshift(record);
    await chrome.storage.local.set({ [KEY]: rows });
    return { record };
  }
  if (message.type === 'note') {
    const rows = await records();
    const record = rows.find(row => row.id === message.id);
    if (!record) throw Error('errNotFound');
    updateDetails(record,message);
    await saveRecord(rows,record,message);
    return { record };
  }
  if (message.type === 'delete' && trustedUI) {
    const pending=await drafts();delete pending['record:'+message.id];
    await chrome.storage.local.set({ [KEY]: (await records()).filter(row => row.id !== message.id),[DRAFTS]:pending });
    return {};
  }
  if (message.type === 'clear' && trustedUI) { await chrome.storage.local.set({ [KEY]: [],[DRAFTS]:{} }); return {}; }
  if (message.type === 'export' && trustedUI) return { backup: { app: 'WhyIBlockedX', version: 3, exportedAt: new Date().toISOString(), records: await records(), settings: await settings() } };
  if (message.type === 'import' && trustedUI) {
    const input = message.backup;
    if (!input || !['Neden', 'WhyIBlockedX'].includes(input.app) || ![1, 2, 3].includes(input.version) || !Array.isArray(input.records) || input.records.length > 20000) throw Error('errBackup');
    // Validate the entire backup before changing storage. Existing notes always win.
    const imported = input.records.map(item => {
      const row = normalizeRecord(item, ['observed', 'manual'].includes(item.source) ? item.source : 'manual');
      if (typeof item.createdAt !== 'string' || !Number.isFinite(Date.parse(item.createdAt))) throw Error('errBackupDate');
      row.createdAt = new Date(item.createdAt).toISOString();
      if (typeof item.endedAt === 'string' && Number.isFinite(Date.parse(item.endedAt))) row.endedAt = new Date(item.endedAt).toISOString();
      if (typeof item.id === 'string' && /^[a-zA-Z0-9-]{1,80}$/.test(item.id)) row.id = item.id;
      return row;
    });
    const rows = await records(), ids = new Set(rows.map(row => row.id));
    const fingerprint = row => JSON.stringify([row.handle.toLowerCase(), row.owner.toLowerCase(), row.action, row.createdAt, row.note, row.tweetUrl, row.tweetText]);
    const fingerprints = new Set(rows.map(fingerprint));
    let added = 0;
    for (const row of imported) {
      const key = fingerprint(row);
      if (ids.has(row.id) || fingerprints.has(key)) continue;
      rows.push(row); ids.add(row.id); fingerprints.add(key); added++;
    }
    rows.sort((a,b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    await chrome.storage.local.set({ [KEY]: rows }); return { added, skipped: imported.length - added };
  }
  throw Error('errUnsupported');
}
// 0.4.x shipped with a fixed black theme as default; move those installs to follow X once.
chrome.runtime.onInstalled.addListener(({reason, previousVersion}) => {
  if (reason !== 'update' || !/^0\.4\./.test(previousVersion || '')) return;
  writes = writes.then(async () => {
    const stored = (await chrome.storage.local.get(SETTINGS))[SETTINGS];
    if (stored?.theme === 'black') await chrome.storage.local.set({ [SETTINGS]: { ...stored, theme: 'auto' } });
  }).catch(() => {});
});
chrome.runtime.onMessage.addListener((message, sender, reply) => {
  if (sender.id !== chrome.runtime.id || !message || typeof message.type !== 'string') return;
  const trustedUI = ['src/popup/library.html', 'src/popup/popup.html'].some(file => sender.url?.split(/[?#]/)[0] === chrome.runtime.getURL(file));
  let site = false;
  try { site = ['x.com', 'twitter.com', 'www.x.com', 'www.twitter.com'].includes(new URL(sender.url).hostname); } catch {}
  if (!trustedUI && !site) return;
  const next = writes.then(() => run(message, trustedUI));
  writes = next.catch(() => {});
  next.then(result => reply({ ok: true, ...result }), error => reply({ ok: false, error: USER_ERRORS.has(error.message) ? error.message : 'errStorage' }));
  return true;
});
