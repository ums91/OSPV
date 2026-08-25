/* OMER — UPI checkout + private order status */
(() => {
  const API = window.OMER_ORDER_API || "https://script.google.com/macros/s/AKfycbynmk_BVUqp9xgoLns34S1RlIP6YzeRgoz_bjWqlLUNLorQhQhUeZonGLYWxF44DUeq/exec";
  const $ = (s, r = document) => r.querySelector(s);
  const money = n => new Intl.NumberFormat("en-IN", {style:"currency", currency:"INR", maximumFractionDigits:0}).format(Number(n) || 0);
  let privateToken = "";

  function panel(id, open = true) {
    const el = $(id); if (!el) return;
    el.classList.toggle("open", open);
    el.setAttribute("aria-hidden", String(!open));
    document.body.classList.toggle("commerce-open", open);
  }

  function closePanel(id) { panel(id, false); }

  function openCheckout() {
    const store = window.store;
    if (!store || !store.count) {
      window.OMER_TOAST?.("ADD AN EDITION TO YOUR BAG FIRST");
      return;
    }
    renderCheckout();
    panel("#checkoutPanel", true);
  }

  function openOrderStatus() {
    panel("#orderStatusPanel", true);
    setTimeout(() => $("#statusOrderId")?.focus(), 120);
  }

  function renderCheckout() {
    const lines = $("#checkoutLines"), total = $("#checkoutTotal"), store = window.store;
    if (!lines || !store) return;
    lines.innerHTML = store.items.map(x => `
      <div class="checkout-line">
        <img src="${String(x.product.image).replace(/"/g, "&quot;")}" alt="">
        <div><h4>${escapeHtml(x.product.title)}</h4><small>${x.qty} × ${money(x.product.price)}</small></div>
        <strong>${money(x.qty * x.product.price)}</strong>
      </div>`).join("");
    total.textContent = money(store.total);
  }

  function showMessage(el, text, isError = false) {
    if (!el) return;
    el.textContent = text;
    el.style.opacity = text ? "1" : "0";
    el.style.color = isError ? "#8a2f2f" : "";
  }

  async function createOrder() {
    const name = $("#checkoutName")?.value.trim();
    const email = $("#checkoutEmail")?.value.trim();
    const phone = $("#checkoutPhone")?.value.trim();
    const address = $("#checkoutAddress")?.value.trim();
    const msg = $("#checkoutMessage");
    const store = window.store;

    if (!name || !email || !phone || !address) {
      showMessage(msg, "Please complete your details before submitting the order.", true); return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showMessage(msg, "Please enter a valid email address.", true); return;
    }
    if (!store?.count) {
      showMessage(msg, "Your bag is empty.", true); return;
    }

    const button = $("#submitUpiOrder");
    button.disabled = true;
    button.innerHTML = "SUBMITTING ORDER…";
    showMessage(msg, "");

    try {
      const response = await fetch(API, {
        method: "POST",
        headers: {"Content-Type":"text/plain;charset=utf-8"},
        body: JSON.stringify({
          action: "createOrder",
          customerName: name,
          email,
          phone,
          address,
          items: store.items.map(x => ({id:x.id, quantity:x.qty}))
        })
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Unable to create order.");

      store._items = [];
      store.save();
      window.renderCart?.();
      window.OMER_CLOSE?.("#cartDrawer");
      closePanel("#checkoutPanel");

      $("#successOrderId").textContent = data.orderId;
      $("#successOrderLink").href = data.orderUrl;
      panel("#orderSuccess", true);
    } catch (err) {
      console.error(err);
      showMessage(msg, (err.message || "Unable to submit order.").toUpperCase(), true);
    } finally {
      button.disabled = false;
      button.innerHTML = 'I HAVE PAID <span>→</span>';
    }
  }

  async function lookupOrder() {
    const orderId = $("#statusOrderId")?.value.trim();
    const email = $("#statusEmail")?.value.trim();
    const msg = $("#statusMessage");
    const result = $("#orderResult");

    if (!orderId) {
      showMessage(msg, "Enter your order number.", true); return;
    }
    if (!privateToken && !email) {
      showMessage(msg, "Enter the email address used at checkout.", true); return;
    }

    showMessage(msg, "Checking order…");
    result.hidden = true;

    try {
      const params = new URLSearchParams({action:"getOrder", orderId});
      if (privateToken) params.set("token", privateToken);
      else params.set("email", email);

      const r = await fetch(API + "?" + params.toString(), {cache:"no-store"});
      const data = await r.json();
      if (!data.success) throw new Error(data.error || "Order not found.");

      const o = data.order;
      const items = Array.isArray(o.items) ? o.items : [];
      result.innerHTML = `
        <h3>Order ${escapeHtml(o.orderId)}</h3>
        <div class="order-status-row"><span>PAYMENT</span><strong>${escapeHtml(o.paymentStatus)}</strong></div>
        <div class="order-status-row"><span>ORDER</span><strong>${escapeHtml(o.orderStatus)}</strong></div>
        <div class="order-result-items">${items.map(i => `<div class="order-result-item"><span>${escapeHtml(i.title)} × ${Number(i.quantity) || 1}</span><strong>${money((Number(i.price)||0) * (Number(i.quantity)||1))}</strong></div>`).join("")}</div>
        <div class="commerce-total"><span>TOTAL</span><strong>${money(o.total)}</strong></div>`;
      result.hidden = false;
      showMessage(msg, "");
    } catch (err) {
      showMessage(msg, (err.message || "Unable to find order.").toUpperCase(), true);
    }
  }

  function loadOrderLink() {
    const params = new URLSearchParams(location.search);
    const orderId = params.get("orderId");
    const token = params.get("token");
    if (!orderId || !token) return;
    privateToken = token;
    $("#statusOrderId").value = orderId;
    $("#statusEmail").value = "";
    openOrderStatus();
    lookupOrder();
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  }

  function bind() {
    document.querySelectorAll("[data-open-order-status]").forEach(a => a.addEventListener("click", e => {e.preventDefault(); openOrderStatus();}));
    document.querySelectorAll("[data-open-order]").forEach(a => a.addEventListener("click", e => {e.preventDefault(); openCheckout();}));
    $("#orderBtn")?.addEventListener("click", openCheckout);
    $("#checkout")?.addEventListener("click", e => {e.preventDefault(); openCheckout();});
    $("#submitUpiOrder")?.addEventListener("click", createOrder);
    $("#lookupOrder")?.addEventListener("click", lookupOrder);
    $("#orderStatusBtn")?.addEventListener("click", openOrderStatus);

    document.querySelectorAll('[data-close="checkoutPanel"],[data-close="orderStatusPanel"],[data-close="orderSuccess"]').forEach(b => b.addEventListener("click", () => closePanel("#" + b.dataset.close)));
    $("#successBack")?.addEventListener("click", () => closePanel("#orderSuccess"));
    ["#checkoutPanel", "#orderStatusPanel", "#orderSuccess"].forEach(id => $(id)?.addEventListener("click", e => {if (e.target === e.currentTarget) closePanel(id);}));
    loadOrderLink();
  }

  window.OMER_ORDER_API = API;
  window.OMER_OPEN_CHECKOUT = openCheckout;
  window.OMER_OPEN_ORDER_STATUS = openOrderStatus;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind, {once:true});
  else bind();
})();
