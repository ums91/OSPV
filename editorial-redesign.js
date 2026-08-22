
/* OMER Editorial Redesign v2 — only controls the new editorial layer */

(() => {
  const sections = ["home","journal","motion","editions","shop","about","contact"];
  const hero = document.querySelector("#heroPage strong");
  const rail = document.querySelector("#railIndex b");
  const railFill = document.querySelector("#railIndex i");

  const update = () => {
    const point = window.scrollY + innerHeight * .38;
    let active = 0;
    sections.forEach((id,i) => {
      const el = document.getElementById(id);
      if (el && point >= el.offsetTop) active = i;
    });
    const n = String(Math.min(active + 1,5)).padStart(2,"0");
    if (hero) hero.textContent = n;
    if (rail) rail.textContent = n;
    if (railFill) railFill.style.height = `${(Math.min(active,4)/4)*100}%`;
  };

  addEventListener("scroll", update, {passive:true});
  addEventListener("resize", update);
  update();

  document.querySelector("#heroScroll")?.addEventListener("click",()=>{
    document.querySelector("#journal")?.scrollIntoView({behavior:"smooth"});
  });

  const stories = {
    mist: "FIELD NOTE · KASHMIR — Into the Mist",
    light: "OBSERVATION — Light After Rain",
    road: "FIELD NOTE — The Quiet Road"
  };

  document.querySelectorAll(".editorial-story-btn").forEach(btn=>{
    btn.addEventListener("click",()=>{
      document.querySelector(".editorial-toast")?.remove();
      const toast=document.createElement("div");
      toast.className="editorial-toast";
      toast.innerHTML=`<span>${stories[btn.dataset.story] || "OMER JOURNAL"}</span><button aria-label="Close">×</button>`;
      document.body.appendChild(toast);
      requestAnimationFrame(()=>toast.classList.add("show"));
      const close=()=>{toast.classList.remove("show");setTimeout(()=>toast.remove(),300)};
      toast.querySelector("button").onclick=close;
      setTimeout(()=>document.body.contains(toast)&&close(),4000);
    });
  });

  const archive=document.querySelector(".editorial-archive-main");
  const img=archive?.querySelector("img");
  archive?.addEventListener("mousemove",e=>{
    if(!img) return;
    const r=archive.getBoundingClientRect();
    const x=(e.clientX-r.left)/r.width-.5;
    const y=(e.clientY-r.top)/r.height-.5;
    img.style.transform=`scale(1.045) translate(${x*-10}px,${y*-10}px)`;
  });
  archive?.addEventListener("mouseleave",()=>{if(img)img.style.transform=""});

  const links=[...document.querySelectorAll(".topbar nav a,.sidebar nav a")];
  const targets=sections.map(id=>document.getElementById(id)).filter(Boolean);
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(!entry.isIntersecting)return;
      links.forEach(a=>a.classList.toggle("active",a.getAttribute("href")===`#${entry.target.id}`));
    });
  },{rootMargin:"-35% 0px -55% 0px"});
  targets.forEach(x=>observer.observe(x));
})();
