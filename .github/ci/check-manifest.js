const fs = require('fs');
const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const m = read('manifest.json');
const refs = [
  m.background.service_worker,
  m.action.default_popup,
  ...Object.values(m.icons),
  ...m.content_scripts.flatMap((c) => c.js),
];
const missing = refs.filter((p) => !fs.existsSync(p));
for (const l of fs.readdirSync('_locales')) read(`_locales/${l}/messages.json`);
if (!fs.existsSync(`_locales/${m.default_locale}/messages.json`)) missing.push('default_locale');
if (missing.length) { console.error('Missing:', missing); process.exit(1); }
console.log(`ok: ${refs.length} manifest references, locales valid`);
