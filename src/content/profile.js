(() => {
  const panels = new Map(), groups = new Map();
  let timer, updating=false, queued=false, revision=0, lastPath=location.pathname, lastOwner='';
  const text=node=>(node?.innerText||node?.textContent||'').trim();
  const own=(el,root)=>!el.closest('article,[data-testid="UserCell"],[data-wibx-host]')&&(!WIBX.previewRoot(el)||WIBX.previewRoot(el)===root);
  function node(tag,cls,value){const el=document.createElement(tag);if(cls)el.className=cls;if(value!=null)el.textContent=value;return el;}
  const css=`:host{display:block;width:100%;font-family:var(--font,inherit);font-size:15px;line-height:20px;color:var(--fg);text-align:left}*{box-sizing:border-box}
.panel{--tone:#f4212e;margin:12px 0;padding:12px 16px;border:1px solid var(--line);border-radius:16px}.panel.mute{--tone:#ffd400}
.title{display:flex;gap:8px;align-items:center;font-weight:700;min-height:34px}.title:before{content:"";width:8px;height:8px;border-radius:50%;background:var(--tone);flex-shrink:0}.title span{flex:1}
p{margin:0}.note{white-space:pre-wrap;overflow-wrap:anywhere;margin:2px 0 8px}.hint,.date{color:var(--muted);font-size:13px;line-height:16px;margin:8px 0 0}
.tweet-label{font-size:13px;line-height:16px;color:var(--muted);margin:12px 0 4px}.tweet{white-space:pre-wrap;overflow-wrap:anywhere;padding-left:12px;border-left:2px solid var(--line)}.compact{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
button,a{font:inherit;color:var(--primary);cursor:pointer;background:none;border:0;padding:0;text-decoration:none}a:hover,.link:hover{text-decoration:underline}
.expand,.open,.reuse,.remove-link{display:block;width:max-content;max-width:100%;margin-top:8px;font-size:13px;line-height:16px}
.edit,.close{display:inline-flex;align-items:center;justify-content:center;min-width:34px;min-height:34px;border-radius:9999px;color:var(--fg);font-weight:700;transition:background-color .2s}.edit:hover,.close:hover{background:color-mix(in srgb,var(--fg) 10%,transparent)}
.edit.text,.close{padding:0 16px;border:1px solid var(--line);font-size:14px}
form{margin-top:12px}label{display:block;font-size:13px;line-height:16px;color:var(--muted);margin-top:12px}
textarea,input{display:block;width:100%;font:inherit;font-size:15px;color:var(--fg);background:transparent;border:1px solid var(--line);border-radius:4px;padding:12px 8px;outline:none;transition:border-color .2s,box-shadow .2s}label input{margin-top:4px}
textarea{min-height:88px;resize:vertical}textarea:focus,input:focus{border-color:var(--primary);box-shadow:0 0 0 1px var(--primary)}textarea::placeholder,input::placeholder{color:var(--muted)}
.actions{display:flex;gap:12px;align-items:center;margin-top:12px}.save{min-height:34px;padding:0 16px;border-radius:9999px;background:var(--fg);color:var(--bg);font-weight:700;transition:opacity .2s}.save:hover{opacity:.9}
.error{font-size:13px;color:#f4212e;margin-top:8px}.error:empty{display:none}:focus-visible{outline:2px solid var(--primary);outline-offset:2px}textarea:focus-visible,input:focus-visible{outline:none}button:disabled{opacity:.5;cursor:default}`;
  // update() awaits the background; never run two at once or both insert a panel for the same root.
  function schedule(){if(!timer)timer=setTimeout(()=>{timer=null;if(updating){queued=true;return;}updating=true;update().catch(()=>{}).finally(()=>{updating=false;if(queued){queued=false;schedule();}});},100);}
  function contexts(){
    const result=[];const primary=document.querySelector('[data-testid="primaryColumn"]')||document.querySelector('main');
    if(primary&&WIBX.profileName())result.push({root:primary,context:{handle:WIBX.profileName(),owner:WIBX.owner(),scope:'Profile',path:location.pathname}});
    for(const root of document.querySelectorAll('[data-testid="HoverCard"],[data-testid="hoverCard"],[data-testid="UserHoverCard"]')){
      const context=WIBX.contextFor(root);if(context.handle)result.push({root,context});
    }
    return result;
  }
  function blockedInfo(root){
    const heading=[...root.querySelectorAll('[data-testid="emptyStateHeader"],h1,h2,[role="heading"]')].find(el=>own(el,root)&&el.getClientRects().length&&/(?:you (?:have )?blocked @|@\w+.{0,35}(?:engellendi|engelledin)|^engellendi$)/i.test(text(el)));
    const direct=[...root.querySelectorAll('button,[role="button"]')].find(el=>own(el,root)&&WIBX.classify(el)==='unblock');
    return {blocked:Boolean(heading||direct),anchor:heading||root.querySelector('[data-testid="UserName"],[data-testid="User-Name"]')};
  }
  async function update(){
    if(lastPath!==location.pathname||lastOwner!==WIBX.owner()){lastPath=location.pathname;lastOwner=WIBX.owner();WIBX.live.clear();revision++;}
    const current=contexts(), alive=new Set(current.map(x=>x.root));
    for(const [root,entry]of panels)if(!alive.has(root)||!root.isConnected){entry.host.remove();panels.delete(root);}
    for(const [root,entry]of groups)if(!alive.has(root)||!root.isConnected){entry.host.remove();groups.delete(root);}
    const palette=WIBX.sitePalette();
    for(const {root,context} of current){
      const key=context.owner.toLowerCase()+':'+context.handle.toLowerCase();const blocked=blockedInfo(root),live=WIBX.live.get(key)||{};
      renderGroup(root,context,blocked.blocked,live,palette);
      let previous=panels.get(root);
      if(previous&&previous.key!==key){previous.host.remove();panels.delete(root);previous=null;}
      if(previous?.editing&&previous.host.isConnected){previous.host.style.cssText=WIBX.style(palette);continue;}
      const cacheKey=key+':'+revision;
      let rows;
      if(previous?.cacheKey===cacheKey)rows=previous.rows;
      else rows=(await WIBX.send({type:'profile',handle:context.handle,owner:context.owner})).records;
      if(!root.isConnected||WIBX.owner()!==context.owner||(context.scope==='Profile'&&WIBX.profileName().toLowerCase()!==context.handle.toLowerCase()))continue;
      const isBlocked=live.block??blocked.blocked;
      const blockRecord=rows.find(r=>r.action==='block'),muteRecord=rows.find(r=>r.action==='mute');
      const type=isBlocked?'block':muteRecord&&!muteRecord.endedAt&&live.mute!==false?'mute':null;
      const record=type==='block'?blockRecord:muteRecord;
      const anchor=blocked.anchor||root.querySelector('[data-testid="UserName"],[data-testid="User-Name"]');
      if(!type||!anchor||!(type==='block'?WIBX.prefs.showBlock:WIBX.prefs.showMute)) {previous?.host.remove();panels.delete(root);continue;}
      const signature=JSON.stringify([key,type,record,WIBX.prefs]);
      if(previous?.signature===signature&&previous.host.isConnected){previous.host.style.cssText=WIBX.style(palette);continue;}
      previous?.host.remove();
      const host=node('div');host.id=context.scope==='Profile'?'wibx-profile':'wibx-preview-note';host.style.cssText=WIBX.style(palette);host.dataset.wibxHost='1';
      const shadow=host.attachShadow({mode:'closed'});WIBX.protectEditor(host,shadow);shadow.append(node('style','',css));
      const panel=node('section','panel '+type);panel.setAttribute('aria-label',WIBX.t('panelLabel'));
      const title=node('div','title');title.append(node('span','',WIBX.t(type==='block'?'blockReason':'muteReason')));const edit=node('button','edit'+(record?.note?'':' text'),record?.note?'':WIBX.t('addReason'));edit.type='button';if(record?.note)edit.append(WIBX.pencil());edit.setAttribute('aria-label',WIBX.t('editReason'));title.append(edit);panel.append(title);
      if(record?.note)panel.append(node('p','note',record.note));
      if(type==='mute')panel.append(node('p','hint',WIBX.t('muteHint')));
      if(WIBX.prefs.showTweet&&(record?.tweetText||record?.tweetUrl)){
        panel.append(node('div','tweet-label',WIBX.t('relatedPost')));
        const body=node('div','tweet'+(WIBX.prefs.preview==='compact'?' compact':''),record.tweetText||WIBX.t('noPostText'));panel.append(body);
        if(record.tweetText){const more=node('button','expand link',WIBX.t(WIBX.prefs.preview==='compact'?'showFullPost':'collapse'));more.type='button';more.setAttribute('aria-expanded',String(WIBX.prefs.preview==='full'));more.onclick=()=>{const compact=body.classList.toggle('compact');more.textContent=WIBX.t(compact?'showFullPost':'collapse');more.setAttribute('aria-expanded',String(!compact));};panel.append(more);}
        if(record.tweetUrl){const a=node('a','open',WIBX.t('openPost'));a.href=record.tweetUrl;a.target='_blank';a.rel='noopener noreferrer';panel.append(a);}
      }
      if(WIBX.prefs.showDate&&record)panel.append(node('p','date',new Date(record.createdAt).toLocaleDateString(WIBX.locale())));
      shadow.append(panel);anchor.insertAdjacentElement('afterend',host);
      const entry={host,shadow,panel,signature,key,rows,cacheKey,editing:false};panels.set(root,entry);
      edit.onclick=()=>editNote(entry,record,context,type);
      const older=rows.find(r=>r.action===type&&r.id!==record?.id&&r.note&&(r.owner||'').toLowerCase()===(record?.owner||context.owner||'').toLowerCase());
      if(!record?.note&&older){const reuse=node('button','reuse link',WIBX.t('reusePrevious'));reuse.type='button';reuse.title=older.note;reuse.onclick=()=>editNote(entry,record,context,type,older.note);panel.append(reuse);}
    }
  }
  async function editNote(entry,record,context,type,previousNote){
    if(entry.editing)return;entry.editing=true;
    const draftKey=WIBX.draftKey(record,context,type),form=node('form'),input=node('textarea'),link=node('input');
    let restored;try{restored=(await WIBX.send({type:'draftGet',key:draftKey})).draft;}catch(err){entry.editing=false;entry.panel.append(node('p','error',err.message));return;}
    if(!entry.host.isConnected){entry.editing=false;return;}
    input.value=restored?.note??previousNote??record?.note??'';input.maxLength=2000;input.setAttribute('aria-label',WIBX.t('personalReason'));input.placeholder=WIBX.t('reasonPlaceholder');
    link.value=restored?.tweetUrl??record?.tweetUrl??'';link.maxLength=2000;link.type='text';link.inputMode='url';link.setAttribute('aria-label',WIBX.t('tweetLink'));link.placeholder='https://x.com/…/status/…';
    const label=node('label','',WIBX.t('tweetLink'));label.append(link);
    const actions=node('div','actions'),save=node('button','save',WIBX.t('save')),cancel=node('button','close',WIBX.t('close')),error=node('p','error'),hint=node('p','hint',WIBX.t(restored?'draftRestored':'shortcutHint'));
    save.type='submit';cancel.type='button';let saving=false,persisted=Promise.resolve(),generation=0;
    const persist=()=>{const current=++generation;hint.textContent=WIBX.t('draftSaving');persisted=WIBX.send({type:'draftSet',key:draftKey,note:input.value,tweetUrl:link.value});persisted.then(()=>{if(current===generation){hint.textContent=WIBX.t('draftSaved');error.textContent='';}},err=>{error.textContent=err.message;});return persisted;};
    input.oninput=link.oninput=persist;
    const remove=node('button','remove-link link',WIBX.t('clearLink'));remove.type='button';remove.onclick=()=>{link.value='';persist();link.focus();};
    const close=async()=>{if(saving)return;try{await persist();entry.editing=false;form.remove();schedule();}catch{}};
    cancel.onclick=close;form.addEventListener('wibx-close',close);actions.append(save,cancel);
    form.append(input,label,remove,node('p','hint',WIBX.t('linkChangeHint')),actions,hint,error);entry.panel.append(form);input.focus();
    if(previousNote&&!restored)persist();
    if(previousNote&&restored){const reuse=node('button','reuse link',WIBX.t('reusePreviousInstead'));reuse.type='button';reuse.onclick=()=>{input.value=previousNote;persist();reuse.remove();};form.insertBefore(reuse,actions);}
    form.onsubmit=async event=>{event.preventDefault();if(saving)return;saving=true;save.disabled=true;input.disabled=link.disabled=remove.disabled=cancel.disabled=true;
      try{await persisted;await WIBX.send({type:'profileNote',id:record?.id,note:input.value,tweetUrl:link.value,draftKey,record:{handle:context.handle,owner:context.owner,action:type}});entry.editing=false;entry.signature='';revision++;schedule();}
      catch(err){error.textContent=err.message;saving=false;save.disabled=input.disabled=link.disabled=remove.disabled=cancel.disabled=false;}
    };
  }
  function renderGroup(root,context,blocked,live,palette){
    const existing=groups.get(root),enabled=WIBX.prefs['buttons'+context.scope];
    const menu=[...root.querySelectorAll('[data-testid="userActions"]')].find(el=>own(el,root));
    if(!enabled||!menu||context.handle.toLowerCase()===context.owner.toLowerCase()){existing?.host.remove();groups.delete(root);return;}
    const nativeKinds=new Set([...root.querySelectorAll('button,[role="button"]')].filter(el=>own(el,root)&&!el.closest('[role="menu"]')).map(el=>WIBX.classify(el)).filter(Boolean).map(a=>a.includes('block')?'block':'mute'));
    const kinds=['block','mute'].filter(kind=>!nativeKinds.has(kind));const key=context.owner+':'+context.handle;
    // Mirror the neighbouring native "⋯" button so size, border and spacing match X exactly.
    const native=getComputedStyle(menu),size=parseFloat(native.height)||34,spaced=native.marginRight!=='0px';
    const look=WIBX.style(palette)+`;--h:${size}px;--border:${native.borderTopColor||'var(--line)'};--gap:${spaced?native.marginRight:'8px'};margin:0 0 ${native.marginBottom} ${spaced?'0':'8px'}`;
    const signature=JSON.stringify([key,kinds,blocked,live,Boolean(WIBX.actionBusy),size,WIBX.lang()]);
    if(existing?.signature===signature&&existing.host.isConnected){existing.host.style.cssText=look;return;}
    if(existing?.busy&&existing.key===key)return;
    existing?.host.remove();if(!kinds.length){groups.delete(root);return;}
    const host=node('span');host.id=context.scope==='Profile'?'wibx-profile-actions':'wibx-preview-actions';host.dataset.wibxHost='1';host.style.cssText=look;const shadow=host.attachShadow({mode:'closed'});
    shadow.append(node('style','',`:host{display:inline-flex;gap:var(--gap);align-self:flex-start;flex-wrap:wrap;font-family:var(--font,inherit)}button{font-family:inherit;font-size:${size>=36?15:14}px;line-height:20px;font-weight:700;min-height:var(--h);padding:0 16px;border:1px solid var(--border);border-radius:9999px;background:transparent;color:var(--fg);cursor:pointer;white-space:nowrap;transition:background-color .2s}button:hover{background:color-mix(in srgb,var(--fg) 10%,transparent)}button.on{color:#f4212e;border-color:color-mix(in srgb,#f4212e 50%,var(--border))}button.on:hover{background:color-mix(in srgb,#f4212e 10%,transparent)}button:disabled{opacity:.5;cursor:default}:focus-visible{outline:2px solid var(--primary);outline-offset:2px}`));
    const entry={host,key,signature,busy:false};groups.set(root,entry);
    for(const kind of kinds){const current=kind==='block'?(live.block??blocked):live.mute;const label=current===undefined?WIBX.t('muteToggle'):WIBX.labels(current?'un'+kind:kind);const button=node('button',current?'on':'',label);button.type='button';button.disabled=Boolean(WIBX.actionBusy);button.setAttribute('aria-label','@'+context.handle+' · '+label);button.onclick=async event=>{if(!event.isTrusted||entry.busy)return;entry.busy=true;shadow.querySelectorAll('button').forEach(control=>control.disabled=true);button.textContent=WIBX.t('processing');try{await WIBX.runAction({context,menu,kind});}catch{}finally{entry.busy=false;entry.signature='';shadow.querySelectorAll('button').forEach(control=>control.disabled=false);schedule();}};shadow.append(button);}
    menu.insertAdjacentElement('afterend',host);
  }
  document.addEventListener('wibx-refresh',()=>{revision++;schedule();});
  function start(){new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});const themes=new MutationObserver(schedule);themes.observe(document.body,{attributes:true,attributeFilter:['class','style']});themes.observe(document.documentElement,{attributes:true,attributeFilter:['class','style']});window.addEventListener('popstate',schedule);schedule();}
  if(document.body)start();else document.addEventListener('DOMContentLoaded',start,{once:true});
})();

