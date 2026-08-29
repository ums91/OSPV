/* UMS91 — layout and editorial interactions */
(() => {
  const sectionIds = ["home", "journal", "motion", "editions", "about"];
  const heroNumber = document.querySelector("#heroPage strong");
  const railNumber = document.querySelector("#railIndex b");
  const railFill = document.querySelector("#railIndex span i");

  const getActiveSection = () => {
    const marker = window.scrollY + window.innerHeight * 0.35;
    let active = 0;
    sectionIds.forEach((id, index) => {
      const section = document.getElementById(id);
      if (section && marker >= section.offsetTop) active = index;
    });
    return active;
  };

  const syncSidebarTone = () => {
    const sidebar = document.querySelector(".sidebar");
    if (!sidebar) return;

    // The catalogue/editorial sections use two deliberate tones. Keep the
    // fixed rail in sync with the section currently being viewed.
    const marker = window.scrollY + window.innerHeight * 0.35;
    const ordered = ["home", "journal", "motion", "editions", "shop", "about", "contact"];
    let current = "home";
    ordered.forEach(id => {
      const section = document.getElementById(id);
      if (section && marker >= section.offsetTop) current = id;
    });

    const lightSections = new Set(["home", "editions", "shop", "about"]);
    sidebar.classList.toggle("sidebar-light", lightSections.has(current));
    sidebar.classList.toggle("sidebar-dark", !lightSections.has(current));
  };

  const updateProgress = () => {
    const active = getActiveSection();
    const number = String(active + 1).padStart(2, "0");

    if (heroNumber) heroNumber.textContent = number;
    if (railNumber) railNumber.textContent = number;

    if (railFill) {
      railFill.style.height = `${(active / Math.max(sectionIds.length - 1, 1)) * 100}%`;
    }

    document.querySelectorAll(".sidebar nav a, .topbar nav a").forEach(link => {
      link.classList.toggle(
        "active",
        link.getAttribute("href") === `#${sectionIds[active]}`
      );
    });

    syncSidebarTone();
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

  /*
   * Editorial story buttons now lead somewhere useful.
   * They open the matching photograph in the existing product viewer instead
   * of only displaying a temporary toast.
   */
  const storyProducts = {
    mist: "Into the Mist",
    light: "Light After Rain",
    road: "The Quiet Road"
  };

  const openStoryProduct = title => {
    const cards = [...document.querySelectorAll("#products .product")];
    const card = cards.find(item =>
      item.querySelector(".product-info h3")?.textContent.trim().toLowerCase() === title.toLowerCase()
    );

    if (card) {
      const view = card.querySelector("[data-view]");
      if (view) {
        view.click();
        return true;
      }
      card.click();
      return true;
    }

    document.querySelector("#shop")?.scrollIntoView({ behavior: "smooth", block: "start" });
    const toast = document.querySelector("#toast");
    if (toast) {
      toast.textContent = `${title.toUpperCase()} — SEE THE COLLECTION BELOW`;
      toast.classList.add("show");
      clearTimeout(window.__editorialStoryToast);
      window.__editorialStoryToast = setTimeout(() => toast.classList.remove("show"), 2600);
    }
    return false;
  };

  document.querySelectorAll(".editorial-story-btn").forEach(button => {
    button.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      const title = storyProducts[button.dataset.story];
      if (title) openStoryProduct(title);
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
      archiveImage.style.transform = `scale(1.035) translate(${x * -8}px, ${y * -8}px)`;
    });
    archive.addEventListener("pointerleave", () => {
      archiveImage.style.transform = "";
    });
  }
})();

/* Persistent top navigation behavior. */
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

/* Final mobile-menu synchronization safety layer. */
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
  menu.querySelectorAll("a,[data-close]").forEach(el => el.addEventListener("click", () => {
    menu.classList.remove("open");
    sync();
  }));
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      menu.classList.remove("open");
      sync();
    }
  });
})();
