import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import crypto from "node:crypto";
import Razorpay from "razorpay";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 8787);

const frontendOrigin = String(process.env.FRONTEND_ORIGIN || "").trim();
app.use(cors({
  origin: frontendOrigin || false,
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json());

function publicServerError(res, status=500){
  return res.status(status).json({error:"Unable to complete the request."});
}

const catalog = new Map([
  ["mountain-lake-print", { id:"mountain-lake-print", title:"Mountain Lake", price:1999, stock:8 }],
  ["valley-light-postcard", { id:"valley-light-postcard", title:"Valley Light", price:199, stock:42 }],
  ["winter-lake-print", { id:"winter-lake-print", title:"Winter Lake", price:2299, stock:6 }],
  ["mountain-stream-print", { id:"mountain-stream-print", title:"Mountain Stream", price:2499, stock:12 }],
  ["quiet-water-postcard", { id:"quiet-water-postcard", title:"Quiet Water", price:249, stock:28 }],
  ["summer-field-postcard", { id:"summer-field-postcard", title:"Summer Field", price:2799, stock:9 }]
]);

function calculateLines(lines = []) {
  if (!Array.isArray(lines) || !lines.length) {
    throw new Error("Cart is empty");
  }
  return lines.map(line => {
    const product = catalog.get(line.id);
    const quantity = Number(line.quantity);
    if (!product) throw new Error(`Unknown product: ${line.id}`);
    if (!Number.isInteger(quantity) || quantity < 1) throw new Error("Invalid quantity");
    if (quantity > product.stock) throw new Error(`${product.title} is out of stock`);
    return { ...product, quantity };
  });
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "omer-commerce", timestamp: new Date().toISOString() });
});

app.get("/api/products", (_req, res) => {
  res.json([...catalog.values()]);
});

app.post("/api/orders", async (req, res) => {
  try {
    const lines = calculateLines(req.body.lines);
    const subtotal = lines.reduce((sum, p) => sum + p.price * p.quantity, 0);

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(503).json({
        error: "Payment provider is not configured",
        subtotal_inr: subtotal
      });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    const order = await razorpay.orders.create({
      amount: subtotal * 100,
      currency: "INR",
      receipt: `omer_${Date.now()}`
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error("Order creation failed:", error);
    return publicServerError(res,400);
  }
});

/*
 * Webhook verification example.
 * Configure the payment provider webhook to POST to /api/payment/webhook.
 * Do not trust a browser success callback as proof of payment.
 */
app.post("/api/payment/webhook", express.raw({ type: "application/json" }), (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) return res.status(503).send("Webhook secret not configured");

    const signature = req.headers["x-razorpay-signature"];
    const expected = crypto
      .createHmac("sha256", secret)
      .update(req.body)
      .digest("hex");

    const signatureBuffer = Buffer.from(String(signature || ""), "utf8");
    const expectedBuffer = Buffer.from(expected, "utf8");
    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      return res.status(401).send("Invalid signature");
    }

    // TODO production:
    // 1. Parse verified event.
    // 2. Mark the matching order paid.
    // 3. Decrement inventory in a transaction.
    // 4. Trigger fulfilment/email.
    res.json({ received: true });
  } catch {
    res.status(400).send("Invalid webhook");
  }
});

app.post("/api/newsletter", (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: "Valid email required" });
  }
  // TODO production: persist to PostgreSQL and send double opt-in.
  res.status(201).json({ ok: true });
});

app.listen(port, () => {
  console.log(`OMER commerce API listening on http://localhost:${port}`);
});
