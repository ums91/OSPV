/* OSPV MICROGRAPHICS SYSTEM — visual annotation only */
(()=>{
const specs=[
{sel:".hero",index:"01",code:"FIELD / 01",serial:"UMS91—FIELD SYSTEM / 01—05",measure:"34°02'N · 74°50'E"},
{sel:"#journal",index:"02",code:"JOURNAL / 02",serial:"UMS91—JOURNAL / ARCHIVE / 02",measure:"OBSERVATION / SEQUENCE 02"},
{sel:"#editions",index:"03",code:"EDITIONS / 03",serial:"UMS91—EDITION SYSTEM / 03",measure:"FRAME / EDITION / OBJECT"},
{sel:"#shop",index:"04",code:"COLLECTION / 04",serial:"UMS91—OBJECTS / 04",measure:"PRINT / POSTCARD / EDITION"},
{sel:"#about",index:"05",code:"PHILOSOPHY / 05",serial:"UMS91—PHILOSOPHY / 05",measure:"ATTENTION / MEMORY / PLACE"}
];
function add(el,s){if(!el||el.querySelector(":scope > .mg-system"))return;const b=document.createElement("div");b.className="mg-system";b.setAttribute("aria-hidden","true");b.innerHTML=`<span class="mg-corner tl"></span><span class="mg-corner tr"></span><span class="mg-corner bl"></span><span class="mg-corner br"></span><span class="mg-label gold" style="left:28px;top:28px">${s.code}</span><span class="mg-label mg-measure-label" style="left:28px;bottom:28px">${s.measure}</span><span class="mg-serial" style="right:24px;top:36%">/ ${s.serial} /</span><span class="mg-crosshair" style="left:50%;top:18%"></span><span class="mg-dot" style="left:18%;top:52%"></span><span class="mg-bracket a"></span><span class="mg-bracket b"></span><span class="mg-index"><strong>${s.index}</strong><span>/ 05</span></span><span class="mg-scan" style="top:42%"></span>`;el.appendChild(b);if("IntersectionObserver"in window){new IntersectionObserver(es=>es.forEach(e=>b.classList.toggle("mg-active",e.isIntersecting)),{threshold:.15}).observe(el)}}
function init(){specs.forEach(s=>add(document.querySelector(s.sel),s))}if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
