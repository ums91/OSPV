/* OMER — UPI checkout + private order status */
(() => {
  const API = window.OMER_ORDER_API || "https://script.google.com/macros/s/AKfycbynmk_BVUqp9xgoLns34S1RlIP6YzeRgoz_bjWqlLUNLorQhQhUeZonGLYWxF44DUeq/exec";
  const SITE = "https://ums91.github.io/OSPV/";
  const $ = (s,r=document)=>r.querySelector(s);
  const money = n => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(Number(n)||0);

  function panel(id, open=true){
    const el=$(id); if(!el)return;
    el.classList.toggle("open",open);
    el.setAttribute("aria-hidden",String(!open));
    if(open) document.body.classList.add("commerce-open");
    else if(!document.querySelector(".commerce-panel.open,.order-success-panel.open")) document.body.classList.remove("commerce-open");
  }

  function openCheckout(){
    if(!window.store?.count){
      window.toast?.("YOUR BAG IS EMPTY");
      return;
    }
    renderCheckout();
    panel("#checkoutPanel",true);
    setTimeout(()=>$("#checkoutName")?.focus(),180);
  }

  function openOrderStatus(){
    panel("#orderStatusPanel",true);
    setTimeout(()=>$("#statusOrderId")?.focus(),180);
  }

  function renderCheckout(){
    const lines=$("#checkoutLines"), total=$("#checkoutTotal");
    if(!lines || !window.store)return;
    lines.innerHTML=window.store.items.map(x=>`
      <div class="checkout-line">
        <img src="${String(x.product.image).replace(/"/g,"&quot;")}" alt="${String(x.product.title).replace(/[&<>]/g,"")}">
        <div><h4>${String(x.product.title).replace(/[&<>]/g,"")}</h4><small>${x.qty} × ${money(x.product.price)}</small></div>
        <strong>${money(x.qty*x.product.price)}</strong>
      </div>`).join("");
    total.textContent=money(window.store.total);
  }

  function showMessage(el,text,isError=false){
    if(!el)return;
    el.textContent=text;
    el.classList.toggle("is-error",!!isError);
  }

  async function createOrder(){
    const name=$("#checkoutName")?.value.trim();
    const email=$("#checkoutEmail")?.value.trim();
    const phone=$("#checkoutPhone")?.value.trim();
    const address=$("#checkoutAddress")?.value.trim();
    const msg=$("#checkoutMessage");
    if(!name||!email||!phone||!address){showMessage(msg,"Please complete your details before submitting your payment confirmation.",true);return;}
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){showMessage(msg,"Please enter a valid email address.",true);return;}
    if(!window.store?.count){showMessage(msg,"Your bag is empty. Add an edition before ordering.",true);return;}

    const button=$("#submitUpiOrder");
    button.disabled=true;
    button.innerHTML="SUBMITTING…";
    showMessage(msg,"Submitting your order for payment verification…");

    try{
      const response=await fetch(API,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({
        action:"createOrder",customerName:name,email,phone,address,
        items:window.store.items.map(x=>({id:x.id,quantity:x.qty}))
      })});
      const data=await response.json();
      if(!data.success)throw new Error(data.error||"Unable to create order.");

      window.store._items=[];
      window.store.save();
      if(typeof window.renderCart==="function")window.renderCart();
      panel("#checkoutPanel",false);

      $("#successOrderId").textContent=data.orderId;
      const link=new URL(SITE);
      link.searchParams.set("orderId",data.orderId);
      link.searchParams.set("token",data.token || "");
      const statusLink=data.orderUrl || link.toString();
      const successLink=$("#successOrderLink");
      if(successLink){
        successLink.dataset.statusUrl=statusLink;
        successLink.onclick=()=>openOrderStatusFromPrivateLink(statusLink);
      }
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
    const email=$("#statusEmail")?.value.trim();
    const msg=$("#statusMessage");
    const result=$("#orderResult");
    if(!orderId||!email){showMessage(msg,"Enter your order number and the email used at checkout.",true);return;}
    showMessage(msg,"Checking order…");
    result.hidden=true;
    try{
      const r=await fetch(API+"?action=getOrder&orderId="+encodeURIComponent(orderId)+"&email="+encodeURIComponent(email),{cache:"no-store"});
      const data=await r.json();
      if(!data.success)throw new Error(data.error||"Order not found.");
      const o=data.order;
      const items=Array.isArray(o.items)?o.items:[];
      result.innerHTML=`<h3>Order ${o.orderId}</h3>
        <div class="order-status-row"><span>PAYMENT</span><strong>${o.paymentStatus}</strong></div>
        <div class="order-status-row"><span>ORDER</span><strong>${o.orderStatus}</strong></div>
        <div class="order-result-items">${items.map(i=>`<div class="order-result-item"><span>${i.title} × ${i.quantity}</span><strong>${money(i.price*i.quantity)}</strong></div>`).join("")}</div>
        <div class="commerce-total"><span>TOTAL</span><strong>${money(o.total)}</strong></div>`;
      result.hidden=false;
      showMessage(msg,"");
    }catch(err){showMessage(msg,(err.message||"Unable to find order.").toUpperCase(),true);}
  }

  function openOrderStatusFromPrivateLink(url){
    try{
      const u=new URL(url,location.href);
      const orderId=u.searchParams.get("orderId");
      const token=u.searchParams.get("token");
      if(!orderId||!token){ openOrderStatus(); return; }
      panel("#orderSuccess",false);
      panel("#orderStatusPanel",true);
      loadPrivateOrder(orderId,token);
    }catch(err){
      console.error(err);
      openOrderStatus();
    }
  }

  function loadPrivateOrder(orderId,token){
    $("#statusOrderId").value=orderId;
    $("#statusEmail").value="";
    const msg=$("#statusMessage");
    const result=$("#orderResult");
    result.hidden=true;
    showMessage(msg,"Loading your private order…");
    fetch(API+"?action=getOrder&orderId="+encodeURIComponent(orderId)+"&token="+encodeURIComponent(token),{cache:"no-store"})
      .then(r=>r.json())
      .then(data=>{
        if(!data.success)throw new Error(data.error||"Unable to load order.");
        const o=data.order, items=Array.isArray(o.items)?o.items:[];
        result.innerHTML=`<h3>Order ${o.orderId}</h3><div class="order-status-row"><span>PAYMENT</span><strong>${o.paymentStatus}</strong></div><div class="order-status-row"><span>ORDER</span><strong>${o.orderStatus}</strong></div><div class="order-result-items">${items.map(i=>`<div class="order-result-item"><span>${i.title} × ${i.quantity}</span><strong>${money(i.price*i.quantity)}</strong></div>`).join("")}</div><div class="commerce-total"><span>TOTAL</span><strong>${money(o.total)}</strong></div>`;
        result.hidden=false;
        showMessage(msg,"");
      })
      .catch(err=>showMessage(msg,(err.message||"Unable to load order.").toUpperCase(),true));
  }

  function loadOrderLink(){
    const params=new URLSearchParams(location.search);
    const orderId=params.get("orderId");
    const token=params.get("token");
    if(!orderId||!token)return;
    panel("#orderStatusPanel",true);
    loadPrivateOrder(orderId,token);
    history.replaceState({},document.title,location.pathname+location.hash);
  }

  function bind(){
    document.querySelectorAll("[data-open-order-status]").forEach(a=>a.addEventListener("click",e=>{e.preventDefault();openOrderStatus();}));
    $("#checkout")?.addEventListener("click",e=>{e.preventDefault();openCheckout();});
    $("#submitUpiOrder")?.addEventListener("click",createOrder);
    $("#lookupOrder")?.addEventListener("click",lookupOrder);
    $("#orderStatusBtn")?.addEventListener("click",openOrderStatus);
    document.querySelectorAll('[data-close="checkoutPanel"],[data-close="orderStatusPanel"],[data-close="orderSuccess"]').forEach(b=>b.addEventListener("click",()=>panel("#"+b.dataset.close,false)));
    $("#successBack")?.addEventListener("click",()=>{
      panel("#orderSuccess",false);
      const journal=document.querySelector("#journal");
      if(journal)journal.scrollIntoView({behavior:"smooth",block:"start"});
      else window.location.hash="journal";
    });
    ["#checkoutPanel","#orderStatusPanel","#orderSuccess"].forEach(id=>$(id)?.addEventListener("click",e=>{if(e.target===e.currentTarget)panel(id,false)}));
    document.addEventListener("keydown",e=>{if(e.key==="Escape"){["#checkoutPanel","#orderStatusPanel","#orderSuccess"].forEach(id=>panel(id,false));}});
    loadOrderLink();
  }

  window.OMER_ORDER_API=API;
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",bind,{once:true});else bind();
})();
