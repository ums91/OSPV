/* OMER — UPI checkout + private order status */
(() => {
  const API = window.OMER_ORDER_API || "https://script.google.com/macros/s/AKfycbynmk_BVUqp9xgoLns34S1RlIP6YzeRgoz_bjWqlLUNLorQhQhUeZonGLYWxF44DUeq/exec";
  const SITE = "https://ums91.github.io/OSPV/";
  const $ = (s,r=document)=>r.querySelector(s);
  const money = n => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(Number(n)||0);
  let receiptPollTimer=null;
  let receiptPrivateOrder=null;

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
    stopReceiptPolling();
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

  const PRODUCT_TYPES={
    "mountain-lake":"Fine Art Print","valley-light":"Postcard","winter-lake":"Fine Art Print","summer-field":"Postcard",
    "mountain-stream":"Fine Art Print","quiet-water":"Postcard","winter-birds":"Fine Art Print","garden-pool":"Postcard",
    "garden-path":"Fine Art Print","orchard-garden":"Postcard","rose-study":"Fine Art Print","river-stone":"Fine Art Print",
    "cloud-valley":"Fine Art Print","courtyard-morning":"Postcard","quiet-interior":"Fine Art Print","courtyard-blue-sky":"Fine Art Print",
    "lake-ridge":"Fine Art Print","winter-water":"Fine Art Print","snow-lake":"Fine Art Print"
  };

  function orderFormatCopy(items){
    const list=Array.isArray(items)?items:[];
    let postcardQty=0,printQty=0;
    list.forEach(item=>{
      const type=String(item?.type||PRODUCT_TYPES[item?.id]||"").toLowerCase();
      const qty=Math.max(1,Number(item?.quantity)||1);
      if(type.includes("postcard")) postcardQty+=qty;
      else if(type.includes("fine art")||type.includes("print")) printQty+=qty;
    });
    if(postcardQty>0 && printQty>0){
      return {
        label:"POSTCARDS + FINE ART PRINTS",
        sentence:`Your ${postcardQty===1?"postcard":"postcards"} and ${printQty===1?"fine art print":"fine art prints"} are now reserved. We'll carefully prepare both pieces for their journey.`
      };
    }
    if(postcardQty>0){
      return {
        label:postcardQty===1?"POSTCARD":"POSTCARDS",
        sentence:`Your ${postcardQty===1?"postcard":"postcards"} ${postcardQty===1?"is":"are"} now reserved. We'll carefully prepare ${postcardQty===1?"it":"them"} for ${postcardQty===1?"its":"their"} journey.`
      };
    }
    if(printQty>0){
      return {
        label:printQty===1?"FINE ART PRINT":"FINE ART PRINTS",
        sentence:`Your ${printQty===1?"fine art print":"fine art prints"} ${printQty===1?"is":"are"} now reserved. We'll carefully prepare ${printQty===1?"it":"them"} for ${printQty===1?"its":"their"} journey.`
      };
    }
    return {label:"POSTCARD / FINE ART PRINT",sentence:"Your piece is now reserved. We'll carefully prepare it for its journey."};
  }

  function safeHttpUrl(v){
    try{
      const u=new URL(String(v||"").trim(),location.origin);
      return (u.protocol==="https:"||u.protocol==="http:") ? u.href : "";
    }catch(e){
      return "";
    }
  }

  function receiptDate(v){
    const d=v?new Date(v):new Date();
    if(Number.isNaN(d.getTime()))return String(v||"");
    return new Intl.DateTimeFormat("en-GB",{day:"2-digit",month:"short",year:"numeric",timeZone:"Asia/Kolkata"}).format(d).toUpperCase();
  }

  function receiptStampClass(label){
    const key=String(label||"").toUpperCase();
    if(key==="PAYMENT ISSUE")return "issue";
    if(key==="VERIFYING PAYMENT")return "verifying";
    if(key==="PAID")return "paid";
    if(key==="PROCESSING")return "processing";
    if(key==="SHIPPED")return "shipped";
    if(key==="DELIVERED")return "delivered";
    return "verifying";
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
    const copy=orderFormatCopy(items);
    const status=receiptStatus(o);
    const lines=items.map(i=>{
      const type=String(i?.type||PRODUCT_TYPES[i?.id]||"").trim();
      return `<div class="receipt-line"><div><strong>${esc(i.title)}</strong><small>${Number(i.quantity)||1} × ${money(i.price)}</small>${type?`<em>${esc(type)}</em>`:""}</div><span>${money((Number(i.quantity)||1)*Number(i.price))}</span></div>`;
    }).join("");
    const receipt=`<div class="receipt-meta"><span>ORDER</span><strong>${esc(o.orderId||"")}</strong><span>DATE</span><strong>${esc(receiptDate(o.date))}</strong></div>
      <div class="receipt-rule dashed"></div>
      <div class="receipt-items">${lines}</div>
      <div class="receipt-rule"></div>
      <div class="receipt-total"><span>TOTAL</span><strong>${money(o.total)}</strong></div>
      <div class="receipt-stamp-wrap"><div class="receipt-stamp stamp-${receiptStampClass(status[0])}">${esc(status[0])}</div></div>
      <div class="receipt-barcode" aria-hidden="true"></div>
      <div class="receipt-code">${esc(o.orderId||"UMS91")}</div>
      <div class="receipt-brand">UMS91 · VISUAL JOURNAL</div>`;
    return `<div class="status-receipt-scene" aria-live="polite">
      <div class="receipt-printer status-receipt-printer" aria-hidden="true">
        <div class="printer-top"><div class="printer-message"><strong>ORDER STATUS</strong><span>THANK YOU FOR YOUR ORDER</span><span>${esc(copy.sentence)}</span></div></div><div class="printer-slot"></div>
      </div>
      <div class="status-receipt-feed"><article class="order-receipt status-order-receipt">${receipt}</article></div>
    </div>
    <p class="status-receipt-copy">${esc(copy.sentence)}</p>
    ${shippingBlock}`;
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

  function receiptStatus(o){
    const payment=String(o?.paymentStatus||"").trim().toUpperCase();
    const order=String(o?.orderStatus||"").trim().toUpperCase();
    if(order==="DELIVERED") return ["DELIVERED","Your frame has been delivered."];
    if(order==="SHIPPED") return ["SHIPPED","Your frame is on the way."];
    if(order==="PROCESSING") return ["PROCESSING","Your frame is being prepared for dispatch."];
    if(payment==="CONFIRMED" || order==="CONFIRMED") return ["PAID","Payment verified. Your order is confirmed."];
    if(payment==="NOT RECEIVED" || order==="PAYMENT ISSUE") return ["PAYMENT ISSUE","We could not verify the payment. Please contact us before paying again."];
    return ["VERIFYING PAYMENT","Your payment has been submitted and is being verified."];
  }

  function shippingHtml(o){
    const s=o?.shipping||{};
    const shipped=o?.orderStatus==="SHIPPED"||o?.orderStatus==="DELIVERED";
    const delivered=o?.orderStatus==="DELIVERED";
    if(!shipped)return "";
    const trackingUrl=safeHttpUrl(s.trackingUrl);
    const tracking=trackingUrl ? `<a class="shipping-track" href="${esc(trackingUrl)}" target="_blank" rel="noopener noreferrer">TRACK SHIPMENT ↗</a>` : "";
    return `<div class="shipping-card receipt-shipping-card">
      <div class="shipping-card-head"><span>SHIPPING</span><strong>${delivered?"DELIVERED":"ON THE WAY"}</strong></div>
      ${s.carrier?`<div class="shipping-row"><span>CARRIER</span><strong>${esc(s.carrier)}</strong></div>`:""}
      ${s.trackingNumber?`<div class="shipping-row"><span>TRACKING</span><strong>${esc(s.trackingNumber)}</strong></div>`:""}
      ${s.shippedDate?`<div class="shipping-row"><span>SHIPPED</span><strong>${esc(displayShippingDate(s.shippedDate))}</strong></div>`:""}
      ${s.deliveredDate?`<div class="shipping-row"><span>DELIVERED</span><strong>${esc(displayShippingDate(s.deliveredDate))}</strong></div>`:""}
      ${s.note?`<p class="shipping-note">${esc(s.note)}</p>`:""}
      ${tracking}
    </div>`;
  }

  function setReceiptStamp(o,animate=true){
    const stamp=$("#receiptStatusStamp"), copy=$("#successCopy");
    if(!stamp)return;
    const [label,message]=receiptStatus(o);
    if(stamp.textContent!==label){
      stamp.textContent=label;
      if(animate){stamp.classList.remove("stamp-hit");void stamp.offsetWidth;stamp.classList.add("stamp-hit");}
    }
    if(copy)copy.textContent=message;
    const shippingEl=$("#receiptShipping");
    if(shippingEl)shippingEl.innerHTML=shippingHtml(o);
  }

  function fillReceipt(orderId,items,total){
    $("#successOrderId").textContent=orderId||"—";
    $("#receiptDate").textContent=new Intl.DateTimeFormat("en-GB",{day:"2-digit",month:"short",year:"numeric",timeZone:"Asia/Kolkata"}).format(new Date()).toUpperCase();
    $("#receiptItems").innerHTML=(items||[]).map(x=>{
      const type=String(x?.type||PRODUCT_TYPES[x?.id]||"").trim();
      return `<div class="receipt-line"><div><strong>${esc(x.title)}</strong><small>${Number(x.quantity)||1} × ${money(x.price)}</small>${type?`<em>${esc(type)}</em>`:""}</div><span>${money((Number(x.quantity)||1)*Number(x.price))}</span></div>`;
    }).join("");
    $("#receiptTotal").textContent=money(total);
    $("#receiptCode").textContent=String(orderId||"UMS91").replace(/[^A-Z0-9-]/gi,"").toUpperCase();
    setReceiptStamp({paymentStatus:"PENDING",orderStatus:"PAYMENT VERIFICATION"},false);
    const copy=orderFormatCopy(items);
    const copyEl=$("#receiptProductCopy");
    if(copyEl)copyEl.textContent=copy.sentence;
  }

  function stopReceiptPolling(){if(receiptPollTimer){clearTimeout(receiptPollTimer);receiptPollTimer=null;}}
  function pollReceiptStatus(){
    stopReceiptPolling();
    if(!receiptPrivateOrder?.orderId||!receiptPrivateOrder?.token)return;
    const tick=()=>{
      if(!$("#orderSuccess")?.classList.contains("open")){stopReceiptPolling();return;}
      postJson({action:"getOrder",orderId:receiptPrivateOrder.orderId,token:receiptPrivateOrder.token})
        .then(data=>{setReceiptStamp(data.order,true);const status=receiptStatus(data.order)[0];if(status!=="DELIVERED"&&status!=="PAYMENT ISSUE")receiptPollTimer=setTimeout(tick,8000);})
        .catch(()=>{receiptPollTimer=setTimeout(tick,12000);});
    };
    receiptPollTimer=setTimeout(tick,5000);
  }

  async function createOrder(){
    const name=$("#checkoutName")?.value.trim();
    const email=$("#checkoutEmail")?.value.trim();
    const phone=$("#checkoutPhone")?.value.trim();
    const addressLine1=$("#checkoutAddress")?.value.trim();
    const city=$("#checkoutCity")?.value.trim();
    const state=$("#checkoutState")?.value.trim();
    const postalCode=$("#checkoutPostalCode")?.value.trim();
    const country=$("#checkoutCountry")?.value.trim();
    const msg=$("#checkoutMessage");
    if(!name||!email||!phone||!addressLine1||!city||!state||!postalCode||!country){showMessage(msg,"Please complete all required shipping address fields.",true);return;}
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){showMessage(msg,"Please enter a valid email address.",true);return;}
    if(!/^[A-Za-z0-9][A-Za-z0-9\s-]{2,11}$/.test(postalCode)){showMessage(msg,"Please enter a valid PIN / postal code.",true);return;}
    if(!window.store?.count){showMessage(msg,"Your bag is empty. Add an edition before ordering.",true);return;}

    const receiptItems=window.store.items.map(x=>({id:x.id,title:x.product.title,price:Number(x.product.price)||0,quantity:Number(x.qty)||1,type:PRODUCT_TYPES[x.id]||""}));
    const receiptTotal=window.store.total;
    const button=$("#submitUpiOrder");
    button.disabled=true;
    button.innerHTML="SUBMITTING…";
    showMessage(msg,"Submitting your order for payment verification…");

    try{
      const response=await fetch(API,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({
        action:"createOrder",customerName:name,email,phone,
        address:[addressLine1,city,state,postalCode,country].join(", "),
        items:window.store.items.map(x=>({id:x.id,quantity:x.qty}))
      })});
      const data=await response.json();
      if(!data.success)throw new Error(data.error||"Unable to create order.");

      window.store._items=[];
      window.store.save();
      if(typeof window.renderCart==="function")window.renderCart();
      panel("#checkoutPanel",false);

      fillReceipt(data.orderId,receiptItems,receiptTotal);
      const link=new URL(SITE);
      link.searchParams.set("orderId",data.orderId);
      link.searchParams.set("token",data.token || "");
      const statusLink=data.orderUrl || link.toString();
      let privateToken=data.token||"";
      try{privateToken=new URL(statusLink,location.href).searchParams.get("token")||privateToken;}catch(e){}
      receiptPrivateOrder={orderId:data.orderId,token:privateToken};
      const successLink=$("#successOrderLink");
      if(successLink){
        successLink.dataset.statusUrl=statusLink;
        successLink.onclick=()=>openOrderStatusFromPrivateLink(statusLink);
      }
      panel("#orderSuccess",true);
      pollReceiptStatus();
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
    document.querySelectorAll('[data-close="checkoutPanel"],[data-close="orderStatusPanel"],[data-close="orderSuccess"]').forEach(b=>b.addEventListener("click",()=>{if(b.dataset.close==="orderSuccess")stopReceiptPolling();panel("#"+b.dataset.close,false);}));
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
