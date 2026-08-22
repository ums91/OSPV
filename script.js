import { Store, loadProducts, $, $$, money, toast } from "./src/store.js";

const API_BASE = window.OMER_API_BASE || "";
let products = [];
let store = null;
let current = null;

const esc = value => String(value ?? "").replace(/[&<>\"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

function productCard(p, i) {
  const label = p.type === "Postcard" ? "POSTCARD" : "FINE ART PRINT";
  return `<article class="product" data-product="${esc(p.id)}">
    <div class="product-image">
      <img src="${esc(p.image)}" alt="${esc(p.title)}" loading="lazy">
      <span class="badge">${i < 3 ? (p.type === "Postcard" ? "LIMITED" : "SIGNED") : label}</span>
      <div class="product-overlay">
        <div class="product-overlay-meta"><span>${esc(p.type)}</span><strong>${money(p.price)}</strong></div>
        <div class="product-overlay-actions">
          <button type="button" class="quick-view" data-view="${esc(p.id)}">VIEW <span>↗</span></button>
          <button type="button" class="card-add" data-add="${esc(p.id)}">ADD TO BAG <span>+</span></button>
        </div>
      </div>
    </div>
    <div class="product-info">
      <small>${esc(p.type)} · ${esc(p.edition)}</small>
      <h3>${esc(p.title)}</h3>
      <div><strong>${money(p.price)}</strong><span>${esc(p.size)}</span></div>
    </div>
  </article>`;
}

function renderMini(){
  const el=$("#miniProducts"); if(!el) return;
  el.innerHTML=products.slice(0,3).map(p=>`<article class="mini" data-product="${esc(p.id)}"><img src="${esc(p.image)}" alt="${esc(p.title)}" loading="lazy"><div class="mini-info"><h3>${esc(p.title)}</h3><p>${esc(p.type)}</p><strong>${money(p.price)}</strong></div></article>`).join("");
  $$(".mini").forEach(x=>x.onclick=()=>openProduct(x.dataset.product));
}

function renderProducts(filter="all"){
  const el=$("#products"); if(!el) return;
  const list=filter==="all"?products:products.filter(p=>p.type===filter);
  el.innerHTML=list.map((p,i)=>productCard(p,i)).join("");
  $$(".product").forEach(card=>card.addEventListener("click",e=>{if(!e.target.closest("button"))openProduct(card.dataset.product)}));
  $$('[data-view]').forEach(btn=>btn.addEventListener("click",e=>{e.stopPropagation();openProduct(btn.dataset.view)}));
  $$('[data-add]').forEach(btn=>btn.addEventListener("click",e=>{e.stopPropagation();addToCart(btn.dataset.add)}));
}

function openProduct(id){
  current=products.find(p=>p.id===id); if(!current)return;
  $("#mImg").src=current.image; $("#mImg").alt=current.title;
  $("#mType").textContent=current.type; $("#mTitle").textContent=current.title;
  $("#mDesc").textContent="A carefully selected OMER photograph, offered as a considered paper object for collectors of quiet images.";
  $("#mEdition").textContent=current.edition; $("#mSize").textContent=current.size; $("#mPrice").textContent=money(current.price);
  $("#productModal").classList.add("open");
}

function renderCart(){
  if(!store)return;
  const items=store.items;
  $("#bagCount").textContent=store.count;
  $("#drawerCount").textContent=store.count;
  $("#subtotal").textContent=money(store.total);
  const container=$("#cartLines");
  if(!items.length){
    container.innerHTML=`<div class="cart-empty"><strong>Your bag is empty.</strong><p>Choose an edition from the collection and it will appear here.</p><a href="#shop" id="emptyShopLink">EXPLORE EDITIONS →</a></div>`;
    $("#emptyShopLink")?.addEventListener("click",()=>$("#cartDrawer").classList.remove("open"));
    return;
  }
  container.innerHTML=items.map(x=>`<div class="cart-line" data-cart-line="${esc(x.id)}"><img src="${esc(x.product.image)}" alt="${esc(x.product.title)}"><div><h4>${esc(x.product.title)}</h4><small>${money(x.product.price)} · ${esc(x.product.type)}</small><div class="cart-controls"><button type="button" data-cart-minus="${esc(x.id)}" aria-label="Decrease quantity">−</button><span>${x.qty}</span><button type="button" data-cart-plus="${esc(x.id)}" aria-label="Increase quantity">+</button></div></div><button class="cart-remove" type="button" data-remove="${esc(x.id)}" aria-label="Remove ${esc(x.product.title)}">×</button></div>`).join("");
}

function addToCart(id){
  const p=products.find(x=>x.id===id); if(!p || !store)return;
  store.add(id);
  renderCart();                         // update count + lines immediately
  $("#productModal")?.classList.remove("open");
  $("#cartDrawer")?.classList.add("open"); // no refresh and no delay
  toast("1 ITEM ADDED TO CART");
}

async function loadReels(){
  const grid=$("#reelGrid"); if(!grid)return;
  try{
    const r=await fetch("assets/reels.json",{cache:"no-store"});
    if(!r.ok)throw new Error("Reels unavailable");
    const reels=await r.json();
    if(!Array.isArray(reels)||!reels.length){grid.innerHTML=`<div class="reel-empty">NEW MOVING FRAMES WILL APPEAR HERE.</div>`;return;}
    grid.innerHTML=reels.map((reel,i)=>`<article class="reel-card" data-reel="${esc(reel.file)}" data-label="FRAME ${String(i+1).padStart(2,"0")}">
      <video class="reel-preview" src="${esc(reel.file)}" poster="${esc(reel.poster||"")}" muted playsinline preload="metadata"></video>
      <div class="reel-shade"></div>
      <div class="reel-card-top"><span>MOVING FRAME</span><span>${String(i+1).padStart(2,"0")}</span></div>
      <div class="reel-info"><small>@UMS91 · MOTION</small><span class="reel-play">▶</span></div>
    </article>`).join("");
    $$(".reel-card").forEach(card=>card.addEventListener("click",()=>openReel(card.dataset.reel,card.dataset.label)));
  }catch(e){
    console.error(e);
    grid.innerHTML=`<div class="reel-empty">MOVING FRAMES ARE TEMPORARILY UNAVAILABLE.</div>`;
  }
}

function openReel(src,label){
  const modal=$("#videoModal"), video=$("#activeVideo"), title=$("#videoLabel");
  if(!modal||!video)return;
  video.pause(); video.src=src; video.load();
  if(title)title.textContent=label||"MOVING FRAME";
  modal.classList.add("open"); modal.setAttribute("aria-hidden","false");
  video.play().catch(()=>{});
}

function close(id){const el=$(id);if(el){el.classList.remove("open");if(id==="#videoModal"){const v=$("#activeVideo");if(v){v.pause();v.removeAttribute("src");v.load()}}}}

async function init(){
  try{
    products=await loadProducts();
    store=new Store(products);
    renderMini(); renderProducts(); renderCart();
    loadReels();
  }catch(error){
    console.error(error);
    const el=$("#products"); if(el)el.innerHTML=`<div class="catalogue-error"><strong>Collection temporarily unavailable.</strong><span>Please refresh the journal.</span></div>`;
    return;
  }

  $$(".filters button").forEach(b=>b.onclick=()=>{$$(".filters button").forEach(x=>x.classList.remove("active"));b.classList.add("active");renderProducts(b.dataset.filter)});
  $("#bagBtn").onclick=()=>{$("#cartDrawer").classList.add("open");renderCart()};
  $$('[data-close]').forEach(b=>b.onclick=()=>close("#"+b.dataset.close));
  $("#addProduct").onclick=()=>{if(current)addToCart(current.id)};
  $("#cartLines").addEventListener("click",e=>{
    const plus=e.target.closest("[data-cart-plus]"),minus=e.target.closest("[data-cart-minus]"),remove=e.target.closest("[data-remove]");
    if(plus){store.increment(plus.dataset.cartPlus);renderCart()}
    else if(minus){store.decrement(minus.dataset.cartMinus);renderCart()}
    else if(remove){store.remove(remove.dataset.remove);renderCart();toast("REMOVED FROM BAG")}
  });
  $("#checkout").onclick=async()=>{
    if(!store.count){toast("YOUR CART IS EMPTY");return}
    if(!API_BASE){toast("SECURE CHECKOUT WILL BE CONNECTED LATER");return}
    try{const r=await fetch(`${API_BASE}/api/orders`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({lines:store.items.map(x=>({id:x.id,quantity:x.qty}))})});const data=await r.json();if(!r.ok)throw new Error(data.error||"Checkout failed");if(data.orderId)toast("SECURE ORDER CREATED")}catch(error){toast(error.message.toUpperCase())}
  };
  $("#searchBtn").onclick=()=>{$("#searchModal").classList.add("open");setTimeout(()=>$("#searchInput").focus(),100)};
  $("#searchInput").oninput=e=>{const q=e.target.value.toLowerCase().trim();const hits=products.filter(p=>(p.title+" "+p.type).toLowerCase().includes(q));$("#searchResults").textContent=q?(hits.length?hits.map(x=>x.title).join(" · "):"No editions found."):""};
  $("#menuBtn").onclick=()=>$("#mobileMenu").classList.add("open");
  $$(".mobile-menu a").forEach(a=>a.onclick=()=>close("#mobileMenu"));
  $("#theme").onclick=()=>document.body.classList.toggle("light");
  $("#newsletter").onsubmit=e=>{e.preventDefault();toast("THANK YOU — YOU'RE IN THE JOURNAL");e.target.reset()};
}

init();
addEventListener("scroll",()=>{const max=document.documentElement.scrollHeight-innerHeight;$(".progress i").style.width=`${max?scrollY/max*100:0}%`},{passive:true});
if(matchMedia("(pointer:fine)").matches){const c=$(".cursor");addEventListener("mousemove",e=>{if(c){c.style.left=e.clientX+"px";c.style.top=e.clientY+"px"}})}
document.addEventListener("keydown",e=>{if(e.key==="Escape")["#cartDrawer","#productModal","#searchModal","#mobileMenu","#videoModal"].forEach(close)});
