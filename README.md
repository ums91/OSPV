# OMER — Visual Journal & Editions · v2

A high-end editorial photography website prepared for a future photography / postcard commerce layer.

## Stack

- **HTML5** — semantic page structure
- **CSS3** — editorial responsive system, animation, grid, overlays, film grain
- **JavaScript ES Modules** — application logic
- **TypeScript source** — future-safe contracts for products, cart and payment integration
- **JSON** — editable product catalog
- **Web APIs** — Fetch, LocalStorage, IntersectionObserver, Intl.NumberFormat

No framework is required. It runs on GitHub Pages.

## Current commerce-ready features

- Product / edition catalogue
- Postcard and fine-art-print filters
- Product detail modal
- Persistent local shopping bag
- Quantity tracking
- INR formatting
- Stock messaging
- Checkout integration boundary
- Clean separation between catalogue, UI and future payment logic

## Important payment architecture

GitHub Pages is static hosting. **Do not place payment secrets, merchant keys, order-signing logic, or payment verification in browser JavaScript.**

When you are ready to accept real payments:

```text
GitHub Pages
    │
    ├── Photography / Editions UI
    ├── Product catalogue
    └── Shopping bag
             │
             ▼
       Secure backend/API
             │
             ├── Create order
             ├── Calculate final amount
             ├── Verify payment signature
             ├── Store order/customer data
             └── Update fulfilment status
             │
             ▼
     Payment provider
       (UPI / cards / etc.)
```

A provider such as Razorpay or Cashfree can be connected later through a secure backend. UPI can then be offered as one of the payment methods.

## GitHub Pages deployment

Upload the repository contents and enable:

**Settings → Pages → Deploy from a branch → main → / (root)**

## Development

The production GitHub Pages site uses the checked-in JavaScript module. `src/store.ts` is the TypeScript contract/source layer for the future application architecture.

If you later add a build system, compile TypeScript into `src/*.js` and keep the public site as the static deployment target.

## Recommended future phases

### Phase 1 — current
Brand + journal + editions + local bag.

### Phase 2
Real checkout:
- Secure backend
- Razorpay/Cashfree
- UPI
- Order IDs
- Payment verification
- Email confirmations

### Phase 3
Creator commerce:
- Admin dashboard
- Upload new photographs
- Edition inventory
- Signed/numbered edition tracking
- Shipping rates
- Coupon codes
- Order management

### Phase 4
Premium experience:
- Customer accounts
- Wishlist
- Print-size selector
- Limited-edition countdown
- Certificates of authenticity
- Automated inventory decrement
- Analytics

## Project structure

```text
omer-photo-blog-v2/
├── index.html
├── styles.css
├── script.js
├── README.md
├── assets/
│   ├── hero.jpg
│   └── products.json
└── src/
    ├── store.js
    └── store.ts
```
