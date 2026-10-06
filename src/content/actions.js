(() => {
  const text = node => (node?.innerText || node?.textContent || '').trim();
  const reserved = new Set(['home','explore','notifications','messages','i','settings','search','compose','login','signup']);
  const inverse = {block:'unblock',unblock:'block',mute:'unmute',unmute:'mute'};
  const names = {block:'Block',unblock:'Unblock',mute:'Mute',unmute:'Unmute'};
  const labels = action => WIBX.t('label'+names[action]);
  let menuContext = null, active = null;
  WIBX.live = new Map(); WIBX.labels = labels;
  WIBX.classify = element => {
    if (!element || element.closest('[data-wibx-host]')) return null;
    const id = element.getAttribute('data-testid') || '', label = text(element).toLocaleLowerCase('tr-TR');
    if (/conversation|sohbet|bildirimleri|notifications/.test(label)) return null;
    if (/(?:^|-)unblock$/.test(id) || /^unblock(?:\s|$)/i.test(label) || /engel(?:lemesini|lemeyi|ini|i)?\s*kaldır/.test(label) || /^(blocked|engellendi)$/.test(label)) return 'unblock';
    if (/(?:^|-)unmute$/.test(id) || /^unmute(?:\s|$)/i.test(label) || /sessiz(?:e almayı|liği)?\s*kaldır|sessizden çıkar/.test(label)) return 'unmute';
    if (/(?:^|-)block$/.test(id) || /^block(?:\s+@|$)/i.test(label) || /(?:^|\s)engelle$/.test(label)) return 'block';
    if (/(?:^|-)mute$/.test(id) || /^mute(?:\s+@|$)/i.test(label) || /(?:^|\s)sessize al$/.test(label)) return 'mute';
    return null;
  };
  WIBX.profileName = () => { const match = location.pathname.match(/^\/([A-Za-z0-9_]{1,15})(?:\/(?:with_replies|media|highlights|articles))?\/?$/); return match && !reserved.has(match[1].toLowerCase()) ? match[1] : ''; };
  WIBX.previewRoot = node => node.closest('[data-testid="HoverCard"],[data-testid="hoverCard"],[data-testid="UserHoverCard"]');
  function handleFrom(root) {
    if (!root) return '';
    for (const anchor of root.querySelectorAll('a[href]')) {
      try { const match = new URL(anchor.href).pathname.match(/^\/([A-Za-z0-9_]{1,15})\/?$/); if (match && !reserved.has(match[1].toLowerCase())) return match[1]; } catch {}
    }
    return text(root.querySelector('[data-testid="UserName"],[data-testid="User-Name"]')).match(/@([A-Za-z0-9_]{1,15})\b/)?.[1] || '';
  }
  WIBX.contextFor = element => {
    const preview = WIBX.previewRoot(element), article = element.closest('article[data-testid="tweet"]'), cell = element.closest('[data-testid="UserCell"]');
    const context = {handle:'',owner:WIBX.owner(),scope:preview?'Preview':article?'Tweet':cell?'Lists':'Profile',path:location.pathname,at:Date.now()};
    if (preview) context.handle = handleFrom(preview);
    else if (article) {
      const status = [...article.querySelectorAll('a[href*="/status/"]')].find(a => a.querySelector('time'));
      context.handle = status?.getAttribute('href')?.match(/\/?([A-Za-z0-9_]{1,15})\/status\//)?.[1] || handleFrom(article);
      context.tweetUrl = status?.href || ''; context.tweetText = text(article.querySelector('[data-testid="tweetText"]')).slice(0,30000);
    } else if (cell) context.handle = handleFrom(cell);
    else context.handle = WIBX.profileName();
    return context;
  };
  function style() {
    if (document.getElementById('wibx-action-style')) return;
    const css = document.createElement('style'); css.id='wibx-action-style';
    css.textContent='html[data-wibx-running="1"] [data-testid="confirmationSheetDialog"],html[data-wibx-running="1"] [role="dialog"]:has([data-testid="confirmationSheetConfirm"]){visibility:hidden!important;pointer-events:none!important}html[data-wibx-hidden-menu="1"] [role="menu"],html[data-wibx-hidden-menu="1"] [data-testid="Dropdown"]{visibility:hidden!important}';
    (document.head || document.documentElement).append(css);
  }
  function closeMenu() { document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',code:'Escape',bubbles:true})); document.dispatchEvent(new KeyboardEvent('keyup',{key:'Escape',code:'Escape',bubbles:true})); }
  WIBX.runAction = async ({context,element,menu,kind,action,report}) => {
    if (active) throw Error(WIBX.t('errBusy'));
    if (!context?.handle) throw Error(WIBX.t('errNoTarget'));
    const route = location.pathname, account = WIBX.owner();
    const valid = () => route === location.pathname && account === WIBX.owner() && (context.scope !== 'Profile' || WIBX.profileName().toLowerCase() === context.handle.toLowerCase()) && (!menu || WIBX.contextFor(menu).handle.toLowerCase() === context.handle.toLowerCase());
    if (!valid()) throw Error(WIBX.t('errProfileUpdating'));
    if (document.querySelector('[data-testid="confirmationSheetConfirm"]')) throw Error(WIBX.t('errCloseDialog'));
    active = {context}; WIBX.actionBusy=true; style(); document.documentElement.dataset.wibxRunning='1';
    let outcome = null, requestKey = '', confirmed = false, startedAt = 0, drivenMenu = null;
    const listener = result => { if (result.requestKey === requestKey) outcome = result; };
    WIBX.actionListeners.add(listener);
    try {
      if (!element) {
        if (!menu?.isConnected || !valid()) throw Error(WIBX.t('errProfileChanged'));
        document.documentElement.dataset.wibxHiddenMenu='1'; menu.click();
        const deadline = Date.now()+4000;
        while (!element && Date.now()<deadline) {
          if (!valid()) throw Error(WIBX.t('errPageChanged'));
          const options = [...document.querySelectorAll('[role="menuitem"]')].filter(node => {
            const target = text(node).match(/@([A-Za-z0-9_]{1,15})\b/)?.[1];
            return !target || target.toLowerCase()===context.handle.toLowerCase();
          });
          drivenMenu = options[0]?.closest('[role="menu"],[data-testid="Dropdown"]') || drivenMenu;
          element = options.find(node => { const candidate = WIBX.classify(node); return action ? candidate===action : kind==='block' ? ['block','unblock'].includes(candidate) : ['mute','unmute'].includes(candidate); });
          if (!element) await new Promise(resolve=>setTimeout(resolve,80));
        }
        if (!element) throw Error(WIBX.t('errNoOption'));
        action = WIBX.classify(element);
      }
      if (!valid()) throw Error(WIBX.t('errPageChanged'));
      requestKey = WIBX.captureIntent({...context,action}); startedAt=Date.now();
      element.click();
      while (!outcome && Date.now()-startedAt<15000) {
        if (!valid()) throw Error(WIBX.t('errPageChangedSent'));
        const confirm = document.querySelector('[data-testid="confirmationSheetConfirm"]');
        if (confirm && !confirmed) {
          if (WIBX.classify(confirm) !== action) throw Error(WIBX.t('errOtherConfirm'));
          const headingText = [...(confirm.closest('[role="dialog"]')?.querySelectorAll('h1,h2,[role="heading"]') || [])].map(text).join('\n');
          const names = [...(text(confirm)+'\n'+headingText).matchAll(/@([A-Za-z0-9_]{1,15})\b/g)].map(match=>match[1].toLowerCase());
          if (names.length && !names.includes(context.handle.toLowerCase())) throw Error(WIBX.t('errConfirmMismatch'));
          confirmed=true; confirm.click();
        }
        await new Promise(resolve=>setTimeout(resolve,60));
      }
      if (!outcome) throw Error(WIBX.t('errNoResponse'));
      if (!outcome.ok) throw Error(outcome.error || WIBX.t('errXFailed'));
      const key = account.toLowerCase()+':'+context.handle.toLowerCase();
      const state = WIBX.live.get(key) || {}; state[action.includes('block')?'block':'mute']=!action.startsWith('un'); WIBX.live.set(key,state);
      document.dispatchEvent(new Event('wibx-refresh'));
      const message = WIBX.t('done'+names[action],context.handle)+(outcome.storageFailed ? WIBX.t('storageFailed') : '');
      report?.(message);
      if (WIBX.prefs.showUndo) showStatus(message,{...context},inverse[action],menu || context.menu,outcome.storageFailed);
      return outcome;
    } catch(error) { report?.(error.message); showStatus(error.message); throw error; }
    finally { WIBX.clearIntent(requestKey); WIBX.actionListeners.delete(listener); if (menu && drivenMenu?.isConnected) closeMenu(); delete document.documentElement.dataset.wibxRunning; delete document.documentElement.dataset.wibxHiddenMenu; active=null; WIBX.actionBusy=false; document.dispatchEvent(new Event('wibx-refresh')); }
  };
  // Same shape as X's own toast: accent background, white text, bold inline action.
  function showStatus(message,context,action,menu,failed=!context) {
    document.getElementById('wibx-status')?.remove();
    const palette=WIBX.sitePalette(),font=palette.font;
    const host=document.createElement('div');host.id='wibx-status';host.dataset.wibxHost='1';host.style.cssText='position:fixed;bottom:32px;left:50%;transform:translateX(-50%);z-index:2147483647;max-width:calc(100vw - 32px)';
    const root=host.attachShadow({mode:'closed'});const box=document.createElement('div');
    box.style.cssText=`background:${failed?'#f4212e':palette.primary};color:#fff;border-radius:4px;padding:12px 16px;font:400 15px/20px ${font};display:flex;gap:24px;align-items:center;box-shadow:0 0 15px rgba(0,0,0,.2),0 0 3px 1px rgba(0,0,0,.15)`;box.setAttribute('role',failed?'alert':'status');
    const label=document.createElement('span');label.textContent=message;box.append(label);
    if(context && menu?.isConnected){const undo=document.createElement('button');undo.textContent=WIBX.t('undo');undo.style.cssText='background:none;border:0;padding:0;color:#fff;font:inherit;font-weight:700;white-space:nowrap;cursor:pointer';undo.onclick=()=>{host.remove();WIBX.runAction({context,menu,action}).catch(()=>{});};box.append(undo);}
    root.append(box);(document.body||document.documentElement).append(host);setTimeout(()=>host.remove(),failed?6000:8000);
  }
  document.addEventListener('click', event => {
    if (!event.isTrusted || !(event.target instanceof Element)) return;
    const target=event.target.closest('button,[role="button"],[role="menuitem"]');if(!target||target.closest('[data-wibx-host]'))return;
    const id=target.getAttribute('data-testid');
    if(id==='caret'||id==='userActions'){menuContext={...WIBX.contextFor(target),menu:target};return;}
    if(target.closest('[role="dialog"]')||id==='confirmationSheetConfirm'||id==='confirmationSheetCancel')return;
    const action=WIBX.classify(target);if(!action)return;
    let context=target.getAttribute('role')==='menuitem'&&menuContext&&Date.now()-menuContext.at<30000&&menuContext.path===location.pathname ? {...menuContext}:WIBX.contextFor(target);
    const explicit=text(target).match(/@([A-Za-z0-9_]{1,15})\b/)?.[1];
    if(explicit && explicit.toLowerCase()!==context.handle.toLowerCase()){context.handle=explicit;context.tweetUrl='';context.tweetText='';}
    if(!context.handle)return;
    if(!WIBX.prefs['buttons'+context.scope]){WIBX.captureIntent({...context,action});return;}
    event.preventDefault();event.stopImmediatePropagation();
    WIBX.runAction({context,element:target,action}).catch(()=>{});
  },true);
})();
