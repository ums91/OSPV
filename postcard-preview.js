/* UMS91 — 3D postcard preview. Isolated feature: no checkout/order logic. */
(() => {
  let currentProduct = null;
  let open = false;
  const $ = (s,r=document)=>r.querySelector(s);

  function ensureStage(){
    const modal=$('#productModal');
    if(!modal || $('#postcardPreview')) return;
    const stage=document.createElement('div');
    stage.id='postcardPreview'; stage.className='postcard-preview'; stage.setAttribute('aria-hidden','true');
    stage.innerHTML=`
      <div class="postcard-preview-head"><span>POSTCARD PREVIEW</span><button type="button" class="postcard-close" aria-label="Close postcard preview">×</button></div>
      <div class="postcard-scene"><div class="postcard-card" tabindex="0" role="button" aria-label="Flip postcard">
        <div class="postcard-face postcard-front"><img id="postcardFrontImg" alt=""><span id="postcardFrontTitle"></span></div>
        <div class="postcard-face postcard-back"><div class="postcard-back-brand">UMS91</div><div class="postcard-back-line"></div><div class="postcard-back-content"><div class="postcard-message">A moment<br>worth keeping.</div><div class="postcard-address"><i></i><i></i><i></i></div></div><div class="postcard-stamp">UMS91<br><small>VISUAL JOURNAL</small></div><div class="postcard-back-footer">PHOTOGRAPH · POSTCARD · MEMORY</div></div>
      </div></div>
      <div class="postcard-preview-controls"><button type="button" class="postcard-flip-btn">FLIP <span>↔</span></button><span>FRONT / BACK</span></div>`;
    modal.appendChild(stage);
    $('.postcard-close',stage).addEventListener('click',closePreview);
    $('.postcard-flip-btn',stage).addEventListener('click',flip);
    $('.postcard-card',stage).addEventListener('click',flip);
    $('.postcard-card',stage).addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();flip()}});
  }
  function syncProduct(){
    const modal=$('#productModal'), img=$('#mImg');
    if(!modal?.classList.contains('open')||!img?.src)return;
    currentProduct={title:$('#mTitle')?.textContent||'UMS91',image:img.getAttribute('src')||img.src};
    const btn=$('#postcardPreviewBtn');
    if(btn && !btn.dataset.postcardBound){btn.dataset.postcardBound='1';btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openPreview()});}
  }
  function openPreview(){
    ensureStage(); if(!currentProduct)return;
    const stage=$('#postcardPreview'), img=$('#postcardFrontImg');
    img.src=currentProduct.image; img.alt=currentProduct.title+' postcard preview'; $('#postcardFrontTitle').textContent=currentProduct.title;
    $('.postcard-card',stage).classList.remove('is-back'); stage.classList.add('open'); stage.setAttribute('aria-hidden','false'); open=true;
  }
  function closePreview(){const stage=$('#postcardPreview');if(!stage)return;stage.classList.remove('open');stage.setAttribute('aria-hidden','true');open=false}
  function flip(){const card=$('.postcard-card');if(card)card.classList.toggle('is-back')}
  function init(){
    ensureStage();
    const modal=$('#productModal');
    if(modal){new MutationObserver(syncProduct).observe(modal,{subtree:true,childList:true,attributes:true,attributeFilter:['src','class']});}
    syncProduct();
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&open)closePreview()});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
