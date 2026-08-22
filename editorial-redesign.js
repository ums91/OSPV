
/* OMER Editorial Redesign — additive behaviour */

(() => {
  const sections = [
    "home",
    "journal",
    "motion",
    "editions",
    "about"
  ];

  const heroNumber = document.querySelector("#heroPage strong");
  const railNumber = document.querySelector("#railIndex b");
  const railFill = document.querySelector("#railIndex span i");

  function updateEditorialPosition() {
    const point = window.scrollY + window.innerHeight * 0.38;
    let active = 0;

    sections.forEach((id, index) => {
      const el = document.getElementById(id);
      if (el && point >= el.offsetTop) active = index;
    });

    const number = String(active + 1).padStart(2, "0");

    if (heroNumber) heroNumber.textContent = number;
    if (railNumber) railNumber.textContent = number;

    if (railFill) {
      const progress = sections.length > 1
        ? active / (sections.length - 1) * 100
        : 0;
      railFill.style.height = `${progress}%`;
    }
  }

  window.addEventListener("scroll", updateEditorialPosition, { passive: true });
  window.addEventListener("resize", updateEditorialPosition);
  updateEditorialPosition();

  document.querySelector("#heroScroll")?.addEventListener("click", () => {
    document.querySelector("#journal")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });

  document.querySelectorAll(".editorial-enter").forEach(btn => {
    btn.addEventListener("click", event => {
      event.preventDefault();
      document.querySelector("#motion-gallery")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });
  });

  const stories = {
    mist: "FIELD NOTE · KASHMIR — Into the Mist",
    light: "OBSERVATION — Light After Rain",
    road: "FIELD NOTE — The Quiet Road"
  };

  function showEditorialToast(message) {
    document.querySelector(".editorial-toast")?.remove();

    const toast = document.createElement("div");
    toast.className = "editorial-toast";
    toast.innerHTML = `
      <span>${message}</span>
      <button aria-label="Close">×</button>
    `;

    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add("show"));

    toast.querySelector("button").addEventListener("click", () => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    });

    setTimeout(() => {
      if (!document.body.contains(toast)) return;
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 4200);
  }

  document.querySelectorAll(".editorial-story-btn").forEach(button => {
    button.addEventListener("click", () => {
      const message = stories[button.dataset.story];
      if (message) showEditorialToast(message);
    });
  });

  const archive = document.querySelector(".editorial-archive-main");

  if (archive) {
    const image = archive.querySelector("img");

    archive.addEventListener("mousemove", event => {
      if (!image) return;

      const rect = archive.getBoundingClientRect();
      const x = event.clientX / rect.width - (rect.left / rect.width) - 0.5;
      const y = event.clientY / rect.height - (rect.top / rect.height) - 0.5;

      image.style.transform = `
        scale(1.045)
        translate(${x * -12}px, ${y * -12}px)
      `;
    });

    archive.addEventListener("mouseleave", () => {
      if (image) image.style.transform = "";
    });
  }

  const navLinks = [
    ...document.querySelectorAll(".topbar nav a, .sidebar nav a")
  ];

  const observed = sections
    .map(id => document.getElementById(id))
    .filter(Boolean);

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      navLinks.forEach(link => {
        link.classList.toggle(
          "active",
          link.getAttribute("href") === `#${entry.target.id}`
        );
      });
    });
  }, {
    rootMargin: "-35% 0px -55% 0px",
    threshold: 0
  });

  observed.forEach(section => observer.observe(section));
})();
