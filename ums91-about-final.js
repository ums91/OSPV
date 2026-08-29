/* UMS91 — FINAL ABOUT / NAVIGATION SAFETY
   This file is intentionally separate from editorial-redesign.js so the
   existing interaction logic remains untouched.
*/
(() => {
  /* Neutralize the earlier multi-thumbnail contact-sheet experiment if it
     exists in a previously cached editorial-redesign.js. */
  document.querySelectorAll(".editorial-archive-contact-sheet").forEach(el => el.remove());

  const hero = document.querySelector("#home.hero");
  const page = document.querySelector("#heroPage");
  if (!hero || !page) return;

  const setPosition = () => {
    page.style.position = "fixed";
    page.style.right = window.innerWidth <= 720 ? "8vw" : "5%";
    page.style.bottom = window.innerWidth <= 720 ? "25px" : "86px";
    page.style.left = "auto";
    page.style.top = "auto";
    page.style.zIndex = "40";
    page.style.visibility = "visible";
  };

  const setHeroState = active => {
    page.style.opacity = active ? "1" : ".24";
  };

  setPosition();

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      setHeroState(entries[0]?.isIntersecting === true);
    }, { threshold: 0.02 });
    observer.observe(hero);
  } else {
    const update = () => {
      const rect = hero.getBoundingClientRect();
      setHeroState(rect.bottom > 0 && rect.top < window.innerHeight);
    };
    addEventListener("scroll", update, { passive:true });
    update();
  }

  addEventListener("resize", setPosition, { passive:true });
})();

/* Keep the sidebar's section order aligned with the top navigation even if
   an older cached index contains the former Editions/Motion order. */
(() => {
  const nav = document.querySelector(".sidebar nav");
  if (!nav) return;

  const desired = ["#home", "#journal", "#motion", "#editions", "#about", "#contact"];
  const links = [...nav.querySelectorAll("a[href]")];
  const map = new Map(links.map(link => [link.getAttribute("href"), link]));

  desired.forEach(href => {
    const link = map.get(href);
    if (link) nav.appendChild(link);
  });
})();
