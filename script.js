import { loadProducts, Store, $, $$, money, toast } from "./src/store.js";

const products = await loadProducts();
const store = new Store(products);
const productGrid = $("#productGrid");
const bag = $(".bag");
const modal = $(".product-modal");
let activeProduct = null;

function renderProducts(filter="all"){
  const list = filter === "all" ? products : products.filter(p => p.type === filter);
  productGrid.innerHTML = list.map(p => `
    <article class="product" data-id="${p.id}">
      <div class="product-media"><img src="${p.image}" alt="${p.title}" loading="lazy"></div>
      <div class="product-meta">
        <small>${p.type} · ${p.edition}</small>
        <h3>${p.title}</h3><strong>${money(p.price)}</strong>
        <p>${p.category}</p><p style="text-align:right">${p.stock < 10 ? "Only " + p.stock + " left" : "Available"}</p>
      </div>
    </article>`).join("");
  $$(".product").forEach(el => el.addEventListener("click", () => openProduct(el.dataset.id)));
}

function openProduct(id){
  activeProduct = products.find(p => p.id === id);
  if(!activeProduct) return;
  $("#modalImage").src = activeProduct.image;
  $("#modalImage").alt = activeProduct.title;
  $("#modalType").textContent = `${activeProduct.type} · ${activeProduct.category}`;
  $("#modalTitle").textContent = activeProduct.title;
  $("#modalDescription").textContent = activeProduct.description;
  $("#modalEdition").textContent = activeProduct.edition;
  $("#modalDimensions").textContent = activeProduct.dimensions;
  $("#modalPrice").textContent = money(activeProduct.price);
  modal.classList.add("open");
  modal.setAttribute("aria-hidden","false");
}

function renderBag(){
  const items = store.items;
  $("#cartCount").textContent = store.count;
  $("#bagTotal").textContent = money(store.total);
  $("#bagItems").innerHTML = items.length ? items.map(item => `
    <div class="bag-item">
      <img src="${item.image}" alt="">
      <div><h4>${item.title}</h4><small>${money(item.price)} · QTY ${item.qty}</small></div>
      <button data-remove="${item.id}" aria-label="Remove ${item.title}">×</button>
    </div>`).join("") : `<p style="color:#888;font-size:12px;line-height:1.7">Your bag is empty.<br>Choose a photograph to begin.</p>`;
  $$("[data-remove]").forEach(btn => btn.onclick = () => { store.remove(btn.dataset.remove); renderBag(); });
}

function openBag(){ renderBag(); bag.classList.add("open"); bag.setAttribute("aria-hidden","false"); }
function closeBag(){ bag.classList.remove("open"); bag.setAttribute("aria-hidden","true"); }
function closeModal(){ modal.classList.remove("open"); modal.setAttribute("aria-hidden","true"); }

renderProducts();
renderBag();

$$(".filter").forEach(btn => btn.addEventListener("click", () => {
  $$(".filter").forEach(x => x.classList.remove("active"));
  btn.classList.add("active");
  renderProducts(btn.dataset.filter);
}));

$(".cart-trigger").onclick = openBag;
$(".bag-close").onclick = closeBag;
$(".product-close").onclick = closeModal;

$("#modalAdd").onclick = () => {
  store.add(activeProduct.id);
  renderBag();
  closeModal();
  openBag();
  toast("ADDED TO YOUR BAG");
};

$("#checkout").onclick = () => {
  if(!store.items.length){ toast("YOUR BAG IS EMPTY"); return; }
  toast("CHECKOUT PLACEHOLDER — CONNECT PAYMENT PROVIDER HERE");
};

const menuPanel = $(".menu-panel");
$(".menu").onclick = () => menuPanel.classList.add("open");
$(".close-menu").onclick = () => menuPanel.classList.remove("open");
$$(".menu-panel a").forEach(a => a.onclick = () => menuPanel.classList.remove("open"));

const cursor = $(".cursor");
if(cursor && matchMedia("(pointer:fine)").matches){
  addEventListener("mousemove", e => { cursor.style.left=e.clientX+"px"; cursor.style.top=e.clientY+"px"; });
  document.addEventListener("mouseover", e => { if(e.target.closest("a,button,.product")) cursor.classList.add("big"); });
  document.addEventListener("mouseout", e => { if(e.target.closest("a,button,.product")) cursor.classList.remove("big"); });
}

addEventListener("scroll", () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  $(".progress span").style.width = `${max ? scrollY / max * 100 : 0}%`;
});

const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if(e.isIntersecting){
      e.target.animate([{opacity:0,transform:"translateY(28px)"},{opacity:1,transform:"translateY(0)"}],{duration:800,easing:"cubic-bezier(.2,.8,.2,1)",fill:"forwards"});
      observer.unobserve(e.target);
    }
  });
},{threshold:.12});
$$(".story,.product,.statement,.manifesto-grid").forEach(x => observer.observe(x));

document.addEventListener("keydown", e => {
  if(e.key === "Escape"){ closeBag(); closeModal(); menuPanel.classList.remove("open"); }
});
