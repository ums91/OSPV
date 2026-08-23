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

    // Keep the top navigation useful while scrolling by reflecting the
    // section currently nearest the upper reading line.
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
