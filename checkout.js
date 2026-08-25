
/* OMER — UPI checkout and private order status */
(() => {
  const API = window.OMER_ORDER_API || "https://script.google.com/macros/s/AKfycbynmk_BVUqp9xgoLns34S1RlIP6YzeRgoz_bjWqlLUNLorQhQhUeZonGLYWxF44DUeq/exec";
  const $ = (s,r=document)=>r.querySelector(s);
  const money = n => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(Number(n)||0);

  function panel(id, open=true){
    const el=$(id); if(!el)return;
    el.classList.toggle("open",open);
    el.setAttribute("aria-hidden",String(!open));
    document.body.classList.toggle("commerce-open", open);
  }

  function renderCheckout(){
    const lines=$("#checkoutLines"), total=$("#checkoutTotal");
    if(!lines || !window.store)return;
    lines.innerHTML=window.store.items.map(x=>`
      <div class="checkout-line">
        <img src="${String(x.product.image).replace(/"/g,"&quot;")}" alt="">
        <div><h4>${String(x.product.title).replace(/[&<>]/g,"")}</h4><small>${x.qty} × ${money(x.product.price)}</small></div>
        <strong>${money(x.qty*x.product.price)}</strong>
      </div>`).join("");
    total.textContent=money(window.store.total);
  }

  function showMessage(el,text,isError=false){
    if(!el)return;
    el.textContent=text;
    el.style.opacity="1";
    el.style.color=isError?"#8a2f2f":"";
  }

  async function createOrder(){
    const name=$("#checkoutName")?.value.trim();
    const email=$("#checkoutEmail")?.value.trim();
    const phone=$("#checkoutPhone")?.value.trim();
    const address=$("#checkoutAddress")?.value.trim();
    const msg=$("#checkoutMessage");

    if(!name||!email||!phone||!address){
      showMessage(msg,"Please complete your details before submitting the order.",true); return;
    }
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
      showMessage(msg,"Please enter a valid email address.",true); return;
    }
    if(!window.store?.count){showMessage(msg,"Your bag is empty.",true);return;}

    const button=$("#submitUpiOrder");
    button.disabled=true;
    button.innerHTML="SUBMITTING ORDER…";
    showMessage(msg,"");

    try{
      const response=await fetch(API,{
        method:"POST",
        headers:{"Content-Type":"text/plain;charset=utf-8"},
        body:JSON.stringify({
          action:"createOrder",
          customerName:name,
          email,
          phone,
          address,
          items:window.store.items.map(x=>({id:x.id,quantity:x.qty}))
        })
      });
      const data=await response.json();
      if(!data.success)throw new Error(data.error||"Unable to create order.");

      window.store._items=[];
      window.store.save();
      if(typeof window.renderCart==="function")window.renderCart();
      if(typeof window.close==="function")window.close("#cartDrawer");
      panel("#checkoutPanel",false);

      $("#successOrderId").textContent=data.orderId;
      $("#successOrderLink").href=data.orderUrl;
      panel("#orderSuccess",true);
    }catch(err){
      console.error(err);
      showMessage(msg,(err.message||"Unable to submit order.").toUpperCase(),true);
    }finally{
      button.disabled=false;
      button.innerHTML='I HAVE PAID <span>→</span>';
    }
  }

  async function lookupOrder(){
    const orderId=$("#statusOrderId")?.value.trim();
    const token=$("#statusToken")?.value.trim();
    const msg=$("#statusMessage");
    const result=$("#orderResult");
    if(!orderId||!token){showMessage(msg,"Enter your order number and private access token.",true);return;}
    showMessage(msg,"Checking order…");
    result.hidden=true;
    try{
      const r=await fetch(API+"?action=getOrder&orderId="+encodeURIComponent(orderId)+"&token="+encodeURIComponent(token),{cache:"no-store"});
      const data=await r.json();
      if(!data.success)throw new Error(data.error||"Order not found.");
      const o=data.order;
      const items=Array.isArray(o.items)?o.items:[];
      result.innerHTML=`
        <h3>Order ${o.orderId}</h3>
        <div class="order-status-row"><span>PAYMENT</span><strong>${o.paymentStatus}</strong></div>
        <div class="order-status-row"><span>ORDER</span><strong>${o.orderStatus}</strong></div>
        <div class="order-result-items">${items.map(i=>`<div class="order-result-item"><span>${i.title} × ${i.quantity}</span><strong>${money(i.price*i.quantity)}</strong></div>`).join("")}</div>
        <div class="commerce-total"><span>TOTAL</span><strong>${money(o.total)}</strong></div>`;
      result.hidden=false;
      showMessage(msg,"");
    }catch(err){
      showMessage(msg,(err.message||"Unable to find order.").toUpperCase(),true);
    }
  }

  function bind(){
    document.querySelectorAll("[data-open-order-status]").forEach(a=>a.addEventListener("click",e=>{e.preventDefault();panel("#orderStatusPanel",true)}));
    $("#checkout")?.addEventListener("click",()=>{
      if(!window.store?.count){window.toast?.("YOUR CART IS EMPTY");return;}
      renderCheckout();
      panel("#checkoutPanel",true);
    });
    $("#submitUpiOrder")?.addEventListener("click",createOrder);
    $("#lookupOrder")?.addEventListener("click",lookupOrder);
    document.querySelectorAll('[data-close="checkoutPanel"],[data-close="orderStatusPanel"],[data-close="orderSuccess"]').forEach(b=>b.addEventListener("click",()=>panel("#"+b.dataset.close,false)));
    $("#successBack")?.addEventListener("click",()=>panel("#orderSuccess",false));
    ["#checkoutPanel","#orderStatusPanel","#orderSuccess"].forEach(id=>$(id)?.addEventListener("click",e=>{if(e.target===e.currentTarget)panel(id,false)}));
  }

  window.OMER_ORDER_API=API;
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",bind,{once:true});else bind();
})();
