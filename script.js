import { Store, loadProducts, $, $$, money, toast } from "./src/store.js";

const API_BASE = window.OMER_API_BASE || "";
const products = await loadProducts();
const store = new Store(products);
let current = null;

function renderMini(){
  $("#miniProducts").innerHTML = products.slice(0,3).map(p=>`
    <article class="mini" data-product="${p.id}">
      <img src="${p.image}" alt="${p.title}" loading="lazy">
      <div class="mini-info"><h3>${p.title}</h3><p>${p.type}</p><strong>${money(p.price)}</strong></div>
    </article>`).join("");
  $$(".mini").forEach(x=>x.onclick=()=>openProduct(x.dataset.product));
}
function renderProducts(filter="all"){
  const list=filter==="all"?products:products.filter(p=>p.type===filter);
  $("#products").innerHTML=list.map((p,i)=>`
    <article class="product" data-product="${p.id}">
      <div class="product-image"><img src="${p.image}" alt="${p.title}" loading="lazy">${i<3?`<span class="badge">${p.type==="Postcard"?"LIMITED":"SIGNED"}</span>`:""}</div>
      <div class="product-info"><small>${p.type} · ${p.edition}</small><h3>${p.title}</h3><div><strong>${money(p.price)}</strong><span>${p.size}</span></div></div>
    </article>`).join("");
  $$(".product").forEach(x=>x.onclick=()=>openProduct(x.dataset.product));
}
function openProduct(id){
  current=products.find(p=>p.id===id); if(!current)return;
  $("#mImg").src=current.image; $("#mImg").alt=current.title;
  $("#mType").textContent=current.type;
  $("#mTitle").textContent=current.title;
  $("#mDesc").textContent="A carefully selected OMER edition, produced in a small run for collectors of quiet images and considered paper.";
  $("#mEdition").textContent=current.edition; $("#mSize").textContent=current.size; $("#mPrice").textContent=money(current.price);
  $("#productModal").classList.add("open");
}
function renderCart(){
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
  container.innerHTML=items.map(x=>`<div class="cart-line" data-cart-line="${x.id}"><img src="${x.product.image}" alt="${x.product.title}"><div><h4>${x.product.title}</h4><small>${money(x.product.price)} · ${x.product.type}</small><div class="cart-controls"><button type="button" data-cart-minus="${x.id}" aria-label="Decrease quantity">−</button><span>${x.qty}</span><button type="button" data-cart-plus="${x.id}" aria-label="Increase quantity">+</button></div></div><button class="cart-remove" type="button" data-remove="${x.id}" aria-label="Remove ${x.product.title}">×</button></div>`).join("");
}

function close(id){const el=$(id);if(el)el.classList.remove("open")}
renderMini();renderProducts();renderCart();

const reelData = await (await fetch("assets/reels.json")).json();
const reelGrid = $("#reelGrid");
if (reelGrid) {
  reelGrid.innerHTML = reelData.map(r => {
    const month = (r.source.match(/reels\/(\d{4})(\d{2})/) || []).slice(1);
    const label = month.length ? `${month[0]} · ${month[1]}` : `REEL ${String(r.id).padStart(2,"0")}`;
    return `<article class="reel-card" data-reel="${r.id}" data-video="${r.file}" data-label="${label}">
      <img src="${r.poster}" alt="OMER moving frame ${r.id}" loading="lazy">
      <div class="reel-info"><small>${label}</small><span class="reel-play">▶</span></div>
    </article>`;
  }).join("");

  $$(".reel-card").forEach(card => card.addEventListener("click", () => {
    const video = $("#activeVideo");
    video.pause();
    video.removeAttribute("src");
    video.load();
    video.src = card.dataset.video;
    video.poster = card.querySelector("img").src;
    $("#videoLabel").textContent = card.dataset.label;
    $("#videoModal").classList.add("open");
    $("#videoModal").setAttribute("aria-hidden","false");
    video.play().catch(()=>{});
  }));
}
function closeVideoModal(){
  const video=$("#activeVideo");
  if(video){video.pause();video.removeAttribute("src");video.load();}
  $("#videoModal")?.classList.remove("open");
  $("#videoModal")?.setAttribute("aria-hidden","true");
}
$("#videoModal")?.addEventListener("click",e=>{if(e.target.id==="videoModal")closeVideoModal()});


$$(".filters button").forEach(b=>b.onclick=()=>{$$(".filters button").forEach(x=>x.classList.remove("active"));b.classList.add("active");renderProducts(b.dataset.filter)});
$("#bagBtn").onclick=()=>{renderCart();$("#cartDrawer").classList.add("open")};
$$("[data-close]").forEach(b=>b.onclick=()=>close("#"+b.dataset.close));
$("#addProduct").onclick=()=>{if(!current)return;store.add(current.id);renderCart();close("#productModal");$("#cartDrawer").classList.add("open");toast(`${current.title.toUpperCase()} ADDED TO BAG`)};
$("#cartLines").addEventListener("click",e=>{const plus=e.target.closest("[data-cart-plus]"),minus=e.target.closest("[data-cart-minus]"),remove=e.target.closest("[data-remove]");if(plus){store.increment(plus.dataset.cartPlus);renderCart();return}if(minus){store.decrement(minus.dataset.cartMinus);renderCart();return}if(remove){store.remove(remove.dataset.remove);renderCart();toast("REMOVED FROM BAG")}});
$("#checkout").onclick=async()=>{
  if(!store.count){toast("YOUR CART IS EMPTY");return}
  if(!API_BASE){ toast("SECURE CHECKOUT WILL BE CONNECTED LATER"); return; }
  try{
    const r=await fetch(`${API_BASE}/api/orders`,{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({lines:store.items.map(x=>({id:x.id,quantity:x.qty}))})
    });
    const data=await r.json();
    if(!r.ok) throw new Error(data.error||"Checkout failed");
    if(data.orderId){
      toast("SECURE ORDER CREATED");
      // Production: load the payment provider's hosted/SDK checkout here.
      console.log("Payment order:",data);
    }
  }catch(error){toast(error.message.toUpperCase())}
};

$("#searchBtn").onclick=()=>{ $("#searchModal").classList.add("open"); setTimeout(()=>$("#searchInput").focus(),100); };
$("#searchInput").oninput=e=>{
  const q=e.target.value.toLowerCase().trim();
  const hits=products.filter(p=>(p.title+" "+p.type).toLowerCase().includes(q));
  $("#searchResults").textContent=q?(hits.length?hits.map(x=>x.title).join(" · "):"No editions found."):"";
};
$("#menuBtn").onclick=()=>$("#mobileMenu").classList.add("open");
$$(".mobile-menu a").forEach(a=>a.onclick=()=>close("#mobileMenu"));
$("#theme").onclick=()=>document.body.classList.toggle("light");

$("#newsletter").onsubmit=e=>{e.preventDefault();toast("THANK YOU — YOU'RE IN THE JOURNAL");e.target.reset()};

addEventListener("scroll",()=>{
  const max=document.documentElement.scrollHeight-innerHeight;
  $(".progress i").style.width=`${max?scrollY/max*100:0}%`;
});
if(matchMedia("(pointer:fine)").matches){
  const c=$(".cursor");
  addEventListener("mousemove",e=>{c.style.left=e.clientX+"px";c.style.top=e.clientY+"px"});
  document.addEventListener("mouseover",e=>{if(e.target.closest("a,button,.product,.mini"))c.classList.add("big")});
  document.addEventListener("mouseout",e=>{if(e.target.closest("a,button,.product,.mini"))c.classList.remove("big")});
}
const observer=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.animate([{opacity:0,transform:"translateY(22px)"},{opacity:1,transform:"translateY(0)"}],{duration:700,easing:"cubic-bezier(.2,.8,.2,1)",fill:"forwards"});observer.unobserve(e.target)}}),{threshold:.12});
$$(".feature-card,.mini,.product,.about>div,.contact form").forEach(x=>observer.observe(x));
document.addEventListener("keydown",e=>{if(e.key==="Escape"){["#cartDrawer","#productModal","#searchModal","#mobileMenu"].forEach(close);closeVideoModal()}});
