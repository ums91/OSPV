export const $=(s,r=document)=>r.querySelector(s);
export const $$=(s,r=document)=>[...r.querySelectorAll(s)];
export const money=n=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(Number(n)||0);

const CART_KEY="omer-cart";
function readCart(){
  try{
    const raw=localStorage.getItem(CART_KEY);
    const parsed=raw?JSON.parse(raw):[];
    return Array.isArray(parsed)?parsed:[];
  }catch(error){
    console.warn("OMER cart storage read failed; starting with an empty cart.",error);
    return [];
  }
}
export async function loadProducts(){
  const r=await fetch("assets/products.json?v=20260823-cartfix",{cache:"no-store"});
  if(!r.ok) throw new Error("Product catalogue unavailable");
  const data=await r.json();
  if(!Array.isArray(data)) throw new Error("Invalid product catalogue");
  return data;
}
export class Store{
  constructor(products){
    this.products=products;
    try{
      const raw=localStorage.getItem("omer-cart");
      const parsed=raw?JSON.parse(raw):[];
      this._items=(Array.isArray(parsed)?parsed:[])
        .filter(x=>x&&x.id!=null&&Number.isFinite(Number(x.qty))&&Number(x.qty)>0)
        .map(x=>({
          id:String(x.id),
          qty:Math.max(1,Math.floor(Number(x.qty))),
          product:products.find(p=>String(p.id)===String(x.id))
        }))
        .filter(x=>x.product);
    }catch(error){
      console.warn("OMER cart storage reset:",error);
      this._items=[];
      try{localStorage.removeItem("omer-cart")}catch(_){}
    }
  }
  get items(){return this._items}
  get count(){return this._items.reduce((n,x)=>n+x.qty,0)}
  get total(){return this._items.reduce((n,x)=>n+x.qty*x.product.price,0)}
  add(id){
    const normalized=String(id);
    const product=this.products.find(p=>String(p.id)===normalized);
    if(!product) throw new Error("Product not found");
    const x=this._items.find(x=>String(x.id)===normalized);
    if(x)x.qty++;
    else this._items.push({id:normalized,qty:1,product});
    this.save();
    return this._items.find(x=>String(x.id)===normalized);
  }
  remove(id){this._items=this._items.filter(x=>String(x.id)!==String(id));this.save()}
  increment(id){const x=this._items.find(x=>String(x.id)===String(id));if(x){x.qty++;this.save()}}
  decrement(id){const x=this._items.find(x=>String(x.id)===String(id));if(!x)return;if(x.qty>1){x.qty--;this.save()}else{this.remove(id)}}
  save(){
    try{
      localStorage.setItem("omer-cart",JSON.stringify(this._items.map(x=>({id:x.id,qty:x.qty}))));
    }catch(error){console.warn("OMER cart could not persist:",error)}
  }
}
export function toast(message){const x=$("#toast");if(!x)return;x.textContent=message;x.classList.add("show");clearTimeout(window.__toast);window.__toast=setTimeout(()=>x.classList.remove("show"),2200)}
