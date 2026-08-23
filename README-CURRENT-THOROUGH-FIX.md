# OMER — Current Thorough Fix

This build is based on the current OMER full build and addresses the remaining issues seen on desktop and in the live shop/cart flow.

## Fixed

- Desktop Journal secondary stories now have dedicated photographs.
- `02 — Light After Rain` uses an archive image and remains linked to the collection.
- `03 — The Quiet Road` uses an archive image and remains linked to the collection.
- Desktop Journal grid is rebalanced so the secondary story column does not become a large text-only block.
- Mobile Journal composition remains responsive; note imagery moves below the text at very small widths.
- Add to Bag now gives immediate visual confirmation on the exact button clicked.
- Cart count, cart drawer line items, quantity, subtotal and newly-added item are rendered in the same click handler with no refresh or delay.
- Bag count receives a short update animation.
- New cart item receives a short entrance animation.
- `1 ITEM ADDED TO CART` confirmation remains visible above the cart drawer.
- Existing 15-image catalogue remains intact.
- Existing one-reel setup remains intact.
- Video modal remains a fixed overlay and cannot occupy normal document flow after the footer.

## Verification

- 15 catalogue products
- 15 catalogue image files present
- 1 reel + poster present
- 2 Journal secondary story images present
- 1 `activeVideo` element, inside the video modal only
- JavaScript syntax check passed with Node.js
