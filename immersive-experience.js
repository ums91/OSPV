/* UMS91 IMMERSIVE EXPERIENCE
   Drop this file into the OSPV root and load it after your existing scripts.
   It does not replace or modify the commerce/order system.
*/
(() => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = "immersive-experience.css";
  document.head.appendChild(css);

  const fine = matchMedia("(pointer:fine)").matches;

  // ---------- Reactive cursor ----------
  if (fine) {
    const cursor = document.createElement("div");
    cursor.className = "ums91-ix-cursor";
    cursor.innerHTML = "<i></i><b>VIEW</b>";
    document.body.appendChild(cursor);

    let x = innerWidth/2, y = innerHeight/2, tx=x, ty=y;
    addEventListener("pointermove", e => {
      tx=e.clientX; ty=e.clientY;
      cursor.classList.add("is-visible");
    }, {passive:true});
    addEventListener("pointerleave", () => cursor.classList.remove("is-visible"));

    const tick = () => {
      x += (tx-x)*.14; y += (ty-y)*.14;
      cursor.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-50%)`;
      requestAnimationFrame(tick);
    };
    tick();

    document.querySelectorAll("a,button,.editorial-journal-feature,.editorial-note-card,.editorial-artwork,.product-card,.product").forEach(el => {
      el.addEventListener("pointerenter", () => cursor.classList.add("is-link"));
      el.addEventListener("pointerleave", () => cursor.classList.remove("is-link"));
    });
  }

  // ---------- Hero WebGL ripple ----------
  const hero = document.querySelector(".hero-image");
  const heroImg = hero?.querySelector("img");

  if (hero && heroImg && fine) {
    const canvas = document.createElement("canvas");
    canvas.className = "ums91-ix-webgl";
    hero.appendChild(canvas);

    const gl = canvas.getContext("webgl", {alpha:true, antialias:false});
    if (gl) {
      const V = `
        attribute vec2 p; attribute vec2 uv; varying vec2 v;
        void main(){v=uv;gl_Position=vec4(p,0.,1.);}
      `;
      const F = `
        precision highp float;
        uniform sampler2D tex; uniform vec2 mouse; uniform float time;
        varying vec2 v;
        void main(){
          vec2 d=v-mouse;
          float dist=length(d);
          float wave=sin(dist*42.0-time*3.5)*exp(-dist*8.0);
          vec2 uv=v+normalize(d+vec2(.00001))*wave*.025;
          float ca=exp(-dist*7.0)*.004;
          float r=texture2D(tex,uv+vec2(ca,0.)).r;
          float g=texture2D(tex,uv).g;
          float b=texture2D(tex,uv-vec2(ca,0.)).b;
          gl_FragColor=vec4(r,g,b,.94);
        }
      `;
      const shader=(type,src)=>{
        const s=gl.createShader(type);
        gl.shaderSource(s,src); gl.compileShader(s);
        return gl.getShaderParameter(s,gl.COMPILE_STATUS)?s:null;
      };
      const vs=shader(gl.VERTEX_SHADER,V), fs=shader(gl.FRAGMENT_SHADER,F);
      if(vs&&fs){
        const p=gl.createProgram();
        gl.attachShader(p,vs); gl.attachShader(p,fs); gl.linkProgram(p);
        if(gl.getProgramParameter(p,gl.LINK_STATUS)){
          gl.useProgram(p);
          const buf=gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER,buf);
          gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([
            -1,-1,0,0, 1,-1,1,0, -1,1,0,1, 1,1,1,1
          ]),gl.STATIC_DRAW);
          const ap=gl.getAttribLocation(p,"p"), au=gl.getAttribLocation(p,"uv");
          gl.enableVertexAttribArray(ap); gl.vertexAttribPointer(ap,2,gl.FLOAT,false,16,0);
          gl.enableVertexAttribArray(au); gl.vertexAttribPointer(au,2,gl.FLOAT,false,16,8);

          const tex=gl.createTexture();
          gl.bindTexture(gl.TEXTURE_2D,tex);
          gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);

          const mouse=gl.getUniformLocation(p,"mouse");
          const time=gl.getUniformLocation(p,"time");
          const texLoc=gl.getUniformLocation(p,"tex");
          let mx=.5,my=.5,tx=.5,ty=.5,ready=false,start=performance.now();

          const upload=()=>{
            try{
              gl.bindTexture(gl.TEXTURE_2D,tex);
              gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
              gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,heroImg);
              ready=true;
            }catch(e){}
          };
          heroImg.complete ? upload() : heroImg.addEventListener("load",upload,{once:true});

          hero.addEventListener("pointermove",e=>{
            const r=hero.getBoundingClientRect();
            tx=(e.clientX-r.left)/r.width;
            ty=1-(e.clientY-r.top)/r.height;
          },{passive:true});
          hero.addEventListener("pointerleave",()=>{tx=.5;ty=.5},{passive:true});

          const resize=()=>{
            const d=Math.min(devicePixelRatio||1,1.6), r=hero.getBoundingClientRect();
            canvas.width=Math.max(1,r.width*d);
            canvas.height=Math.max(1,r.height*d);
            gl.viewport(0,0,canvas.width,canvas.height);
          };
          resize(); addEventListener("resize",resize,{passive:true});

          const frame=now=>{
            mx+=(tx-mx)*.08; my+=(ty-my)*.08;
            if(ready){
              gl.useProgram(p);
              gl.uniform2f(mouse,mx,my);
              gl.uniform1f(time,(now-start)/1000);
              gl.uniform1i(texLoc,0);
              gl.activeTexture(gl.TEXTURE0);
              gl.bindTexture(gl.TEXTURE_2D,tex);
              gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
            }
            requestAnimationFrame(frame);
          };
          requestAnimationFrame(frame);
        }
      }
    }
  }

  // ---------- Photo depth ----------
  const depth = [
    [".hero-image img", .035],
    [".editorial-journal-feature img", -.022],
    [".editorial-print", .035],
    [".editorial-archive-main img", -.018]
  ].map(([s,a])=>[document.querySelector(s),a]).filter(x=>x[0]);

  let ticking=false;
  const update=()=>{
    ticking=false;
    for(const [el,a] of depth){
      const r=el.getBoundingClientRect();
      const p=(r.top+r.height/2-innerHeight/2)/innerHeight;
      el.style.setProperty("--ix-depth", `${p*a*innerHeight}px`);
    }
  };
  addEventListener("scroll",()=>{if(!ticking){ticking=true;requestAnimationFrame(update)}},{passive:true});
  update();

  // ---------- Magnetic controls ----------
  if(fine){
    document.querySelectorAll(".pill,.under,.editorial-edition-button,.bag-btn,.order-status-btn").forEach(el=>{
      el.classList.add("ums91-ix-magnetic");
      el.addEventListener("pointermove",e=>{
        const r=el.getBoundingClientRect();
        const x=(e.clientX-r.left-r.width/2)/r.width;
        const y=(e.clientY-r.top-r.height/2)/r.height;
        el.style.transform=`translate(${x*6}px,${y*5}px)`;
      });
      el.addEventListener("pointerleave",()=>el.style.transform="");
    });
  }

  // ---------- Section transition particles ----------
  const layer=document.createElement("canvas");
  layer.className="ums91-ix-particles";
  document.body.appendChild(layer);
  const ctx=layer.getContext("2d");
  const resizeParticles=()=>{
    const d=Math.min(devicePixelRatio||1,1.4);
    layer.width=innerWidth*d; layer.height=innerHeight*d;
    ctx.setTransform(d,0,0,d,0,0);
  };
  resizeParticles(); addEventListener("resize",resizeParticles,{passive:true});

  let busy=false, current="home";
  const burst=img=>{
    if(busy||!img||!img.complete||!img.naturalWidth)return;
    busy=true;
    const c=document.createElement("canvas"), w=64;
    const h=Math.max(36,Math.round(w*img.naturalHeight/img.naturalWidth));
    c.width=w;c.height=h;
    const x=c.getContext("2d",{willReadFrequently:true});
    try{x.drawImage(img,0,0,w,h)}catch(e){busy=false;return}
    const d=x.getImageData(0,0,w,h).data,r=img.getBoundingClientRect(),pts=[];
    for(let y=0;y<h;y+=2)for(let xx=0;xx<w;xx+=2){
      const i=(y*w+xx)*4;
      if(d[i+3]<100)continue;
      pts.push({
        x:r.left+xx/w*r.width,y:r.top+y/h*r.height,
        c:`rgba(${d[i]},${d[i+1]},${d[i+2]},.85)`,
        vx:(Math.random()-.5)*7,vy:(Math.random()-.5)*7-1
      });
    }
    const p=pts.length>450?pts.sort(()=>Math.random()-.5).slice(0,450):pts;
    layer.style.opacity="1";
    const start=performance.now();
    const draw=now=>{
      const t=Math.min(1,(now-start)/1000);
      ctx.clearRect(0,0,innerWidth,innerHeight);
      for(const q of p){
        const e=t*t*(3-2*t),a=1-t;
        ctx.fillStyle=q.c.replace(".85)",`${a})`);
        ctx.fillRect(q.x+q.vx*50*e,q.y+q.vy*50*e,1.3,1.3);
      }
      if(t<1)requestAnimationFrame(draw);
      else{layer.style.opacity="0";busy=false}
    };
    requestAnimationFrame(draw);
  };

  const observer=new IntersectionObserver(entries=>{
    for(const e of entries){
      if(!e.isIntersecting||e.intersectionRatio<.28)continue;
      const id=e.target.id;
      if(!id||id===current)continue;
      const old=document.querySelector(`#${current} img`)||heroImg;
      current=id; burst(old);
    }
  },{threshold:[.28,.5]});

  ["home","journal","motion","editions","shop","about","contact"]
    .map(id=>document.getElementById(id)).filter(Boolean)
    .forEach(s=>observer.observe(s));

  // ---------- Subtle 3D tilt for the featured artwork ----------
  if(fine){
    document.querySelectorAll(".editorial-artwork,.editorial-journal-feature").forEach(card=>{
      card.addEventListener("pointermove",e=>{
        const r=card.getBoundingClientRect();
        const x=(e.clientX-r.left)/r.width-.5;
        const y=(e.clientY-r.top)/r.height-.5;
        card.style.transform=`perspective(1200px) rotateX(${y*-2.5}deg) rotateY(${x*2.5}deg) translateZ(0)`;
      });
      card.addEventListener("pointerleave",()=>card.style.transform="");
    });
  }
})();
