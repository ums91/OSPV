# OMER — Visual Journal & Editions

A premium editorial photography journal and commerce-ready storefront.

## What is included

### Frontend — GitHub Pages ready
- HTML5
- CSS3
- JavaScript ES Modules
- TypeScript contracts
- JSON catalogue
- Responsive editorial layout
- Photography journal
- Premium editions
- Product filters
- Product detail modal
- Search
- Persistent shopping bag
- INR pricing
- Mobile navigation
- Scroll progress
- Custom cursor
- Film grain
- Micro-interactions
- Newsletter UI

### Commerce backend scaffold
- Node.js
- Express
- CORS
- dotenv
- Razorpay server-side order creation
- Webhook signature verification boundary
- PostgreSQL schema
- Inventory/order model
- Newsletter endpoint

### Admin architecture
A separate authenticated admin application can be added without exposing it publicly through GitHub Pages.

## Important: GitHub Pages + UPI

GitHub Pages is static hosting. It should host the storefront only.

Real UPI/card payments require a secure backend. This package therefore separates the two:

```text
GitHub Pages
     │
     │ HTTPS API
     ▼
OMER Commerce API
     │
     ├── PostgreSQL
     ├── Inventory
     ├── Orders
     └── Payment Provider
             │
             └── UPI / Cards / etc.
```

The backend scaffold uses Razorpay as the example provider. It can be replaced with another provider later.

**Never commit API secrets. Never calculate the authoritative order total only in browser JavaScript. Never treat a client-side payment callback as proof of payment.**

## Run the frontend

Because the site uses ES modules and Fetch:

```bash
python -m http.server 8000
```

Open:

```text
http://localhost:8000
```

## Run the backend

From the project root:

```bash
npm install
cp .env.example .env
npm run dev
```

Backend:

```text
http://localhost:8787
```

Health:

```text
http://localhost:8787/api/health
```

For local frontend-to-backend checkout, the frontend defaults to `http://localhost:8787`.

For production, set:

```html
<script>
  window.OMER_API_BASE = "https://api.yourdomain.com";
</script>
```

before `script.js`, or replace the configuration with your deployment environment.

## GitHub Pages configuration

The public GitHub Pages build does **not** call `localhost` for checkout. Until a production API is configured, the checkout button safely reports that secure checkout is not connected.

When the backend is live, create `config.js` from `config.example.js` and load it before `script.js` in `index.html`.

## Adding your photographs later

You can replace the demonstration images in:

```text
assets/products.json
```

Each product contains:

- title
- type
- price
- edition
- size
- image
- stock

For example:

```json
{
  "id": "my-kashmir-print",
  "title": "My Photograph",
  "type": "Fine Art Print",
  "price": 2999,
  "edition": "Signed · Edition of 20",
  "size": "12 × 16 in",
  "image": "assets/photos/my-photograph.jpg",
  "stock": 20
}
```

Create:

```text
assets/photos/
```

and place your photographs there.

## Production checklist

Before taking real orders:

- [ ] Replace all demonstration photographs
- [ ] Connect PostgreSQL
- [ ] Move product catalogue authority to the database
- [ ] Configure payment provider
- [ ] Configure UPI
- [ ] Configure webhook secret
- [ ] Verify webhooks server-side
- [ ] Implement transactional inventory
- [ ] Add customer shipping address
- [ ] Add shipping calculation
- [ ] Add order confirmation email
- [ ] Add refund handling
- [ ] Add authenticated admin
- [ ] Enable HTTPS
- [ ] Configure production CORS
- [ ] Add rate limiting
- [ ] Add logging/monitoring
- [ ] Test sandbox payments
- [ ] Test mobile UPI flow
- [ ] Test failed/cancelled payments
- [ ] Test duplicate webhook events
- [ ] Test overselling/race conditions

## Project

```text
omer-visual-journal-complete/
├── index.html
├── styles.css
├── script.js
├── package.json
├── .env.example
├── .gitignore
├── README.md
├── assets/
│   ├── hero.jpg
│   └── products.json
├── src/
│   ├── store.js
│   └── store.ts
├── backend/
│   ├── server.js
│   └── README.md
├── database/
│   └── schema.sql
├── admin/
│   └── README.md
└── docs/
    └── COMMERCE-ROADMAP.md
```

## Deployment recommendation

Use:

- **GitHub Pages / Cloudflare Pages** for the public frontend
- **Render / Railway / Fly.io / Vercel serverless / Cloudflare Workers** for the API
- **PostgreSQL** for orders and inventory
- **Razorpay or Cashfree** for UPI/cards

The frontend and backend should be separate deployments.

## Photography

The current visual/product images are placeholders. Replace them with your own photographs before publishing the commercial store.

## Instagram content

The demonstration photography has been replaced with a curated selection from the supplied Instagram export for `@ums91`. Images are optimized to WebP for the website, while the original export remains separate from the deployable site.


## Instagram Reels / Videos

The site now includes a dedicated **Moving Frames** section.

The supplied Instagram reel export is stored locally:

```text
assets/
├── reels/
├── reel-posters/
└── reels.json
```

Videos are not loaded into memory all at once. The page displays lightweight poster frames and only assigns the MP4 source when a visitor opens a reel. This keeps the initial page considerably lighter while preserving all exported videos.

Your Instagram link:

```text
https://www.instagram.com/ums91/
```

is used as the source/attribution link.

For production, very large videos should ideally be transcoded into web-optimized H.264/WebM variants and served through a CDN/object-storage layer rather than from GitHub Pages.
