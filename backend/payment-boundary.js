// Optional future backend boundary.
// Deploy this separately from GitHub Pages (Node/Express, serverless function,
// Cloudflare Worker, Vercel/Netlify function, etc.).
//
// IMPORTANT:
// 1. Calculate the final amount server-side.
// 2. Create the payment-provider order server-side.
// 3. Never trust a price sent by the browser.
// 4. Verify the payment signature/webhook server-side.
// 5. Persist order + fulfilment status in a database.
//
// Example route contract:
//
// POST /api/orders
// {
//   "lines": [{"id":"mountain-peak-print","quantity":1}]
// }
//
// -> { "orderId": "..." }
//
// Then the frontend can open a hosted/SDK checkout for that order.
