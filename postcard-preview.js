/* UMS91 — format-aware physical preview. Postcard and Fine Art Print are intentionally different. */
(() => {
  let currentProduct=null;
  let open=false;
  const $=(s,r=document)=>r.querySelector(s);

  function ensureStage(){
    const modal=$("#productModal");
    if(!modal || $("#postcardPreview")) return;

    const stage=document.createElement("div");
    stage.id="postcardPreview";
    stage.className="postcard-preview";
    stage.setAttribute("aria-hidden","true");
    stage.innerHTML=`
      <div class="postcard-preview-head">
        <span id="formatPreviewLabel">POSTCARD PREVIEW</span>
        <button type="button" class="postcard-close" aria-label="Close preview">×</button>
      </div>

      <div class="postcard-scene">
        <div class="postcard-card" tabindex="0" role="button" aria-label="Flip postcard to back">
          <div class="postcard-face postcard-front">
            <img id="postcardFrontImg" alt="">
            <span id="postcardFrontTitle"></span>
          </div>

          <div class="postcard-face postcard-back">
            <div class="postcard-back-brand">UMS91</div>
            <div class="postcard-back-line"></div>
            <div class="postcard-back-content">
              <div class="postcard-message">A moment<br>worth keeping.</div>
              <div class="postcard-address"><i></i><i></i><i></i></div>
            </div>
            <div class="postcard-stamp">UMS91<br><small>VISUAL JOURNAL</small></div>
            <div class="postcard-back-footer">PHOTOGRAPH · POSTCARD · MEMORY</div>
          </div>

          <div class="fine-art-print-face">
            <div class="fine-art-frame">
              <img id="fineArtImg" alt="">
            </div>
            <div class="fine-art-caption">
              <span id="fineArtTitle"></span>
              <small>UMS91 · FINE ART PRINT</small>
            </div>
          </div>
        </div>
      </div>

      <div class="postcard-preview-controls">
        <button type="button" class="postcard-flip-btn">FLIP <span>↔</span></button>
        <span id="formatPreviewHint">FRONT / BACK</span>
      </div>`;

    modal.appendChild(stage);

    $(".postcard-close",stage).addEventListener("click",closePreview);

    $(".postcard-flip-btn",stage).addEventListener("click",e=>{
      e.stopPropagation();
      flip();
    });

    $(".postcard-card",stage).addEventListener("click",e=>{
      if(e.target.closest(".postcard-flip-btn")) return;
      if(currentProduct?.type==="Postcard") flip();
    });

    $(".postcard-card",stage).addEventListener("keydown",e=>{
      if((e.key==="Enter"||e.key===" ") && currentProduct?.type==="Postcard"){
        e.preventDefault();
        flip();
      }
    });
  }

  function syncProduct(){
    const modal=$("#productModal"), img=$("#mImg");
    if(!modal?.classList.contains("open") || !img?.src) return;

    const type=($("#mType")?.textContent||"").trim();
    currentProduct={
      title:$("#mTitle")?.textContent||"UMS91",
      image:img.getAttribute("src")||img.src,
      type:type==="Postcard" ? "Postcard" : "Fine Art Print"
    };

    // Inject the preview control only after the existing product modal has
    // opened. This leaves the core product-card click handler untouched.
    const addButton=$("#addProduct");
    if(!addButton) return;

    let btn=$("#formatPreviewBtn");
    if(!btn){
      btn=document.createElement("button");
      btn.id="formatPreviewBtn";
      btn.type="button";
      btn.className="format-preview-trigger";
      addButton.insertAdjacentElement("afterend",btn);
      btn.addEventListener("click",e=>{
        e.preventDefault();
        e.stopPropagation();
        openPreview();
      });
    }

    btn.textContent=currentProduct.type==="Postcard"
      ? "SEE IT AS A POSTCARD "
      : "SEE IT AS FINE ART ";

    const arrow=document.createElement("span");
    arrow.textContent="↗";
    btn.appendChild(arrow);
  }

  function openPreview(){
    ensureStage();
    if(!currentProduct) return;

    const stage=$("#postcardPreview");
    const card=$(".postcard-card",stage);
    const postcardImg=$("#postcardFrontImg",stage);
    const artImg=$("#fineArtImg",stage);

    postcardImg.src=currentProduct.image;
    postcardImg.alt=currentProduct.title+" postcard preview";
    $("#postcardFrontTitle",stage).textContent=currentProduct.title;

    artImg.src=currentProduct.image;
    artImg.alt=currentProduct.title+" fine art print preview";
    $("#fineArtTitle",stage).textContent=currentProduct.title;

    stage.classList.toggle("is-fine-art",currentProduct.type==="Fine Art Print");
    card.classList.remove("is-back");
    $(".postcard-flip-btn",stage).style.display=currentProduct.type==="Postcard" ? "" : "none";
    $("#formatPreviewLabel",stage).textContent=
      currentProduct.type==="Postcard" ? "POSTCARD PREVIEW" : "FINE ART PREVIEW";
    $("#formatPreviewHint",stage).textContent=
      currentProduct.type==="Postcard" ? "FRONT / BACK" : "MOUNTED PRINT";

    stage.classList.add("open");
    stage.setAttribute("aria-hidden","false");
    open=true;
  }

  function closePreview(){
    const stage=$("#postcardPreview");
    if(!stage) return;
    stage.classList.remove("open","is-fine-art");
    stage.setAttribute("aria-hidden","true");
    open=false;
  }

  function flip(){
    if(currentProduct?.type!=="Postcard") return;
    const card=$("#postcardPreview .postcard-card");
    if(!card) return;
    card.classList.toggle("is-back");
    card.setAttribute(
      "aria-label",
      card.classList.contains("is-back") ? "Flip postcard to front" : "Flip postcard to back"
    );
  }

  function installProductClickFallback(){
    // Some of the site's visual overlay layers can sit above the product card.
    // Delegate clicks on the photo/card to the existing VIEW action instead of
    // creating a second product-opening implementation.
    document.addEventListener("click",e=>{
      const card=e.target.closest?.(".product");
      if(!card) return;
      if(e.target.closest("button,a,input,select,textarea")) return;
      const view=card.querySelector("[data-view]");
      if(view){
        e.preventDefault();
        e.stopPropagation();
        view.click();
      }
    },true);
  }

  function init(){
    ensureStage();
    installProductClickFallback();
    const modal=$("#productModal");
    if(modal){
      new MutationObserver(syncProduct).observe(modal,{
        subtree:true,childList:true,attributes:true,
        attributeFilter:["src","class"]
      });
    }
    syncProduct();
    document.addEventListener("keydown",e=>{
      if(e.key==="Escape"&&open) closePreview();
    });
  }

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded",init,{once:true});
  }else{
    init();
  }
})();
