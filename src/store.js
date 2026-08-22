export const $ = (selector, root=document) => root.querySelector(selector);
export const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];

export async function loadProducts(){
  const response = await fetch("assets/products.json");
  if(!response.ok) throw new Error("Could not load product catalog.");
  return response.json();
}

export const money = value => new Intl.NumberFormat("en-IN", {
  style:"currency", currency:"INR", maximumFractionDigits:0
}).format(value);

export class Store {
  constructor(products){
    this.products = products;
    this.items = JSON.parse(localStorage.getItem("omer-bag") || "[]")
      .map(item => ({...item, product:products.find(p=>p.id===item.id)}))
      .filter(item => item.product);
  }
  get count(){ return this.items.reduce((n,i)=>n+i.qty,0); }
  get total(){ return this.items.reduce((n,i)=>n+i.product.price*i.qty,0); }
  add(id){
    const existing = this.items.find(i=>i.id===id);
    if(existing) existing.qty++;
    else {
      const p=this.products.find(p=>p.id===id);
      if(p) this.items.push({id,qty:1,product:p});
    }
    this.persist();
  }
  remove(id){
    this.items=this.items.filter(i=>i.id!==id);
    this.persist();
  }
  persist(){
    localStorage.setItem("omer-bag",JSON.stringify(this.items.map(i=>({id:i.id,qty:i.qty}))));
  }
  get items(){ return this._items || []; }
  set items(value){ this._items=value; }
}

export function toast(message){
  const el=$("#toast");
  el.textContent=message;
  el.classList.add("show");
  clearTimeout(window.__omerToast);
  window.__omerToast=setTimeout(()=>el.classList.remove("show"),2200);
}
