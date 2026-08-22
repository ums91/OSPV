import { Store, loadProducts, $, $$, money, toast } from "./src/store.js";

const API_BASE = window.OMER_API_BASE || "http://localhost:8787";
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
  $("#bagCount").textContent=store.count; $("#drawerCount").textContent=store.count; $("#subtotal").textContent=money(store.total);
  $("#cartLines").innerHTML=store.items.length?store.items.map(x=>`
    <div class="cart-line"><img src="${x.product.image}" alt=""><div><h4>${x.product.title}</h4><small>${money(x.product.price)} · QTY ${x.qty}</small></div><button data-remove="${x.id}">×</button></div>`).join(""):`<p style="color:#777;font-size:12px;line-height:1.8">Your cart is empty.<br>Choose an edition from the collection.</p>`;
  $$("[data-remove]").forEach(b=>b.onclick=()=>{store.remove(b.dataset.remove);renderCart();});
}
function close(id){$(id).classList.remove("open")}
renderMini();renderProducts();renderCart();

$$(".filters button").forEach(b=>b.onclick=()=>{$$(".filters button").forEach(x=>x.classList.remove("active"));b.classList.add("active");renderProducts(b.dataset.filter)});
$("#bagBtn").onclick=()=>$("#cartDrawer").classList.add("open");
$$("[data-close]").forEach(b=>b.onclick=()=>close("#"+b.dataset.close));
$("#addProduct").onclick=()=>{store.add(current.id);renderCart();close("#productModal");$("#cartDrawer").classList.add("open");toast("ADDED TO BAG")};
$("#checkout").onclick=async()=>{
  if(!store.count){toast("YOUR CART IS EMPTY");return}
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
document.addEventListener("keydown",e=>{if(e.key==="Escape")["#cartDrawer","#productModal","#searchModal","#mobileMenu"].forEach(close)});
