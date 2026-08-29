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

  /* Story controls use the site's existing toast rather than creating
     a second competing notification component. */
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

  /* Smooth archive parallax without changing layout dimensions. */
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
  const menu=document.querySelector("#mobileMenu");
  const btn=document.querySelector("#menuBtn");
  if(!menu||!btn)return;
  const sync=()=>{
    const open=menu.classList.contains("open");
    btn.setAttribute("aria-expanded",String(open));
    btn.classList.toggle("is-open",open);
  };
  btn.addEventListener("click",sync,true);
  menu.querySelectorAll("a,[data-close]").forEach(el=>el.addEventListener("click",()=>{
    menu.classList.remove("open"); sync();
  }));
  document.addEventListener("keydown",e=>{
    if(e.key==="Escape"){menu.classList.remove("open");sync();}
  });
})();

/* =========================================================
   UMS91 — ABOUT / PHILOSOPHY REFINEMENT
   - Rebalances the title, archive and philosophy copy.
   - Makes the quote a deliberate editorial statement instead
     of a narrow vertical text column.
   - Keeps the existing images, compass and archive metadata.
   - Keeps mobile stacked and readable.
   ========================================================= */
(() => {
  const style = document.createElement("style");
  style.id = "ums91-about-refinement";
  style.textContent = `
    .about.editorial-philosophy-wrap{
      padding-top:88px !important;
      padding-bottom:105px !important;
    }

    .editorial-philosophy-title{
      grid-template-columns:minmax(230px,.72fr) minmax(0,1.28fr) !important;
      gap:6vw !important;
      align-items:end !important;
      margin-bottom:58px !important;
    }

    .editorial-philosophy-title h2{
      justify-self:start !important;
      max-width:680px !important;
      font-size:clamp(62px,6.7vw,102px) !important;
      line-height:.84 !important;
    }

    .editorial-archive{
      grid-template-columns:minmax(0,1.55fr) minmax(260px,.55fr) !important;
      gap:4vw !important;
      align-items:start !important;
    }

    .editorial-archive-main{
      height:min(500px,42vw) !important;
      min-height:390px !important;
    }

    .editorial-archive-side{
      padding-top:0 !important;
    }

    .editorial-archive-side > div{
      aspect-ratio:4/3 !important;
    }

    .editorial-philosophy-copy{
      width:100% !important;
      max-width:none !important;
      margin:72px 0 0 !important;
      display:grid !important;
      grid-template-columns:minmax(0,1.5fr) minmax(220px,.5fr) !important;
      gap:6vw !important;
      align-items:center !important;
      position:relative !important;
    }

    .editorial-philosophy-copy p:first-child{
      position:relative !important;
      max-width:850px !important;
      margin:0 !important;
      padding-left:68px !important;
      color:#292925 !important;
      font-family:"Playfair Display",serif !important;
      font-size:clamp(27px,2.35vw,39px) !important;
      font-weight:500 !important;
      line-height:1.25 !important;
      letter-spacing:-.025em !important;
    }

    .editorial-philosophy-copy p:first-child::before{
      content:"“" !important;
      position:absolute !important;
      left:0 !important;
      top:-18px !important;
      color:#bd955e !important;
      font-family:"Playfair Display",serif !important;
      font-size:78px !important;
      line-height:1 !important;
    }

    .editorial-philosophy-copy p:nth-child(2){
      max-width:300px !important;
      margin:0 0 14px !important;
      color:#666 !important;
      font-size:12px !important;
      line-height:1.85 !important;
    }

    .editorial-philosophy-copy a{
      grid-column:2 !important;
      justify-self:start !important;
      margin-top:-6px !important;
    }

    @media (max-width:1100px){
      .editorial-philosophy-title{
        grid-template-columns:1fr 1.2fr !important;
      }
      .editorial-philosophy-copy{
        grid-template-columns:1.25fr .75fr !important;
      }
      .editorial-philosophy-copy p:first-child{
        font-size:clamp(25px,2.8vw,34px) !important;
      }
    }

    @media (max-width:720px){
      .editorial-philosophy-title{
        grid-template-columns:1fr !important;
        gap:22px !important;
        margin-bottom:40px !important;
      }
      .editorial-philosophy-title h2{
        font-size:clamp(55px,14vw,76px) !important;
      }
      .editorial-archive{
        grid-template-columns:1fr !important;
        gap:28px !important;
      }
      .editorial-archive-main{
        height:480px !important;
        min-height:0 !important;
      }
      .editorial-philosophy-copy{
        display:block !important;
        margin-top:52px !important;
      }
      .editorial-philosophy-copy p:first-child{
        padding-left:42px !important;
        max-width:none !important;
        font-size:clamp(24px,7vw,32px) !important;
        line-height:1.3 !important;
      }
      .editorial-philosophy-copy p:first-child::before{
        font-size:58px !important;
        top:-12px !important;
      }
      .editorial-philosophy-copy p:nth-child(2){
        max-width:360px !important;
        margin:28px 0 12px !important;
      }
      .editorial-philosophy-copy a{
        display:inline-block !important;
      }
    }
  `;
  document.head.appendChild(style);
})();

/* =========================================================
   UMS91 — SIDEBAR NAV ORDER
   Match the desktop/mobile navigation sequence:
   Home → Journal → Motion → Editions → About → Contact.
   ========================================================= */
(() => {
  const nav = document.querySelector(".sidebar nav");
  if (!nav) return;

  const desired = ["#home", "#journal", "#motion", "#editions", "#about", "#contact"];
  const links = new Map(
    [...nav.querySelectorAll("a[href^='#']")].map(link => [link.getAttribute("href"), link])
  );

  desired.forEach(href => {
    const link = links.get(href);
    if (link) nav.appendChild(link);
  });
})();
