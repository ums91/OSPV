# OMER Commerce API

This is the secure-server boundary for the GitHub Pages frontend.

## Why it exists

GitHub Pages can host the beautiful storefront, but it must **not** contain:

- payment secrets
- order-signing secrets
- webhook secrets
- authoritative pricing
- inventory mutation logic
- payment verification

The backend handles those responsibilities.

## Local setup

```bash
npm install
cp .env.example .env
npm run dev
```

API health check:

```text
GET http://localhost:8787/api/health
```

## Real payments

The scaffold uses Razorpay's server-side order creation API.

Before accepting real money:

1. Create the merchant account.
2. Add the real credentials to `.env`.
3. Configure webhook signing.
4. Connect PostgreSQL.
5. Replace the in-memory catalogue with database queries.
6. Verify every payment webhook server-side.
7. Make inventory decrement transactional.
8. Add shipping and fulfilment logic.
9. Add email/order confirmation.
10. Test UPI/cards/refunds in sandbox first.

Never commit `.env`.
