# OMER — Final Motion Video Position Fix

This build keeps the existing design and fixes the specific issue where the
Motion reel preview was also appearing at the bottom of the page.

Cause:
`#videoModal` had open-state styling but no hidden fixed-state styling, so
the `<video id="activeVideo">` remained in normal document flow after the
footer.

Fix:
- video modal is fixed to the viewport from its initial hidden state
- it cannot occupy document layout space
- clicking the Motion reel opens the same video in the overlay
- closing it pauses and removes the source
- desktop/tablet/mobile modal sizing is corrected

The existing cart behaviour and one-reel setup are preserved.
