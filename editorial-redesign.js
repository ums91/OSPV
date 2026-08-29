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
 * About / Philosophy — restrained archive fragment.
 *
 * Keep the About section photographic and quiet: one additional archival
 * frame is used beneath the existing right-hand image instead of a grid
 * of small thumbnails. This removes the clutter and fills the unused area
 * with a single coherent visual.
 */
(() => {
  const side = document.querySelector(".editorial-archive-side");
  if (!side || side.querySelector(".editorial-archive-fragment")) return;

  const fragment = document.createElement("div");
  fragment.className = "editorial-archive-fragment";
  fragment.innerHTML = `
    <div class="archive-fragment-image">
      <img src="assets/instagram/06-17888974866154874.webp"
           alt="UMS91 archive frame after rain"
           loading="lazy">
      <span>FRAME 015 · AFTER RAIN</span>
    </div>
    <div class="archive-fragment-meta">
      <span>FIELD ARCHIVE / 015</span>
      <span>34°02'N · 74°50'E</span>
    </div>
  `;
  side.appendChild(fragment);

  if (!document.getElementById("ums91AboutRefinementStyles")) {
    const style = document.createElement("style");
    style.id = "ums91AboutRefinementStyles";
    style.textContent = `
      /* ---------- About / Philosophy refinement ---------- */
      .about.editorial-philosophy-wrap{
        padding-top:100px;
        padding-bottom:120px;
      }

      .editorial-philosophy-title{
        display:grid;
        grid-template-columns:minmax(220px,.65fr) minmax(0,1.35fr);
        align-items:end;
        gap:6vw;
        margin-bottom:58px;
      }

      .editorial-philosophy-title .eyebrow{
        margin:0 0 10px;
      }

      .editorial-philosophy-title h2{
        margin:0;
        max-width:760px;
        justify-self:start;
        font-size:clamp(62px,7vw,108px);
        line-height:.84;
      }

      .editorial-archive{
        display:grid;
        grid-template-columns:minmax(0,1.55fr) minmax(280px,.55fr);
        gap:5vw;
        align-items:start;
      }

      .editorial-archive-main{
        height:min(560px,43vw);
        min-height:420px;
      }

      .editorial-archive-side{
        padding-top:0;
      }

      .editorial-archive-side > div:first-child{
        width:100%;
        aspect-ratio:4/5;
        overflow:hidden;
      }

      .editorial-archive-side > div:first-child img{
        display:block;
        width:100%;
        height:100%;
        object-fit:cover;
      }

      .editorial-archive-fragment{
        margin-top:28px;
      }

      .archive-fragment-image{
        position:relative;
        aspect-ratio:16/9;
        overflow:hidden;
        background:#d5d0c7;
      }

      .archive-fragment-image img{
        display:block;
        width:100%;
        height:100%;
        object-fit:cover;
        filter:saturate(.72) contrast(.96);
        transition:transform .7s cubic-bezier(.2,.8,.2,1);
      }

      .archive-fragment-image:hover img{
        transform:scale(1.035);
      }

      .archive-fragment-image span{
        position:absolute;
        left:12px;
        bottom:10px;
        color:#fff;
        font-size:7px;
        letter-spacing:.18em;
        text-shadow:0 1px 7px rgba(0,0,0,.45);
      }

      .archive-fragment-meta{
        display:flex;
        justify-content:space-between;
        gap:14px;
        margin-top:10px;
        color:#999;
        font-size:7px;
        letter-spacing:.17em;
        text-transform:uppercase;
      }

      .editorial-philosophy-copy{
        width:min(980px,100%);
        margin:58px 0 0 auto;
        display:grid;
        grid-template-columns:minmax(0,1.7fr) minmax(220px,.55fr);
        gap:7vw;
        align-items:start;
      }

      .editorial-philosophy-copy p:first-of-type{
        position:relative;
        max-width:850px;
        padding:0;
        margin:0;
        font:400 clamp(24px,2.2vw,34px)/1.38 "Playfair Display",serif;
        letter-spacing:-.018em;
        color:#33322f;
      }

      .editorial-philosophy-copy p:first-of-type::before{
        content:"“";
        position:absolute;
        left:-42px;
        top:-22px;
        font:500 70px/1 "Playfair Display",serif;
        color:var(--ums91-gold);
        opacity:.55;
      }

      .editorial-philosophy-copy p:nth-of-type(2){
        max-width:310px;
        margin:5px 0 0;
        color:#77736c;
        font-size:13px;
        line-height:1.9;
      }

      .editorial-philosophy-copy a{
        grid-column:2;
        margin-top:-42px;
        width:max-content;
      }

      @media(max-width:900px){
        .editorial-philosophy-title{
          grid-template-columns:1fr;
          gap:28px;
        }

        .editorial-philosophy-title h2{
          justify-self:start;
        }

        .editorial-archive{
          grid-template-columns:minmax(0,1.35fr) minmax(220px,.65fr);
        }

        .editorial-philosophy-copy{
          width:min(760px,100%);
          grid-template-columns:1fr;
          gap:22px;
          margin-top:48px;
        }

        .editorial-philosophy-copy p:nth-of-type(2){
          max-width:430px;
          margin:0;
        }

        .editorial-philosophy-copy a{
          grid-column:auto;
          margin-top:0;
        }
      }

      @media(max-width:720px){
        .about.editorial-philosophy-wrap{
          padding-top:80px;
          padding-bottom:90px;
        }

        .editorial-archive{
          grid-template-columns:1fr;
          gap:28px;
        }

        .editorial-archive-main{
          height:500px;
        }

        .editorial-archive-fragment{
          margin-top:24px;
        }

        .editorial-philosophy-copy{
          width:100%;
          margin-top:42px;
        }

        .editorial-philosophy-copy p:first-of-type{
          max-width:100%;
          font-size:clamp(21px,6vw,28px);
          line-height:1.42;
        }

        .editorial-philosophy-copy p:first-of-type::before{
          position:static;
          display:block;
          height:30px;
          margin-bottom:4px;
          font-size:52px;
          line-height:.8;
        }

        .editorial-philosophy-copy p:nth-of-type(2){
          max-width:100%;
        }

        .editorial-philosophy-copy a{
          margin-top:4px;
        }
      }
    `;
    document.head.appendChild(style);
  }
})();
