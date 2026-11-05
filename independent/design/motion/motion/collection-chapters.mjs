export function mountRailDrag(root, film, distance) {
  const viewport = root.querySelector('.rotation-viewport');
  const abort = new AbortController();
  const on = (type, callback, options={}) => viewport.addEventListener(type, callback, {...options,signal:abort.signal});
  let gesture = null, suppressUntil = 0;
  viewport.classList.add('can-drag');
  on('pointerdown', event => {
    if (event.pointerType === 'touch' || event.button !== 0) return;
    gesture = { id:event.pointerId, x:event.clientX, y:event.clientY, progress:film?.progress() || 0, scroll:viewport.scrollLeft, moved:false };
  });
  on('pointermove', event => {
    if (!gesture || gesture.id !== event.pointerId) return;
    if (event.buttons !== 1) { gesture=null; viewport.classList.remove('is-dragging'); return; }
    const dx = gesture.x - event.clientX;
    if (!gesture.moved && Math.abs(dx) < 7) return;
    if (!gesture.moved && Math.abs(event.clientY-gesture.y) > Math.abs(dx)) { gesture=null; return; }
    if (!gesture.moved) { gesture.moved=true; viewport.setPointerCapture(event.pointerId); viewport.classList.add('is-dragging'); }
    event.preventDefault();
    if (film) {
      const progress=Math.max(0,Math.min(1,gesture.progress + dx/Math.max(1,distance())));
      const trigger=film.scrollTrigger;
      window.scrollTo({top:trigger.start+progress*(trigger.end-trigger.start),behavior:'instant'});
      trigger.update(); trigger.getTween()?.progress(1);
    } else viewport.scrollLeft=gesture.scroll+dx;
  });
  const release = event => {
    if (!gesture || gesture.id !== event.pointerId) return;
    if (gesture.moved) { suppressUntil=performance.now()+350; if(viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId); }
    gesture=null; viewport.classList.remove('is-dragging');
  };
  on('pointerleave',()=>{ if(gesture && !gesture.moved) gesture=null; });
  on('pointerup',release); on('pointercancel',release); on('lostpointercapture',()=>{gesture=null;viewport.classList.remove('is-dragging');});
  on('click',event=>{if(performance.now()<suppressUntil){event.preventDefault();event.stopImmediatePropagation();}},{capture:true});
  on('dragstart',event=>event.preventDefault());
  return () => { abort.abort(); viewport.classList.remove('can-drag','is-dragging'); };
}

export function mountCollectionChapter(root, { gsap, mobile }) {
  const mode = root.dataset.artDirection;
  const desktop = !mobile && innerWidth > 900 && innerHeight >= 680;
  if (mode === 'macro') {
    const track = root.querySelector('.macro-track');
    const plates = [...root.querySelectorAll('.macro-plate')];
    if (desktop) {
      root.classList.add('is-macro-pinned');
      const captions=plates.map(plate=>plate.querySelector('.macro-caption'));
      const captionHost=root.ownerDocument.createElement('div');
      captionHost.className='macro-caption-stack';
      root.querySelector('.macro-viewport').append(captionHost);
      captions.forEach(caption=>captionHost.append(caption));
      gsap.set(captions,{autoAlpha:0}); gsap.set(captions[0],{autoAlpha:1});
      const film = gsap.timeline({ scrollTrigger: { trigger: root, start: 'top top', end: () => `+=${innerHeight * 2.4}`, pin: true, scrub: .65, invalidateOnRefresh: true } });
      film.to(track, { xPercent: -100, duration: .4, ease: 'power2.inOut' }, .25)
        .to(track, { xPercent: -200, duration: .4, ease: 'power2.inOut' }, 1.35)
        .fromTo(root.querySelector('[data-macro-progress]'), { scaleX: 0 }, { scaleX: 1, duration: 2.5, ease: 'none' }, 0);
      plates.forEach((plate, index) => film.fromTo(plate.querySelector('img'), { scale: .96, xPercent: 1 }, { scale: 1, xPercent: -1, duration: 1, ease: 'none' }, Math.max(0,index - .5)));
      [1,2].forEach((index)=>{
        const at=index===1?.36:1.46;
        film.to(captions[index-1],{autoAlpha:0,y:-8,duration:.12},at)
          .fromTo(captions[index],{autoAlpha:0,y:12},{autoAlpha:1,y:0,duration:.2},at+.12);
      });
      return () => { captions.forEach((caption,i)=>plates[i].append(caption)); captionHost.remove(); root.classList.remove('is-macro-pinned'); };
    }
    plates.forEach(plate => gsap.fromTo(plate.querySelector('img'), { yPercent: 7, scale: 1.1 }, { yPercent: -7, scale: 1.18, ease:'none', scrollTrigger:{ trigger:plate, start:'top bottom',end:'bottom top',scrub:.6 } }));
  }
  if (mode === 'rotation') {
    const track = root.querySelector('.rotation-track');
    if (desktop) {
      root.classList.add('is-rotation-pinned');
      const distance = () => Math.max(0, track.scrollWidth - root.querySelector('.rotation-viewport').clientWidth);
      const film = gsap.timeline({ scrollTrigger: { trigger:root, start:'top top', end:()=>`+=${Math.max(innerHeight, distance()*1.4)}`, pin:true, scrub:.75, invalidateOnRefresh:true } });
      film.to(track, { x:()=>-distance(),ease:'none',duration:1 },0)
        .fromTo(root.querySelector('[data-rotation-progress]'),{scaleX:0},{scaleX:1,ease:'none',duration:1},0);
      const disposeDrag=mountRailDrag(root,film,distance);
      return () => { disposeDrag(); root.classList.remove('is-rotation-pinned'); };
    }
    return mountRailDrag(root,null,null);
  }
  if (mode === 'pace') {
    [...root.querySelectorAll('.pace-row')].forEach((row,i) => {
      gsap.fromTo(row.querySelector('.pace-type'), { xPercent:i%2?8:-8 }, { xPercent:i%2?-3:3, ease:'none',scrollTrigger:{trigger:row,start:'top bottom',end:'bottom top',scrub:.7} });
      gsap.fromTo(row.querySelector('.pace-image'),{yPercent:12,rotation:i%2?-8:5},{yPercent:-12,rotation:0,ease:'none',scrollTrigger:{trigger:row,start:'top bottom',end:'bottom top',scrub:.7}});
    });
  }
}
