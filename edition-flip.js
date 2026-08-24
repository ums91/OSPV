/* OMER — Editions magazine/page flip */
(() => {
  const frames = [
    {
      src: "assets/instagram/07-17891686938141350.webp",
      alt: "Into the Mist — Kashmir",
      label: "FRAME 01"
    },
    {
      src: "assets/instagram/06-17888974866154874.webp",
      alt: "Light After Rain",
      label: "FRAME 02"
    },
    {
      src: "assets/instagram/02-18095911612535573.webp",
      alt: "The Quiet Road",
      label: "FRAME 03"
    },
    {
      src: "assets/instagram/03-18023495780629861.webp",
      alt: "Field Archive — Kashmir",
      label: "FRAME 04"
    },
    {
      src: "assets/instagram/04-1800675858188862.webp",
      alt: "Another moment from the archive",
      label: "FRAME 05"
    }
  ];

  function initEditionFlip() {
    const artwork = document.querySelector(".editorial-artwork");
    const print = artwork?.querySelector(".editorial-print");
    if (!artwork || !print || artwork.dataset.flipReady === "1") return;
    artwork.dataset.flipReady = "1";

    print.innerHTML = `
      <div class="edition-book" aria-label="OMER Editions image book">
        <div class="edition-stack" aria-hidden="true"></div>
        <div class="edition-page" data-page="0">
          <img src="" alt="">
          <span class="edition-page-label"></span>
        </div>
        <button class="edition-arrow edition-prev" type="button" aria-label="Previous photograph">←</button>
        <button class="edition-arrow edition-next" type="button" aria-label="Next photograph">→</button>
        <div class="edition-page-count" aria-live="polite"></div>
      </div>`;

    const book = print.querySelector(".edition-book");
    const page = print.querySelector(".edition-page");
    const img = page.querySelector("img");
    const label = page.querySelector(".edition-page-label");
    const count = print.querySelector(".edition-page-count");
    const prev = print.querySelector(".edition-prev");
    const next = print.querySelector(".edition-next");
    const stack = print.querySelector(".edition-stack");

    // A subtle stack of real pages behind the active page gives the object
    // the physical depth of a small editorial/magazine booklet.
    stack.innerHTML = frames.slice(1, 4).map((_, i) =>
      `<span class="edition-stack-sheet edition-stack-${i + 1}"></span>`
    ).join("");

    let index = 0;
    let busy = false;

    const paint = () => {
      const f = frames[index];
      img.src = f.src;
      img.alt = f.alt;
      label.textContent = f.label;
      count.textContent = `${String(index + 1).padStart(2, "0")} / ${String(frames.length).padStart(2, "0")}`;
      prev.disabled = index === 0;
      next.disabled = index === frames.length - 1;
    };

    const flip = direction => {
      if (busy) return;
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= frames.length) return;

      busy = true;
      page.classList.remove("edition-turn-forward", "edition-turn-back");
      void page.offsetWidth;
      page.classList.add(direction > 0 ? "edition-turn-forward" : "edition-turn-back");

      // Change the image halfway through the page-turn, when the page is
      // visually edge-on, so the transition reads as a physical flip.
      window.setTimeout(() => {
        index = nextIndex;
        paint();
      }, 220);

      window.setTimeout(() => {
        page.classList.remove("edition-turn-forward", "edition-turn-back");
        busy = false;
      }, 540);
    };

    prev.addEventListener("click", e => {
      e.preventDefault();
      e.stopPropagation();
      flip(-1);
    });
    next.addEventListener("click", e => {
      e.preventDefault();
      e.stopPropagation();
      flip(1);
    });

    book.addEventListener("keydown", e => {
      if (e.key === "ArrowRight") flip(1);
      if (e.key === "ArrowLeft") flip(-1);
    });
    book.tabIndex = 0;

    // Swipe support for phones/tablets.
    let startX = null;
    book.addEventListener("touchstart", e => {
      startX = e.changedTouches[0].clientX;
    }, { passive: true });
    book.addEventListener("touchend", e => {
      if (startX === null) return;
      const dx = e.changedTouches[0].clientX - startX;
      startX = null;
      if (Math.abs(dx) > 45) flip(dx < 0 ? 1 : -1);
    }, { passive: true });

    paint();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initEditionFlip, { once: true });
  } else {
    initEditionFlip();
  }
})();
