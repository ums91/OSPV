/* OMER — layout interaction fixes
   Works with the classes currently used by index.html.
*/
(() => {
  const sectionIds = ["home", "journal", "motion", "editions", "about"];
  const heroNumber = document.querySelector("#heroPage strong");
  const railNumber = document.querySelector("#railIndex b");
  const railFill = document.querySelector("#railIndex span i");

  const updateProgress = () => {
    const marker = window.scrollY + window.innerHeight * 0.35;
    let active = 0;
    sectionIds.forEach((id, index) => {
      const section = document.getElementById(id);
      if (section && marker >= section.offsetTop) active = index;
    });

    const number = String(active + 1).padStart(2, "0");
    if (heroNumber) heroNumber.textContent = number;
    if (railNumber) railNumber.textContent = number;

    if (railFill) {
      railFill.style.height =
        `${(active / Math.max(sectionIds.length - 1, 1)) * 100}%`;
    }

    document.querySelectorAll(".sidebar nav a, .topbar nav a").forEach(link => {
      link.classList.toggle(
        "active",
        link.getAttribute("href") === `#${sectionIds[active]}`
      );
    });
  };

  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress);
  updateProgress();

  document.querySelector("#heroScroll")?.addEventListener("click", () => {
    document.querySelector("#journal")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });

  const storyText = {
    mist: "FIELD NOTE — KASHMIR · Into the Mist",
    light: "OBSERVATION — Light After Rain",
    road: "FIELD NOTE — The Quiet Road"
  };

  document.querySelectorAll(".editorial-story-btn").forEach(button => {
    button.addEventListener("click", () => {
      const message = storyText[button.dataset.story];
      if (!message) return;

      const toast = document.querySelector("#toast");
      if (!toast) return;
      toast.textContent = message;
      toast.classList.add("show");
      clearTimeout(window.__editorialStoryToast);
      window.__editorialStoryToast = setTimeout(() => {
        toast.classList.remove("show");
      }, 2600);
    });
  });

  const archive = document.querySelector(".editorial-archive-main");
  const archiveImage = archive?.querySelector("img");
  if (archive && archiveImage && matchMedia("(pointer:fine)").matches) {
    archive.addEventListener("pointermove", event => {
      const rect = archive.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      archiveImage.style.transform =
        `scale(1.035) translate(${x * -8}px, ${y * -8}px)`;
    });
    archive.addEventListener("pointerleave", () => {
      archiveImage.style.transform = "";
    });
  }
})();

/* OMER persistent navigation behavior */
(() => {
  const topbar = document.querySelector('.topbar');
  if (!topbar) return;

  const links = [...topbar.querySelectorAll('nav a[href^="#"]')];
  const sections = links
    .map(link => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  const update = () => {
    topbar.classList.toggle('is-scrolled', window.scrollY > 24);
    const line = window.scrollY + Math.min(150, window.innerHeight * 0.18);
    let current = sections[0]?.id || 'home';

    for (const section of sections) {
      if (section.offsetTop <= line) current = section.id;
    }

    links.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
    });
  };

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { update(); ticking = false; });
  };

  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', update, { passive: true });
  update();
})();

/* Final mobile-menu synchronization safety layer */
(() => {
  const menu = document.querySelector("#mobileMenu");
  const btn = document.querySelector("#menuBtn");
  if (!menu || !btn) return;

  const sync = () => {
    const open = menu.classList.contains("open");
    btn.setAttribute("aria-expanded", String(open));
    btn.classList.toggle("is-open", open);
  };

  btn.addEventListener("click", sync, true);
  menu.querySelectorAll("a,[data-close]").forEach(el =>
    el.addEventListener("click", () => {
      menu.classList.remove("open");
      sync();
    })
  );

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      menu.classList.remove("open");
      sync();
    }
  });
})();

/*
 * Hero page indicator — persistent, faded-after-Hero behaviour.
 * The 01 / 05 marker remains on screen while scrolling. It is prominent
 * over the Hero and becomes a quiet/faded cue after the Hero is passed.
 */
(() => {
  const hero = document.querySelector("#home.hero");
  const page = document.querySelector("#heroPage");
  if (!hero || !page) return;

  const place = () => {
    page.style.position = "fixed";
    page.style.top = "auto";
    page.style.bottom = window.innerWidth <= 720 ? "25px" : "86px";
    page.style.right = window.innerWidth <= 720 ? "8vw" : "5%";
    page.style.left = "auto";
    page.style.zIndex = "40";
    page.style.transform = "none";
    page.style.visibility = "visible";
  };

  place();
  addEventListener("resize", place, { passive: true });

  const setHeroState = visible => {
    page.style.opacity = visible ? "1" : "0.24";
    page.style.visibility = "visible";
    page.style.pointerEvents = visible ? "auto" : "none";
  };

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      setHeroState(entries[0]?.isIntersecting === true);
    }, { threshold: 0.02 });
    observer.observe(hero);
  } else {
    const fallback = () => {
      const rect = hero.getBoundingClientRect();
      setHeroState(rect.bottom > 0 && rect.top < window.innerHeight);
    };
    addEventListener("scroll", fallback, { passive: true });
    fallback();
  }
})();

/*
 * About / Philosophy — archival contact sheet.
 *
 * The original right-hand archive image ends well before the philosophy
 * section ends, leaving a large unused area. This fills that area with a
 * restrained contact-sheet / field-index treatment using existing UMS91
 * archive photographs. No new assets or HTML edits are required.
 */
(() => {
  const side = document.querySelector(".editorial-archive-side");
  if (!side || side.querySelector(".editorial-archive-contact-sheet")) return;

  const sheet = document.createElement("div");
  sheet.className = "editorial-archive-contact-sheet";

  sheet.innerHTML = `
    <div class="archive-sheet-head">
      <span>FIELD INDEX / 014</span>
      <span>KASHMIR · WINTER</span>
    </div>
    <div class="archive-sheet-grid">
      <div><img src="assets/instagram/07-17891686938141350.webp" alt="UMS91 archive frame 014" loading="lazy"><span>014</span></div>
      <div><img src="assets/instagram/06-17888974866154874.webp" alt="UMS91 archive frame 015" loading="lazy"><span>015</span></div>
      <div><img src="assets/instagram/02-18095911612535573.webp" alt="UMS91 archive frame 016" loading="lazy"><span>016</span></div>
      <div><img src="assets/instagram/03-18023495780629861.webp" alt="UMS91 archive frame 017" loading="lazy"><span>017</span></div>
    </div>
    <div class="archive-sheet-foot">
      <span>34°02'N · 74°50'E</span>
      <span>ARCHIVE / 2026</span>
    </div>
  `;

  side.appendChild(sheet);

  if (!document.getElementById("ums91ArchiveSheetStyles")) {
    const style = document.createElement("style");
    style.id = "ums91ArchiveSheetStyles";
    style.textContent = `
      .editorial-archive-side{
        min-width:0;
      }

      .editorial-archive-contact-sheet{
        margin-top:34px;
        padding-top:16px;
        border-top:1px solid rgba(23,23,20,.14);
      }

      .archive-sheet-head,
      .archive-sheet-foot{
        display:flex;
        justify-content:space-between;
        gap:16px;
        color:#8b877f;
        font-size:7px;
        line-height:1.4;
        letter-spacing:.19em;
        text-transform:uppercase;
      }

      .archive-sheet-grid{
        display:grid;
        grid-template-columns:repeat(4,minmax(0,1fr));
        gap:7px;
        margin:12px 0 13px;
      }

      .archive-sheet-grid > div{
        position:relative;
        aspect-ratio:1/1;
        overflow:hidden;
        background:#d5d0c7;
      }

      .archive-sheet-grid img{
        display:block;
        width:100%;
        height:100%;
        object-fit:cover;
        filter:grayscale(.15) saturate(.7);
        transition:transform .55s cubic-bezier(.2,.8,.2,1);
      }

      .archive-sheet-grid > div:hover img{
        transform:scale(1.06);
      }

      .archive-sheet-grid span{
        position:absolute;
        left:6px;
        bottom:5px;
        color:#fff;
        font-size:6px;
        letter-spacing:.12em;
        text-shadow:0 1px 5px rgba(0,0,0,.5);
      }

      .archive-sheet-foot{
        color:#aaa69e;
      }

      @media(max-width:720px){
        .editorial-archive-contact-sheet{
          margin-top:28px;
        }

        .archive-sheet-grid{
          grid-template-columns:repeat(2,minmax(0,1fr));
          gap:8px;
        }
      }
    `;
    document.head.appendChild(style);
  }
})();
