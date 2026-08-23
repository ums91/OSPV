# OMER — Persistent Navigation Safe Patch

This is an incremental GitHub.dev patch. It does not replace products, photos, reels, backend, database, or `script.js`.

Files to replace at repository root:
- `index.html`
- `editorial-redesign.css`

File to add/replace:
- `editorial-redesign.js`

Changes:
- Top navigation stays visible while scrolling.
- Cart/BAG remains visible and reachable.
- Scrolled state becomes a subtle glass/blur bar that blends with the editorial design.
- Active section is indicated with a restrained gold underline.
- Section anchors receive scroll offset so headings are not hidden beneath the fixed navigation.
- Mobile retains the compact menu + BAG controls.

Suggested commit: `Keep navigation visible while scrolling`
