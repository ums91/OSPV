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
  "snow-lake":"A snow-covered lake holds a bare tree and quiet boat against a misty mountain backdrop."
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
function renderProducts(filter="all"){
  const el=$("#products"); if(!el)return;
  const list=filter==="all"?products:products.filter(p=>p.type===filter);
  el.innerHTML=list.map((p,i)=>productCard(p,i)).join("");
  $$(".product").forEach(card=>card.addEventListener("click",e=>{if(!e.target.closest("button"))openProduct(card.dataset.product)}));
  $$('[data-view]').forEach(btn=>btn.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();openProduct(btn.dataset.view)}));
}
function syncOverlayLock(){
  const anyOverlay=["#searchModal","#mobileMenu","#videoModal"].some(id=>$(id)?.classList.contains("open"));
  document.documentElement.classList.toggle("overlay-open",anyOverlay);
  document.body.classList.toggle("overlay-open",anyOverlay);
  const productOpen=$("#productModal")?.classList.contains("open");
  document.body.classList.toggle("product-view-open",!!productOpen);
}
function openProduct(id){
  current=products.find(p=>String(p.id)===String(id)); if(!current)return;
  $("#mImg").src=current.image;
  $("#mImg").alt=current.title;
  $("#mType").textContent=current.type;
  $("#mTitle").textContent=current.title;
  $("#mDesc").textContent=current.description || photoDescriptions[current.id] || "A quiet OMER photograph selected for its atmosphere, light and sense of place.";
  $("#mEdition").textContent=current.edition;
  $("#mSize").textContent=current.size;
  $("#mPrice").textContent=money(current.price);
  close("#cartDrawer");
  const modal=$("#productModal");
  modal.classList.add("open");
  modal.setAttribute("aria-hidden","false");
  syncOverlayLock();
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
function addToCart(id,button=null){
  if(!store){toast("CART IS STILL LOADING");return false;}
  const p=products.find(x=>String(x.id)===String(id));
  if(!p){toast("EDITION NOT FOUND");return false;}
  try{
    const added=store.add(id);
    renderCart(added.id);
    $("#productModal")?.classList.remove("open");
    $("#productModal")?.setAttribute("aria-hidden","true");
    const drawer=$("#cartDrawer");
    if(drawer){drawer.classList.add("open");drawer.setAttribute("aria-hidden","false")}
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
  if(id==="#productModal")document.body.classList.remove("product-view-open");
  syncOverlayLock();
}
async function init(){
  try{
    products=await loadProducts();
    store=new Store(products);
    renderMini();renderProducts();renderCart();loadReels();
  }catch(error){
    console.error(error);
    const el=$("#products");if(el)el.innerHTML=`<div class="catalogue-error"><strong>Collection temporarily unavailable.</strong><span>Please refresh the journal.</span></div>`;
    return;
  }
  $$(".filters button").forEach(b=>b.onclick=()=>{$$(".filters button").forEach(x=>x.classList.remove("active"));b.classList.add("active");renderProducts(b.dataset.filter)});
  $("#bagBtn").onclick=()=>{const drawer=$("#cartDrawer");drawer.classList.toggle("open");drawer.setAttribute("aria-hidden",String(!drawer.classList.contains("open")));renderCart();syncOverlayLock()};
  $$('[data-close]').forEach(b=>b.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();close("#"+b.dataset.close)}));
  $("#addProduct").onclick=()=>{if(current)addToCart(current.id,$("#addProduct"))};
  $("#cartLines").addEventListener("click",e=>{
    const plus=e.target.closest("[data-cart-plus]"),minus=e.target.closest("[data-cart-minus]"),remove=e.target.closest("[data-remove]");
    if(plus){store.increment(plus.dataset.cartPlus);renderCart()}
    else if(minus){store.decrement(minus.dataset.cartMinus);renderCart()}
    else if(remove){store.remove(remove.dataset.remove);renderCart();toast("REMOVED FROM BAG")}
  });
  $("#products")?.addEventListener("click",e=>{
    const btn=e.target.closest("[data-add]");
    if(!btn)return;
    e.preventDefault();e.stopPropagation();
    if(btn.dataset.busy==="1")return;
    btn.dataset.busy="1";
    addToCart(btn.dataset.add,btn);
    setTimeout(()=>delete btn.dataset.busy,350);
  });
  $("#checkout").onclick=async()=>{
    if(!store.count){toast("YOUR CART IS EMPTY");return}
    if(!API_BASE){toast("SECURE CHECKOUT WILL BE CONNECTED LATER");return}
    try{const r=await fetch(`${API_BASE}/api/orders`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({lines:store.items.map(x=>({id:x.id,quantity:x.qty}))})});const data=await r.json();if(!r.ok)throw new Error(data.error||"Checkout failed");if(data.orderId)toast("SECURE ORDER CREATED")}catch(error){toast(error.message.toUpperCase())}
  };
  $("#searchBtn").onclick=()=>{const modal=$("#searchModal");modal.classList.add("open");modal.setAttribute("aria-hidden","false");syncOverlayLock();setTimeout(()=>$("#searchInput")?.focus(),100)};
  $("#searchInput").oninput=e=>{const q=e.target.value.toLowerCase().trim();const hits=products.filter(p=>(p.title+" "+p.type).toLowerCase().includes(q));$("#searchResults").textContent=q?(hits.length?hits.map(x=>x.title).join(" · "):"No editions found."):""};
  $("#menuBtn").onclick=()=>{
    const menu=$("#mobileMenu"),open=!menu.classList.contains("open");
    if(open){menu.classList.add("open");menu.setAttribute("aria-hidden","false")}else close("#mobileMenu");
    $("#menuBtn").setAttribute("aria-expanded",String(open));
    $("#menuBtn").classList.toggle("is-open",open);
    syncOverlayLock();
  };
  $$(".mobile-menu a").forEach(a=>a.onclick=()=>{close("#mobileMenu");$("#menuBtn").setAttribute("aria-expanded","false");$("#menuBtn").classList.remove("is-open")});
  $("#theme").onclick=()=>document.body.classList.toggle("light");
  $("#newsletter").onsubmit=e=>{e.preventDefault();toast("THANK YOU — YOU'RE IN THE JOURNAL");e.target.reset()};
  ["#productModal","#searchModal","#mobileMenu","#videoModal"].forEach(id=>$(id)?.addEventListener("click",e=>{if(e.target===e.currentTarget)close(id)}));
}
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
document.addEventListener("keydown",e=>{if(e.key==="Escape"){["#cartDrawer","#productModal","#searchModal","#mobileMenu","#videoModal"].forEach(close);$("#menuBtn")?.classList.remove("is-open");$("#menuBtn")?.setAttribute("aria-expanded","false")}});

(() => {
  const syncCartLayout = () => {
    const cart=document.querySelector(".cart.open")||document.querySelector(".cart-drawer.open")||document.querySelector("#cart.open")||document.querySelector("#cartDrawer.open");
    document.body.classList.toggle("cart-open",!!cart);
  };
  const observer=new MutationObserver(syncCartLayout);
  const start=()=>{observer.observe(document.body,{subtree:true,attributes:true,attributeFilter:["class","aria-hidden"]});syncCartLayout()};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
