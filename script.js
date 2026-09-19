import { Store, loadProducts, $, $$, money, toast } from "./src/store.js";

const API_BASE = window.OMER_API_BASE || "";
let products = [];
let store = null;
let current = null;

const esc = value => String(value ?? "").replace(/[&<>\"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

/* Concise editorial descriptions for the product viewer. */
const photoDescriptions={
  "mountain-lake":"A clear alpine lake beneath snow-covered mountains, opening into a quiet summer shoreline.",
  "valley-light":"Soft light settles across the valley, bringing out layered slopes and the stillness between the mountains.",
  "winter-lake":"A winter shoreline framed by snow and muted water, almost completely still.",
  "summer-field":"A sunlit field beneath wide summer skies, with a lone tree holding the centre of the frame.",
  "mountain-stream":"A mountain stream cutting through a green valley, surrounded by high slopes and clear alpine light.",
  "quiet-water":"Dark winter water carrying small reflections and distant birds, creating a restrained monochrome moment.",
  "winter-birds":"Snow-covered trees and a quiet lake form a pale winter scene softened by mist.",
  "garden-pool":"A secluded pool surrounded by garden greens, capturing a small pocket of calm.",
  "garden-path":"A quiet path through garden foliage, layered with shade, leaves and light.",
  "orchard-garden":"An orchard-like garden caught in gentle light, where foliage and seasonal colour meet.",
  "rose-study":"A close study of a rose, focused on delicate form, texture and changing light across the petals.",
  "river-stone":"Water moving around weathered stones, balancing texture and motion in a small piece of the landscape.",
  "cloud-valley":"A broad valley disappearing beneath shifting cloud, with the landscape emerging softly through changing light.",
  "courtyard-morning":"Morning light entering a quiet courtyard, revealing simple architectural details and calm.",
  "quiet-interior":"A restrained interior built around soft light, still surfaces and the atmosphere of an unoccupied room.",
  "courtyard-blue-sky":"A quiet garden courtyard framed by tall trees, crisp winter light and an open blue sky.",
  "lake-ridge":"A broad lake opens toward a layered mountain ridge, with a single boat breaking the still blue water.",
  "winter-water":"A muted winter shoreline rests beside calm water, bare trees and distant houses reflected in the grey-blue surface.",
  "snow-lake":"A snow-covered lake holds a bare tree and quiet boat against a misty mountain backdrop.",
  "autumn-stillness":"A quiet autumn clearing beneath tall trees, where fallen leaves turn the ground into a field of copper and the old green cabins settle into the season.",
  "light-after-rain":"Sunlight breaks through a layered sky after rain, stretching long shadows across a quiet field as birds move through the clearing light.",
  "golden-road":"A still road disappears beneath a canopy of autumn gold, framed by tall trees and the warm hush of a late-season afternoon.",
  "blossom-walk":"Pink blossoms lean over a quiet walkway, with old brick, ornate lamps and distant mountains creating a delicate meeting of city and spring.",
  "river-and-ridge":"A clear mountain river moves through a green valley beneath layered forested slopes, with a snow-bright ridge rising quietly in the distance."
};

function productCard(p,i){
  const label=p.type==="Postcard"?"POSTCARD":"FINE ART PRINT";
  return `<article class="product" data-product="${esc(p.id)}">
    <div class="product-image">
      <img src="${esc(p.image)}" alt="${esc(p.title)}" loading="lazy">
      <span class="badge">${i<3?(p.type==="Postcard"?"LIMITED":"SIGNED"):label}</span>
      <div class="product-overlay">
        <div class="product-overlay-meta"><span>${esc(p.type)}</span><strong>${money(p.price)}</strong></div>
        <div class="product-overlay-actions">
          <button type="button" class="quick-view" data-view="${esc(p.id)}">VIEW <span>↗</span></button>
          <button type="button" class="card-add" data-add="${esc(p.id)}">ADD TO BAG <span>+</span></button>
        </div>
      </div>
    </div>
    <div class="product-info"><small>${esc(p.type)} · ${esc(p.edition)}</small><h3>${esc(p.title)}</h3><div><strong>${money(p.price)}</strong><span>${esc(p.size)}</span></div></div>
  </article>`;
}
function renderMini(){
  const el=$("#miniProducts"); if(!el)return;
  el.innerHTML=products.slice(0,3).map(p=>`<article class="mini" data-product="${esc(p.id)}"><img src="${esc(p.image)}" alt="${esc(p.title)}" loading="lazy"><div class="mini-info"><h3>${esc(p.title)}</h3><p>${esc(p.type)}</p><strong>${money(p.price)}</strong></div></article>`).join("");
  $$(".mini").forEach(x=>x.onclick=()=>openProduct(x.dataset.product));
}
const collectionMembers={
  landscapes:new Set(["mountain-lake","valley-light","winter-lake","summer-field","mountain-stream","quiet-water","winter-birds","river-stone","cloud-valley","lake-ridge","winter-water","snow-lake","light-after-rain","golden-road","river-and-ridge"]),
  autumn:new Set(["autumn-stillness","golden-road","light-after-rain"]),
  winter:new Set(["winter-lake","winter-birds","quiet-water","cloud-valley","courtyard-blue-sky","winter-water","snow-lake"]),
  architecture:new Set(["garden-pool","garden-path","orchard-garden","courtyard-morning","quiet-interior","courtyard-blue-sky","rose-study"])
};
const collectionLabels={all:"Showing the complete UMS91 archive.",landscapes:"Landscapes, water and open country from the UMS91 archive.",autumn:"Autumn frames selected for warm light, foliage and seasonal atmosphere.",winter:"Winter frames shaped by snow, muted water and colder light.",architecture:"Courtyards, gardens and built spaces from the visual archive."};
let activeCollection="all";
let activeType="all";
let activeSort="curated";
let visibleCount=6;
const LOAD_MORE_STEP=6;
function renderProducts(type=activeType,collection=activeCollection){
  const el=$("#products"); if(!el)return;
  activeType=type; activeCollection=collection;
  const members=collectionMembers[collection];
  let list=products.filter(p=>(type==="all"||p.type===type)&&(!members||members.has(String(p.id))));
  if(activeSort==="price-low") list=[...list].sort((a,b)=>Number(a.price)-Number(b.price));
  else if(activeSort==="price-high") list=[...list].sort((a,b)=>Number(b.price)-Number(a.price));
  else if(activeSort==="title") list=[...list].sort((a,b)=>String(a.title).localeCompare(String(b.title)));
  const shown=list.slice(0,visibleCount);
  el.innerHTML=shown.map((p,i)=>productCard(p,i)).join("");
  const context=$("#collectionContext");
  if(context)context.textContent=collectionLabels[collection]||collectionLabels.all;
  const more=$("#loadMoreBtn"), meta=$("#loadMoreMeta"), wrap=$("#loadMoreWrap");
  if(more&&wrap){
    const remaining=Math.max(0,list.length-shown.length);
    more.hidden=remaining===0;
    more.disabled=remaining===0;
    if(remaining>0)more.innerHTML=`LOAD MORE <span>→</span>`;
    if(meta)meta.textContent=remaining>0?`${shown.length} OF ${list.length} WORKS · ${remaining} REMAINING`:list.length?`SHOWING ALL ${list.length} WORKS`:"";
  }
  $$(".product").forEach(card=>card.addEventListener("click",e=>{if(!e.target.closest("button"))openProduct(card.dataset.product)}));
  $$('[data-view]').forEach(btn=>btn.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();openProduct(btn.dataset.view)}));
}
function syncCollectionTabs(){
  $$(".collection-tab").forEach(btn=>{
    const active=btn.dataset.collection===activeCollection;
    btn.classList.toggle("active",active);
    btn.setAttribute("aria-selected",active?"true":"false");
  });
}
function collectionIconMarkup(name){
  const icons={
    all:'<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>',
    landscapes:'<svg viewBox="0 0 28 24"><path d="M2 21 10.5 9l4.3 5.2L18 8l8 13Z"/><path d="M8 16.2 10.5 13l2.2 2.7"/></svg>',
    autumn:'<svg viewBox="0 0 24 24"><path d="M12 21c-1-5.2.1-10.4 5.9-15.8C19 11.2 17.5 17.7 12 21Z"/><path d="M12 21c-2.4-4.1-5.2-6.8-8.8-8.2C4.5 18 8.2 20.5 12 21Z"/><path d="M12 21V7"/></svg>',
    winter:'<svg viewBox="0 0 24 24"><path d="M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M7.5 4.6 12 9l4.5-4.4M7.5 19.4 12 15l4.5 4.4M4.2 12h15.6"/></svg>',
    architecture:'<svg viewBox="0 0 24 24"><path d="M4 21h16M6 18V8h12v10M3 8h18M5 5h14M8 3h8M9 11v7M15 11v7"/></svg>'
  };
  return icons[name]||icons.all;
}
function syncTypeFilters(){
  $$(".filters [data-filter]").forEach(btn=>btn.classList.toggle("active",btn.dataset.filter===activeType));
}
function syncArchiveControls(){
  const label=$("#collectionFilterLabel");
  const icon=$("[data-control-icon=collection]");
  if(label) label.textContent=({all:"ALL WORKS",landscapes:"LANDSCAPES",autumn:"AUTUMN",winter:"WINTER",architecture:"ARCHITECTURE"}[activeCollection]||"ALL WORKS");
  if(icon) icon.innerHTML=collectionIconMarkup(activeCollection);
  $$("[data-menu-collection]").forEach(btn=>btn.classList.toggle("active",btn.dataset.menuCollection===activeCollection));
  $$("[data-menu-type]").forEach(btn=>btn.classList.toggle("active",btn.dataset.menuType===activeType));
  $$("[data-sort]").forEach(btn=>btn.classList.toggle("active",btn.dataset.sort===activeSort));
}
function closeArchiveMenus(except){
  ["collectionFilterMenu","formatFilterMenu","sortMenu"].forEach(id=>{
    const menu=$("#"+id),btn=$("#"+({collectionFilterMenu:"collectionFilterBtn",formatFilterMenu:"formatFilterBtn",sortMenu:"sortBtn"}[id]));
    if(!menu||!btn)return;
    if(id!==except){menu.hidden=true;btn.setAttribute("aria-expanded","false");}
  });
}
function toggleArchiveMenu(menuId,buttonId){
  const menu=$("#"+menuId),btn=$("#"+buttonId); if(!menu||!btn)return;
  const opening=menu.hidden; closeArchiveMenus(opening?menuId:null); menu.hidden=!opening; btn.setAttribute("aria-expanded",opening?"true":"false");
}
function syncOverlayLock(){
  const anyOverlay=["#searchModal","#mobileMenu","#videoModal"].some(id=>$(id)?.classList.contains("open"));
  document.documentElement.classList.toggle("overlay-open",anyOverlay);
  document.body.classList.toggle("overlay-open",anyOverlay);
  const productOpen=$("#productModal")?.classList.contains("open");
  document.body.classList.toggle("product-view-open",!!productOpen);
}
function setPhotoUrl(id){
  try{
    const url=new URL(window.location.href);
    url.searchParams.set("photo",String(id));
    // Keep the shareable photo URL without adding a browser-history entry.
    window.history.replaceState({},document.title,url.pathname+url.search+url.hash);
  }catch(_){}
}
function clearPhotoUrl(){
  try{
    const url=new URL(window.location.href);
    if(!url.searchParams.has("photo"))return;
    url.searchParams.delete("photo");
    window.history.replaceState({},document.title,url.pathname+url.search+url.hash);
  }catch(_){}
}
function updatePhotoDiscoverability(photo){
  if(!photo)return;
  const title=`${photo.title} — UMS91 Visual Journal`;
  const description=photo.description || `${photo.title} — a photograph from the UMS91 Visual Journal collection.`;
  document.title=title;
  const setMeta=(selector,content)=>{const el=document.querySelector(selector);if(el)el.setAttribute("content",content)};
  setMeta('meta[name="description"]',description);
  setMeta('meta[property="og:title"]',title);
  setMeta('meta[property="og:description"]',description);
  setMeta('meta[property="og:image"]',new URL(photo.image,window.location.href).href);
  setMeta('meta[property="og:image:alt"]',photo.title);
  setMeta('meta[name="twitter:title"]',title);
  setMeta('meta[name="twitter:description"]',description);
  setMeta('meta[name="twitter:image"]',new URL(photo.image,window.location.href).href);
  setMeta('meta[name="twitter:image:alt"]',photo.title);
}
function resetSiteDiscoverability(){
  document.title="UMS91 — Visual Journal";
  const setMeta=(selector,content)=>{const el=document.querySelector(selector);if(el)el.setAttribute("content",content)};
  setMeta('meta[name="description"]','UMS91 Visual Journal — photography from Kashmir, visual stories, motion and collectible fine-art editions.');
  setMeta('meta[property="og:title"]','UMS91 — Visual Journal');
  setMeta('meta[property="og:description"]','Photography from Kashmir, visual stories, motion and collectible fine-art editions.');
  setMeta('meta[property="og:image"]',new URL('assets/hero-autumn-kashmir.jpg',window.location.href).href);
  setMeta('meta[property="og:image:alt"]','Autumn Kashmir landscape with mountains and a traditional wooden pavilion');
  setMeta('meta[name="twitter:title"]','UMS91 — Visual Journal');
  setMeta('meta[name="twitter:description"]','Photography from Kashmir, visual stories, motion and collectible fine-art editions.');
  setMeta('meta[name="twitter:image"]',new URL('assets/hero-autumn-kashmir.jpg',window.location.href).href);
  setMeta('meta[name="twitter:image:alt"]','Autumn Kashmir landscape with mountains and a traditional wooden pavilion');
}
function updatePhotoViewerNav(){
  const count=$("#photoViewCount"),prev=$("#photoPrev"),next=$("#photoNext");
  if(!current||!products.length)return;
  const index=products.findIndex(p=>String(p.id)===String(current.id));
  if(index<0)return;
  if(count)count.textContent=`${String(index+1).padStart(2,"0")} / ${String(products.length).padStart(2,"0")}`;
  if(prev){prev.disabled=products.length<2;prev.setAttribute("aria-label",`Previous photograph: ${products[(index-1+products.length)%products.length]?.title||""}`)}
  if(next){next.disabled=products.length<2;next.setAttribute("aria-label",`Next photograph: ${products[(index+1)%products.length]?.title||""}`)}
}
function stepPhoto(direction){
  if(!current||products.length<2)return;
  const index=products.findIndex(p=>String(p.id)===String(current.id));
  if(index<0)return;
  const nextIndex=(index+direction+products.length)%products.length;
  openProduct(products[nextIndex].id,{preserveDrawer:true});
}
function openProduct(id,options={}){
  current=products.find(p=>String(p.id)===String(id)); if(!current)return;
  setPhotoUrl(current.id);
  updatePhotoDiscoverability(current);
  $("#mImg").src=current.image;
  $("#mImg").alt=current.title;
  $("#mType").textContent=current.type;
  $("#mTitle").textContent=current.title;
  $("#mDesc").textContent=current.description || photoDescriptions[current.id] || "A quiet UMS91 photograph selected for its atmosphere, light and sense of place.";
  $("#mEdition").textContent=current.edition;
  $("#mSize").textContent=current.size;
  $("#mPrice").textContent=money(current.price);
  updatePhotoViewerNav();
  if(!options.preserveDrawer)close("#cartDrawer");
  const modal=$("#productModal");
  modal.classList.add("open");
  modal.setAttribute("aria-hidden","false");
  syncOverlayLock();
}
function photoShareUrl(){
  const id=current?.id;
  if(!id)return window.location.href;
  const base=new URL(window.location.href);
  return new URL(`photos/${encodeURIComponent(String(id))}.html`,base).toString();
}
function photoShareText(){
  const title=current?.title||"UMS91 Photograph";
  return `${title} · UMS91 Visual Journal`;
}
function setShareStatus(message){
  const el=$("#shareStatus");
  if(!el)return;
  el.textContent=message||"";
  el.classList.toggle("is-visible",!!message);
  clearTimeout(el.__shareTimer);
  if(message)el.__shareTimer=setTimeout(()=>{el.textContent="";el.classList.remove("is-visible")},2200);
}
async function copyPhotoLink(){
  const url=photoShareUrl();
  try{
    if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(url);
    else{
      const area=document.createElement("textarea");
      area.value=url;area.setAttribute("readonly","");
      area.style.position="fixed";area.style.opacity="0";
      document.body.appendChild(area);area.select();document.execCommand("copy");area.remove();
    }
    setShareStatus("LINK COPIED");
    toast("PHOTO LINK COPIED");
    return true;
  }catch(error){
    console.warn("UMS91 copy link failed:",error);
    setShareStatus("COPY FAILED");
    toast("COPY FAILED — PLEASE TRY AGAIN");
    return false;
  }
}
function openShareFallback(){
  const fallback=$("#shareFallback");
  if(fallback)fallback.hidden=!fallback.hidden;
}
function openPhotoShareChannel(channel){
  const url=photoShareUrl();
  const title=photoShareText();
  const encodedUrl=encodeURIComponent(url);
  const encodedText=encodeURIComponent(`${title}\n${url}`);
  const targets={
    whatsapp:`https://wa.me/?text=${encodedText}`,
    facebook:`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    x:`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodedUrl}`,
    email:`mailto:?subject=${encodeURIComponent(title)}&body=${encodedText}`
  };
  const target=targets[channel];
  if(!target)return;
  if(channel==="email")window.location.href=target;
  else window.open(target,"_blank","noopener,noreferrer,width=680,height=720");
  const fallback=$("#shareFallback");if(fallback)fallback.hidden=true;
}
async function sharePhoto(){
  if(!current)return;
  const shareData={title:photoShareText(),text:`${current.title} — UMS91 Visual Journal`,url:photoShareUrl()};
  if(navigator.share){
    try{
      await navigator.share(shareData);
      setShareStatus("SHARED");
      return;
    }catch(error){
      if(error?.name==="AbortError")return;
      console.warn("UMS91 native share unavailable:",error);
    }
  }
  openShareFallback();
}
function renderCart(newId=null){
  if(!store)return;
  const items=store.items;
  const count=store.count;
  const bag=$("#bagCount"), dc=$("#drawerCount"), sub=$("#subtotal"), container=$("#cartLines");
  if(bag)bag.textContent=count;
  if(dc)dc.textContent=count;
  if(sub)sub.textContent=money(store.total);
  if(!container)return;
  if(!items.length){
    container.innerHTML=`<div class="cart-empty"><strong>Your bag is empty.</strong><p>Choose an edition from the collection and it will appear here.</p><a href="#shop" id="emptyShopLink">EXPLORE EDITIONS →</a></div>`;
    $("#emptyShopLink")?.addEventListener("click",()=>close("#cartDrawer"));
    return;
  }
  container.innerHTML=items.map(x=>`<div class="cart-line${newId!==null&&String(newId)===String(x.id)?" cart-line-new":""}" data-cart-line="${esc(x.id)}">
    <img src="${esc(x.product.image)}" alt="${esc(x.product.title)}">
    <div><h4>${esc(x.product.title)}</h4><small>${money(x.product.price)} · ${esc(x.product.type)}</small><div class="cart-controls"><button type="button" data-cart-minus="${esc(x.id)}" aria-label="Decrease quantity">−</button><span>${x.qty}</span><button type="button" data-cart-plus="${esc(x.id)}" aria-label="Increase quantity">+</button></div></div>
    <button class="cart-remove" type="button" data-remove="${esc(x.id)}" aria-label="Remove ${esc(x.product.title)}">×</button>
  </div>`).join("");
}
function confirmCart(button){
  if(button){
    const old=button.dataset.originalLabel||button.innerHTML;
    button.dataset.originalLabel=old;
    button.innerHTML="ADDED TO BAG <span>✓</span>";
    button.classList.add("is-added");
    clearTimeout(button.__cartTimer);
    button.__cartTimer=setTimeout(()=>{button.innerHTML=old;button.classList.remove("is-added")},1800);
  }
  const bag=$("#bagBtn"), count=$("#bagCount");
  [bag,count].forEach(el=>{if(!el)return;el.classList.remove("bag-pulse");void el.offsetWidth;el.classList.add("bag-pulse")});
  toast("1 ITEM ADDED TO CART");
}
function closeCommerceForBag(){
  ["#checkoutPanel","#orderStatusPanel","#orderSuccess"].forEach(id=>{
    const el=$(id);
    if(el){el.classList.remove("open");el.setAttribute("aria-hidden","true");}
  });
  document.body.classList.remove("commerce-open");
  const url=new URL(window.location.href);
  let changed=false;
  ["orderId","token"].forEach(key=>{if(url.searchParams.has(key)){url.searchParams.delete(key);changed=true;}});
  if(changed)window.history.replaceState({},document.title,url.pathname+url.search+url.hash);
}
function openBagDrawer(){
  // BAG is always a shopping-bag action. It must never open Order Status.
  const status=$("#orderStatusPanel");
  const checkout=$("#checkoutPanel");
  const success=$("#orderSuccess");
  [status,checkout,success].forEach(el=>{
    if(el){el.classList.remove("open");el.setAttribute("aria-hidden","true");}
  });
  document.body.classList.remove("commerce-open");

  // Remove stale private-order parameters so a previous order link cannot
  // re-open Order Status during the current shopping session.
  try{
    const url=new URL(window.location.href);
    let changed=false;
    ["orderId","token"].forEach(key=>{
      if(url.searchParams.has(key)){url.searchParams.delete(key);changed=true;}
    });
    if(changed)window.history.replaceState({},document.title,url.pathname+url.search+url.hash);
  }catch(_){}

  const drawer=$("#cartDrawer");
  if(!drawer)return;
  drawer.classList.add("open");
  drawer.setAttribute("aria-hidden","false");
  document.body.classList.add("bag-is-open");
  const bag=$("#bagBtn");
  if(bag)bag.setAttribute("aria-expanded","true");
  renderCart();
  syncOverlayLock();
}
function addToCart(id,button=null){
  closeCommerceForBag();
  if(!store){toast("CART IS STILL LOADING");return false;}
  const p=products.find(x=>String(x.id)===String(id));
  if(!p){toast("EDITION NOT FOUND");return false;}
  try{
    const added=store.add(id);
    renderCart(added.id);
    close("#productModal");
    const drawer=$("#cartDrawer");
    if(drawer){drawer.classList.add("open");drawer.setAttribute("aria-hidden","false");document.body.classList.add("bag-is-open")}
    syncOverlayLock();
    confirmCart(button);
    return true;
  }catch(error){
    console.error("OMER cart add failed:",error);
    toast("UNABLE TO ADD TO BAG");
    return false;
  }
}
async function loadReels(){
  const grid=$("#reelGrid"); if(!grid)return;
  try{
    const r=await fetch(`assets/reels.json?v=20260823-3reels-cartfix`,{cache:"no-store"});
    if(!r.ok)throw new Error("Reels unavailable");
    const reels=await r.json();
    if(!Array.isArray(reels)||!reels.length){grid.innerHTML=`<div class="reel-empty">NEW MOVING FRAMES WILL APPEAR HERE.</div>`;return;}
    grid.innerHTML=reels.map((reel,i)=>`<article class="reel-card" data-reel="${esc(reel.file)}" data-label="FRAME ${String(i+1).padStart(2,"0")}"><video class="reel-preview" src="${esc(reel.file)}" poster="${esc(reel.poster||"")}" muted playsinline preload="metadata"></video><div class="reel-shade"></div><div class="reel-card-top"><span>MOVING FRAME</span><span>${String(i+1).padStart(2,"0")}</span></div><div class="reel-info"><small>@UMS91 · MOTION</small><span class="reel-play">▶</span></div></article>`).join("");
    $$(".reel-card").forEach(card=>card.addEventListener("click",()=>openReel(card.dataset.reel,card.dataset.label)));
  }catch(e){console.error(e);grid.innerHTML=`<div class="reel-empty">MOVING FRAMES ARE TEMPORARILY UNAVAILABLE.</div>`}
}
function openReel(src,label){
  const modal=$("#videoModal"),video=$("#activeVideo"),title=$("#videoLabel");
  if(!modal||!video)return;
  video.pause();video.src=src;video.load();
  if(title)title.textContent=label||"MOVING FRAME";
  modal.classList.add("open");modal.setAttribute("aria-hidden","false");syncOverlayLock();
  video.play().catch(()=>{});
}
function close(id){
  const el=$(id);if(!el)return;
  el.classList.remove("open");el.setAttribute("aria-hidden","true");
  if(id==="#videoModal"){
    const v=$("#activeVideo");if(v){v.pause();v.removeAttribute("src");v.load()}
  }
  if(id==="#productModal"){
    document.body.classList.remove("product-view-open");
    clearPhotoUrl();
    resetSiteDiscoverability();
  }
  if(id==="#cartDrawer"){
    document.body.classList.remove("bag-is-open");
    const bag=$("#bagBtn");
    if(bag)bag.setAttribute("aria-expanded","false");
  }
  syncOverlayLock();
}
async function init(){
  try{
    products=await loadProducts();
    store=new Store(products);
    renderMini();renderProducts();syncCollectionTabs();syncArchiveControls();syncTypeFilters();renderCart();loadReels();
    // If a photograph URL was shared directly, open that exact photograph.
    try{
      const photoId=new URL(window.location.href).searchParams.get("photo");
      if(photoId)openProduct(photoId);
    }catch(_){}
  }catch(error){
    console.error(error);
    const el=$("#products");if(el)el.innerHTML=`<div class="catalogue-error"><strong>Collection temporarily unavailable.</strong><span>Please refresh the journal.</span></div>`;
    return;
  }
  window.store=store;
  window.renderCart=renderCart;
  window.OMER_CLOSE=close;
  window.OMER_TOAST=toast;
  // Single commerce event delegation. BAG and ADD TO BAG are intentionally
  // handled here and nowhere else in the checkout system.
  document.addEventListener("click",e=>{
    const bag=e.target.closest?.("#bagBtn");
    if(bag){
      e.preventDefault();
      e.stopPropagation();
      openBagDrawer();
      return;
    }
    const share=e.target.closest?.("#sharePhoto");
    if(share){
      e.preventDefault();e.stopPropagation();
      sharePhoto();
      return;
    }
    const copyLink=e.target.closest?.("#copyPhotoLink");
    if(copyLink){
      e.preventDefault();e.stopPropagation();
      copyPhotoLink();
      return;
    }
    const photoPrev=e.target.closest?.("#photoPrev");
    if(photoPrev){
      e.preventDefault();e.stopPropagation();
      stepPhoto(-1);
      return;
    }
    const photoNext=e.target.closest?.("#photoNext");
    if(photoNext){
      e.preventDefault();e.stopPropagation();
      stepPhoto(1);
      return;
    }
    const shareChannel=e.target.closest?.("[data-share-channel]");
    if(shareChannel){
      e.preventDefault();e.stopPropagation();
      openPhotoShareChannel(shareChannel.dataset.shareChannel);
      return;
    }
    const add=e.target.closest?.("[data-add],#addProduct");
    if(add){
      e.preventDefault();
      e.stopPropagation();
      if(add.dataset.busy==="1")return;
      add.dataset.busy="1";
      const id=add.dataset.add || current?.id;
      if(id)addToCart(id,add);
      setTimeout(()=>delete add.dataset.busy,350);
    }
  });

  $$(".collection-tab").forEach(b=>b.onclick=()=>{
    activeCollection=b.dataset.collection;
    visibleCount=6;
    syncCollectionTabs();
    syncArchiveControls();
    renderProducts(activeType,activeCollection);
  });
  $("#collectionFilterBtn")?.addEventListener("click",e=>{e.stopPropagation();toggleArchiveMenu("collectionFilterMenu","collectionFilterBtn")});
  $("#formatFilterBtn")?.addEventListener("click",e=>{e.stopPropagation();toggleArchiveMenu("formatFilterMenu","formatFilterBtn")});
  $("#sortBtn")?.addEventListener("click",e=>{e.stopPropagation();toggleArchiveMenu("sortMenu","sortBtn")});
  $$("[data-menu-collection]").forEach(b=>b.addEventListener("click",e=>{
    e.stopPropagation(); activeCollection=b.dataset.menuCollection; visibleCount=6; syncCollectionTabs(); syncArchiveControls(); renderProducts(activeType,activeCollection); closeArchiveMenus();
  }));
  $$("[data-menu-type]").forEach(b=>b.addEventListener("click",e=>{
    e.stopPropagation(); activeType=b.dataset.menuType; visibleCount=6; syncArchiveControls(); renderProducts(activeType,activeCollection); closeArchiveMenus();
  }));
  $$("[data-sort]").forEach(b=>b.addEventListener("click",e=>{
    e.stopPropagation(); activeSort=b.dataset.sort; visibleCount=6; syncArchiveControls(); renderProducts(activeType,activeCollection); closeArchiveMenus();
  }));
  $("#loadMoreBtn")?.addEventListener("click",()=>{
    visibleCount+=LOAD_MORE_STEP;
    renderProducts(activeType,activeCollection);
  });
  document.addEventListener("click",e=>{if(!e.target.closest(".archive-control-group"))closeArchiveMenus()});
  $$('[data-close]').forEach(b=>b.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();close("#"+b.dataset.close)}));
  $("#cartLines").addEventListener("click",e=>{
    const plus=e.target.closest("[data-cart-plus]"),minus=e.target.closest("[data-cart-minus]"),remove=e.target.closest("[data-remove]");
    if(plus){store.increment(plus.dataset.cartPlus);renderCart()}
    else if(minus){store.decrement(minus.dataset.cartMinus);renderCart()}
    else if(remove){store.remove(remove.dataset.remove);renderCart();toast("REMOVED FROM BAG")}
  });
  $("#searchBtn").onclick=()=>{const modal=$("#searchModal");modal.classList.add("open");modal.setAttribute("aria-hidden","false");syncOverlayLock();setTimeout(()=>$("#searchInput")?.focus(),100)};
  const renderSearchResults=()=>{
    const input=$("#searchInput"), results=$("#searchResults");
    if(!input||!results)return;
    const q=input.value.toLowerCase().trim();
    if(!q){results.innerHTML="";return;}
    const terms=q.split(/\s+/).filter(Boolean);
    const hits=products.filter(p=>{
      const haystack=[p.title,p.type,p.edition,p.description,photoDescriptions[p.id]||""].join(" ").toLowerCase();
      return terms.every(term=>haystack.includes(term));
    });
    if(!hits.length){results.innerHTML='<span class="search-no-results">No photographs found.</span>';return;}
    results.innerHTML=hits.map(p=>`<button type="button" class="search-result" data-search-product="${esc(p.id)}"><span><strong>${esc(p.title)}</strong><small>${esc(p.type)}${p.edition?" · "+esc(p.edition):""}</small></span><b>↗</b></button>`).join("");
  };
  $("#searchInput").oninput=renderSearchResults;
  $("#searchResults")?.addEventListener("click",e=>{
    const result=e.target.closest?.("[data-search-product]");
    if(!result)return;
    e.preventDefault();
    const id=result.dataset.searchProduct;
    close("#searchModal");
    openProduct(id);
  });
  $("#menuBtn").onclick=()=>{
    const menu=$("#mobileMenu"),open=!menu.classList.contains("open");
    if(open){menu.classList.add("open");menu.setAttribute("aria-hidden","false")}else close("#mobileMenu");
    $("#menuBtn").setAttribute("aria-expanded",String(open));
    $("#menuBtn").classList.toggle("is-open",open);
    syncOverlayLock();
  };
  $$(".mobile-menu a").forEach(a=>a.onclick=()=>{close("#mobileMenu");$("#menuBtn").setAttribute("aria-expanded","false");$("#menuBtn").classList.remove("is-open")});
  $("#theme").onclick=()=>document.body.classList.toggle("light");
  const newsletterForm=$("#newsletter");
  if(newsletterForm){
    newsletterForm.onsubmit=async e=>{
      e.preventDefault();
      const email=String(new FormData(newsletterForm).get("email")||"").trim().toLowerCase();
      const message=$("#newsletterMessage");
      if(!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
        if(message){message.textContent="PLEASE ENTER A VALID EMAIL ADDRESS.";message.classList.add("is-error");}
        return;
      }
      const button=newsletterForm.querySelector("button");
      const original=button?.textContent||"SUBSCRIBE →";
      if(button){button.disabled=true;button.textContent="SUBSCRIBING…";}
      if(message){message.textContent="";message.classList.remove("is-error");}
      const subscribeUrl="https://script.google.com/macros/s/AKfycbynmk_BVUqp9xgoLns34S1RlIP6YzeRgoz_bjWqlLUNLorQhQhUeZonGLYWxF44DUeq/exec";
      const sendSubscription=async()=>{
        const controller=new AbortController();
        const timeout=setTimeout(()=>controller.abort(),12000);
        try{
          const response=await fetch(subscribeUrl,{
            method:"POST",
            headers:{"Content-Type":"text/plain;charset=utf-8"},
            body:JSON.stringify({action:"subscribe",email}),
            cache:"no-store",
            signal:controller.signal
          });
          const text=await response.text();
          let data;
          try{data=JSON.parse(text)}catch(_){throw new Error("Subscription service returned an invalid response.")}
          if(!data.success)throw new Error(data.error||"Unable to subscribe.");
          return data;
        }finally{clearTimeout(timeout)}
      };
      try{
        let data;
        try{
          data=await sendSubscription();
        }catch(firstError){
          // Apps Script can complete the Sheet/email operation before its browser
          // response reaches the page. A single retry is safe because the server
          // treats an existing email as already subscribed.
          console.warn("UMS91 subscription response delayed; retrying once.",firstError);
          await new Promise(resolve=>setTimeout(resolve,900));
          data=await sendSubscription();
        }
        if(message){message.textContent=data.message||"YOU’RE IN THE JOURNAL — WATCH FOR NEW PHOTOGRAPHS AND EDITION RELEASES.";message.classList.remove("is-error");}
        newsletterForm.reset();
      }catch(error){
        console.error("UMS91 newsletter subscription failed:",error);
        if(message){message.textContent="WE COULDN’T COMPLETE THE SUBSCRIPTION. PLEASE TRY AGAIN.";message.classList.add("is-error");}
      }finally{
        if(button){button.disabled=false;button.textContent=original;}
      }
    };
  }
  ["#productModal","#searchModal","#mobileMenu","#videoModal"].forEach(id=>$(id)?.addEventListener("click",e=>{if(e.target===e.currentTarget)close(id)}));
}

/* Autumn Chinar leaves: same slow, ambient fall language as the wedding reference. */
(function initChinarLeaves(){
  const ambient=document.getElementById("chinarAmbient");
  if(!ambient)return;
  const reduced=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobile=window.matchMedia&&window.matchMedia("(max-width:720px)").matches;
  const colors=["#a8432a","#b8542e","#c36532","#d17835","#91402a","#9f4828","#c8753a"];
  const count=mobile?7:9;
  const rand=(a,b)=>a+Math.random()*(b-a);

  for(let i=0;i<count;i++){
    const leaf=document.createElement("span");
    leaf.className="chinar-leaf";
    leaf.style.left=rand(0,100).toFixed(2)+"%";
    leaf.style.setProperty("--leaf-size",rand(mobile?16:19,mobile?25:34).toFixed(1)+"px");
    leaf.style.setProperty("--leaf-color",colors[Math.floor(Math.random()*colors.length)]);
    leaf.style.setProperty("--drift",rand(-170,170).toFixed(0)+"px");
    leaf.style.setProperty("--spin",rand(-620,620).toFixed(0)+"deg");
    leaf.style.setProperty("--r0",rand(-32,32).toFixed(0)+"deg");
    leaf.style.setProperty("--vein-tilt",rand(-7,7).toFixed(0)+"deg");
    leaf.style.setProperty("--scale",rand(.72,1.16).toFixed(2));
    leaf.style.setProperty("--opacity",rand(.46,.72).toFixed(2));
    leaf.style.setProperty("--fall",rand(10.5,16.5).toFixed(2)+"s");
    leaf.style.setProperty("--delay",(-rand(0,16)).toFixed(2)+"s");
    ambient.appendChild(leaf);
  }
  if(reduced)ambient.setAttribute("data-motion-disabled","true");
})();
init();
addEventListener("scroll",()=>{const max=document.documentElement.scrollHeight-innerHeight;const progress=$(".progress i");if(progress)progress.style.width=`${max?scrollY/max*100:0}%`},{passive:true});
if(matchMedia("(pointer:fine)").matches){
  const c=$(".cursor");
  addEventListener("mousemove",e=>{if(c){c.style.left=e.clientX+"px";c.style.top=e.clientY+"px"}});
  document.addEventListener("mouseover",e=>{
    if(!c)return;
    c.classList.toggle("cursor-photo",!!e.target.closest(".product-image,.editorial-journal-feature,.editorial-note-media,.editorial-archive-main,.editorial-archive-side,.edition-page"));
  });
}
document.addEventListener("keydown",e=>{
  if(e.key==="Escape"){["#cartDrawer","#productModal","#searchModal","#mobileMenu","#videoModal"].forEach(close);$("#menuBtn")?.classList.remove("is-open");$("#menuBtn")?.setAttribute("aria-expanded","false");return}
  if(!$("#productModal")?.classList.contains("open"))return;
  if(e.key==="ArrowLeft"){e.preventDefault();stepPhoto(-1)}
  if(e.key==="ArrowRight"){e.preventDefault();stepPhoto(1)}
});

(() => {
  const syncCartLayout = () => {
    const cart=document.querySelector(".cart.open")||document.querySelector(".cart-drawer.open")||document.querySelector("#cart.open")||document.querySelector("#cartDrawer.open");
    document.body.classList.toggle("cart-open",!!cart);
  };
  const observer=new MutationObserver(syncCartLayout);
  const start=()=>{observer.observe(document.body,{subtree:true,attributes:true,attributeFilter:["class","aria-hidden"]});syncCartLayout()};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
