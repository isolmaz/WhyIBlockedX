(() => {
  let intent = null;
  const inflight = new Map();
  WIBX.actionListeners = new Set();
  WIBX.captureIntent = record => { intent = { ...record, at: Date.now(), requestKey: crypto.randomUUID() }; return intent.requestKey; };
  WIBX.clearIntent = key => { if (!key || intent?.requestKey === key) intent = null; };
  WIBX.send = async message => { const result = await chrome.runtime.sendMessage(message); if (!result?.ok) throw Error(WIBX.t(result?.error || 'errReloadTab')); return result; };
  WIBX.owner = () => (document.querySelector('[data-testid="SideNav_AccountSwitcher_Button"]')?.textContent || '').match(/@([A-Za-z0-9_]{1,15})\b/)?.[1] || '';
  WIBX.prefs = { ...WIBX.defaults };
  // Follow X's own background and accent colour (Settings → Display) instead of fixed blues/blacks.
  let lastHint = '', lastPrimary = '#1d9bf0';
  // Ignore white/grey/black buttons (X may draw "Post" monochrome); only a saturated colour is an accent.
  const solid = value => {
    const rgb = (value || '').match(/[\d.]+/g)?.map(Number);
    if (!rgb || rgb.length < 3 || rgb[3] === 0 || Math.max(...rgb.slice(0, 3)) - Math.min(...rgb.slice(0, 3)) < 48) return '';
    return value;
  };
  WIBX.sitePalette = () => {
    const rgb = getComputedStyle(document.body || document.documentElement).backgroundColor.match(/[\d.]+/g)?.map(Number) || [0, 0, 0];
    const hint = rgb[0] > 190 && rgb[1] > 190 ? 'light' : rgb[2] > rgb[0] + 8 ? 'dim' : 'black';
    if (hint !== lastHint) { lastHint = hint; WIBX.send({ type: 'themeHint', theme: hint }).catch(() => {}); }
    const post = document.querySelector('[data-testid="SideNav_NewTweet_Button"],a[href="/compose/post"],[data-testid="tweetButtonInline"]');
    lastPrimary = solid(post && getComputedStyle(post).backgroundColor) || lastPrimary;
    return { ...WIBX.palette(WIBX.prefs.theme, hint), primary: lastPrimary, font: WIBX.siteFont() };
  };
  // X sets its font on text elements, not on body, so read it from real text instead of inheriting.
  const fallbackFont = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
  let lastFont = '';
  WIBX.siteFont = () => {
    for (const node of document.querySelectorAll('[data-testid="UserName"] span,[data-testid="tweetText"],[data-testid="primaryColumn"] span,nav span')) {
      const family = getComputedStyle(node).fontFamily;
      if (family && !/^["']?(times new roman|times|serif)["']?$/i.test(family.split(',')[0].trim())) { lastFont = family; break; }
    }
    return lastFont || fallbackFont;
  };
  WIBX.send({type:'settings'}).then(result => { WIBX.prefs = result.settings; document.dispatchEvent(new Event('wibx-refresh')); }).catch(() => {});
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    if (changes['wibx.settings.v1']) WIBX.prefs = { ...WIBX.defaults, ...changes['wibx.settings.v1'].newValue };
    if (changes['wibx.settings.v1'] || changes['neden.records.v1']) document.dispatchEvent(new Event('wibx-refresh'));
  });
  window.addEventListener('message', async event => {
    const data = event.data;
    if (event.source !== window || event.origin !== location.origin || data?.channel !== 'neden.network.v1' || typeof data.id !== 'string' || data.id.length > 80) return;
    for (const [id, record] of inflight) if (Date.now() - record.at > 120000) inflight.delete(id);
    if (data.phase === 'start') {
      if (intent && intent.action === data.action && Date.now() - intent.at < 30000) { inflight.set(data.id, intent); intent = null; }
      return;
    }
    if (data.phase !== 'end') return;
    const record = inflight.get(data.id); inflight.delete(data.id); if (!record) return;
    const result = { ok: Boolean(data.ok), handle: record.handle, action: record.action, requestKey: record.requestKey };
    if (data.user?.handle && /^[A-Za-z0-9_]{1,15}$/.test(data.user.handle)) {
      if (record.handle.toLowerCase() !== data.user.handle.toLowerCase()) {
        result.ok = false; result.error = WIBX.t('errResponseMismatch');
      } else record.name = data.user.name || record.name;
    }
    if (result.ok) {
      try { result.record = (await WIBX.send({ type: 'actionDone', record })).record; }
      catch { result.storageFailed = true; }
    }
    WIBX.actionListeners.forEach(listener => listener(result));
    document.dispatchEvent(new Event('wibx-refresh'));
  });
})();
