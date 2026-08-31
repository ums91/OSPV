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
    el.style.visibility=open?"visible":"hidden";
    el.style.pointerEvents=open?"auto":"none";
    if(open) document.body.classList.add("commerce-open");
    else if(!document.querySelector(".commerce-panel.open,.order-success-panel.open")) document.body.classList.remove("commerce-open");
  }

  function openCheckout(){
    document.querySelector("#orderStatusPanel")?.classList.remove("open");
    document.querySelector("#orderSuccess")?.classList.remove("open");
    document.querySelector("#cartDrawer")?.classList.remove("open");
    if(!window.store?.count){
      window.toast?.("YOUR BAG IS EMPTY");
      return;
    }
    renderCheckout();
    panel("#checkoutPanel",true);
    setTimeout(()=>$("#checkoutName")?.focus(),180);
  }

  function openOrderStatus(){
    document.querySelector("#cartDrawer")?.classList.remove("open");
    document.querySelector("#bagBtn")?.setAttribute("aria-expanded","false");
    document.querySelector("#cartDrawer")?.setAttribute("aria-hidden","true");
    panel("#checkoutPanel",false);
    panel("#orderSuccess",false);
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


  function esc(v){
    return String(v ?? "").replace(/[&<>\"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  }
  function displayShippingDate(v){
    if(!v) return "";
    const d = new Date(v);
    if(Number.isNaN(d.getTime())) return String(v);
    return new Intl.DateTimeFormat("en-GB",{
      day:"numeric",
      month:"long",
      year:"numeric",
      timeZone:"Asia/Kolkata"
    }).format(d);
  }

  function safeHttpUrl(v){
    try{
      const u=new URL(String(v||"").trim(),location.origin);
      return (u.protocol==="https:"||u.protocol==="http:") ? u.href : "";
    }catch(e){
      return "";
    }
  }

  function renderOrderResult(o){
    const items=Array.isArray(o.items)?o.items:[];
    const s=o.shipping||{};
    const shipped=o.orderStatus==="SHIPPED"||o.orderStatus==="DELIVERED";
    const delivered=o.orderStatus==="DELIVERED";
    const trackingUrl=safeHttpUrl(s.trackingUrl);
    const tracking=trackingUrl ? `<a class="shipping-track" href="${esc(trackingUrl)}" target="_blank" rel="noopener noreferrer">TRACK SHIPMENT ↗</a>` : "";
    const shippingBlock=shipped ? `
      <div class="shipping-card">
        <div class="shipping-card-head"><span>SHIPPING</span><strong>${delivered?"DELIVERED":"ON THE WAY"}</strong></div>
        ${s.carrier?`<div class="shipping-row"><span>CARRIER</span><strong>${esc(s.carrier)}</strong></div>`:""}
        ${s.trackingNumber?`<div class="shipping-row"><span>TRACKING</span><strong>${esc(s.trackingNumber)}</strong></div>`:""}
        ${s.shippedDate?`<div class="shipping-row"><span>SHIPPED</span><strong>${esc(displayShippingDate(s.shippedDate))}</strong></div>`:""}
        ${s.deliveredDate?`<div class="shipping-row"><span>DELIVERED</span><strong>${esc(displayShippingDate(s.deliveredDate))}</strong></div>`:""}
        ${s.note?`<p class="shipping-note">${esc(s.note)}</p>`:""}
        ${tracking}
      </div>` : "";
    return `<h3>Order ${esc(o.orderId)}</h3>
      <div class="order-progress" aria-label="Order progress">
        <span class="is-done">ORDER</span>
        <span class="${o.orderStatus==="PROCESSING"||shipped||delivered?"is-done":""}">PROCESSING</span>
        <span class="${shipped?"is-done":""}">SHIPPED</span>
        <span class="${delivered?"is-done":""}">DELIVERED</span>
      </div>
      <div class="order-status-row"><span>PAYMENT</span><strong>${esc(o.paymentStatus)}</strong></div>
      <div class="order-status-row"><span>ORDER</span><strong>${esc(o.orderStatus)}</strong></div>
      ${shippingBlock}
      <div class="order-result-items">${items.map(i=>`<div class="order-result-item"><span>${esc(i.title)} × ${Number(i.quantity)||1}</span><strong>${money(i.price*(Number(i.quantity)||1))}</strong></div>`).join("")}</div>
      <div class="commerce-total"><span>TOTAL</span><strong>${money(o.total)}</strong></div>`;
  }

  function showMessage(el,text,isError=false){
    if(!el)return;
    el.textContent=text;
    el.classList.toggle("is-error",!!isError);
  }

  async function postJson(payload){
    const response=await fetch(API,{
      method:"POST",
      headers:{"Content-Type":"text/plain;charset=utf-8"},
      body:JSON.stringify(payload),
      cache:"no-store"
    });
    const text=await response.text();
    let data;
    try{ data=JSON.parse(text); }
    catch(e){
      throw new Error("The order service returned an invalid response. Please try again in a moment.");
    }
    if(!data.success) throw new Error(data.error||"Unable to load order.");
    return data;
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
      const data=await postJson({action:"getOrder",orderId:orderId,email:email});
      const o=data.order;
      result.innerHTML=renderOrderResult(o);
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
    postJson({action:"getOrder",orderId:orderId,token:token})
      .then(data=>{
        const o=data.order;
        result.innerHTML=renderOrderResult(o);
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
