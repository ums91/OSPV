/* OMER — Editions magazine/page flip */
(() => {
  const frames = [
    {src:"assets/instagram/15-18524130307032995.webp",alt:"Kashmir archive photograph",label:"FRAME 01"},
    {src:"assets/instagram/05-17919169577868859.webp",alt:"Mountain Stream — Kashmir",label:"FRAME 02"},
    {src:"assets/instagram/02-18095911612535573.webp",alt:"The Quiet Road",label:"FRAME 03"},
    {src:"assets/instagram/03-18023495780629861.webp",alt:"Field Archive — Kashmir",label:"FRAME 04"},
    {src:"assets/instagram/04-18006758585188862.webp",alt:"Another moment from the archive",label:"FRAME 05"}
  ];

  function initEditionFlip(){
    const artwork=document.querySelector(".editorial-artwork");
    const print=artwork?.querySelector(".editorial-print");
    if(!artwork||!print||artwork.dataset.flipReady==="1")return;
    artwork.dataset.flipReady="1";
    print.innerHTML=`
      <div class="edition-book" aria-label="OMER Editions image book">
        <div class="edition-stack" aria-hidden="true"></div>
        <div class="edition-page" data-page="0">
          <img src="" alt="" draggable="false">
          <span class="edition-page-label"></span>
        </div>
        <button class="edition-arrow edition-prev" type="button" aria-label="Previous photograph">←</button>
        <button class="edition-arrow edition-next" type="button" aria-label="Next photograph">→</button>
        <div class="edition-page-count" aria-live="polite"></div>
      </div>`;
    const book=print.querySelector(".edition-book"),page=print.querySelector(".edition-page"),
      img=page.querySelector("img"),label=page.querySelector(".edition-page-label"),
      count=print.querySelector(".edition-page-count"),prev=print.querySelector(".edition-prev"),
      next=print.querySelector(".edition-next"),stack=print.querySelector(".edition-stack");

    stack.innerHTML=frames.slice(1,4).map((_,i)=>`<span class="edition-stack-sheet edition-stack-${i+1}"></span>`).join("");

    // Preload every page so a mobile flip cannot reveal a blank frame.
    frames.forEach(f=>{const preload=new Image();preload.src=f.src;});

    let index=0,busy=false;
    const paint=()=>{
      const f=frames[index];
      img.src=f.src;img.alt=f.alt;label.textContent=f.label;
      count.textContent=`${String(index+1).padStart(2,"0")} / ${String(frames.length).padStart(2,"0")}`;
      prev.disabled=index===0;next.disabled=index===frames.length-1;
      book.dataset.page=index+1;
    };
    const flip=direction=>{
      if(busy)return;
      const nextIndex=index+direction;
      if(nextIndex<0||nextIndex>=frames.length)return;
      busy=true;
      page.classList.remove("edition-turn-forward","edition-turn-back");
      void page.offsetWidth;
      page.classList.add(direction>0?"edition-turn-forward":"edition-turn-back");
      window.setTimeout(()=>{index=nextIndex;paint();},220);
      window.setTimeout(()=>{page.classList.remove("edition-turn-forward","edition-turn-back");busy=false;},540);
    };

    prev.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();flip(-1)});
    next.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();flip(1)});
    book.addEventListener("keydown",e=>{if(e.key==="ArrowRight")flip(1);if(e.key==="ArrowLeft")flip(-1)});
    book.tabIndex=0;

    let startX=null,startY=null;
    book.addEventListener("touchstart",e=>{
      const t=e.changedTouches[0];startX=t.clientX;startY=t.clientY;
    },{passive:true});
    book.addEventListener("touchend",e=>{
      if(startX===null)return;
      const t=e.changedTouches[0],dx=t.clientX-startX,dy=t.clientY-startY;
      startX=startY=null;
      if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.2)flip(dx<0?1:-1);
    },{passive:true});
    paint();
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initEditionFlip,{once:true});
  else initEditionFlip();
})();