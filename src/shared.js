/* Shared defaults keep existing Neden records readable after the rename. */
globalThis.WIBX = {
  defaults: { autoTweet: true, showBlock: true, showMute: true, showTweet: true, showDate: false, buttonsProfile: true, buttonsPreview: true, buttonsTweet: true, buttonsLists: true, showUndo: true, preview: 'compact', theme: 'auto', language: 'auto' },
  themes: {
    black: { bg: '#000000', fg: '#e7e9ea', muted: '#71767b', line: '#2f3336', hover: '#181818', field: '#080808' },
    dim: { bg: '#15202b', fg: '#f7f9f9', muted: '#8b98a5', line: '#38444d', hover: '#1e2d3d', field: '#192734' },
    light: { bg: '#ffffff', fg: '#0f1419', muted: '#536471', line: '#cfd9de', hover: '#eff3f4', field: '#f7f9f9' }
  },
  palette(theme, hint = 'black') { return this.themes[theme === 'auto' ? hint : theme] || this.themes.black; },
  style(palette) { return Object.entries(palette).map(([key, value]) => `--${key}:${value}`).join(';'); },
  tweetURL(value) {
    try {
      const url = new URL(value);
      if (url.protocol !== 'https:' || !['x.com','twitter.com','www.x.com','www.twitter.com'].includes(url.hostname)) return '';
      const match = url.pathname.match(/^\/(?:([A-Za-z0-9_]{1,15})\/status|(i\/web\/status))\/(\d+)(?:\/(?:photo|video)\/\d+)?\/?$/);
      return match ? 'https://x.com/' + (match[1] ? match[1]+'/status' : match[2]) + '/' + match[3] : '';
    } catch { return ''; }
  },
  draftKey(record, context, action) { return record?.id ? 'record:'+record.id : 'new:'+(context.owner||'').toLowerCase()+':'+context.handle.toLowerCase()+':'+action; },
  pencil() {
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('width','18');svg.setAttribute('height','18');svg.setAttribute('aria-hidden','true');
    const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d','M15.5 4.5l4 4M4 20l4.5-1 11-11a2.83 2.83 0 0 0-4-4l-11 11L4 20Z');path.setAttribute('fill','none');path.setAttribute('stroke','currentColor');path.setAttribute('stroke-width','1.7');path.setAttribute('stroke-linejoin','round');svg.append(path);return svg;
  },
  protectEditor(host, root) {
    host.dataset.wibxHost = '1';
    const update = () => { host.dataset.wibxTyping = root.activeElement?.matches('input,textarea,[contenteditable=true]') ? '1' : '0'; };
    root.addEventListener('focusin', update); root.addEventListener('focusout', () => queueMicrotask(update));
    host.addEventListener('wibx-editor-command', event => {
      const form = root.activeElement?.closest('form'); if (!form) return;
      if (event.detail === 'save') form.requestSubmit();
      if (event.detail === 'close') form.dispatchEvent(new Event('wibx-close'));
    });
  }
};
