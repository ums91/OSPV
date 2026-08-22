export const $=(s,r=document)=>r.querySelector(s);
export const $$=(s,r=document)=>[...r.querySelectorAll(s)];
export const money=n=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n);

export async function loadProducts(){
  const r=await fetch("assets/products.json");
  if(!r.ok) throw new Error("Product catalogue unavailable");
  return r.json();
}
export class Store{
  constructor(products){
    this.products=products;
    this._items=JSON.parse(localStorage.getItem("omer-cart")||"[]")
      .map(x=>({...x,product:products.find(p=>p.id===x.id)}))
      .filter(x=>x.product);
  }
  get items(){return this._items}
  get count(){return this._items.reduce((n,x)=>n+x.qty,0)}
  get total(){return this._items.reduce((n,x)=>n+x.qty*x.product.price,0)}
  add(id){const x=this._items.find(x=>x.id===id);x?x.qty++:this._items.push({id,qty:1});this.save()}
  remove(id){this._items=this._items.filter(x=>x.id!==id);this.save()}
  save(){localStorage.setItem("omer-cart",JSON.stringify(this._items.map(x=>({id:x.id,qty:x.qty}))))}
}
export function toast(message){const x=$("#toast");x.textContent=message;x.classList.add("show");clearTimeout(window.__toast);window.__toast=setTimeout(()=>x.classList.remove("show"),2200)}
