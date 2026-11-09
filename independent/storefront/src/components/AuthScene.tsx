"use client";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "./useReducedMotion";

export function AuthScene() {
  const host = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false), [ready, setReady] = useState(false), [paused, setPaused] = useState(false);
  const reduced = useReducedMotion();
  const pausedRef = useRef(paused), resumeRef = useRef<() => void>(() => {});

  useEffect(() => {
    const node = host.current;
    if (!node) return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setNear(true); observer.disconnect(); }
    }, { rootMargin: "200px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  useEffect(() => { pausedRef.current = paused; if (!paused) resumeRef.current(); }, [paused]);

  useEffect(() => {
    setReady(false);
    const node = host.current;
    if (!node || reduced || !near) return;
    let disposed = false, cleanup = () => {};
    void (async () => {
      const THREE = await import("three");
      const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");
      const { MeshoptDecoder } = await import("three/addons/libs/meshopt_decoder.module.js");
      if (disposed) return;
      let renderer: import("three").WebGLRenderer;
      try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" }); } catch { return; }
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(32, 1, .01, 100);
      scene.add(new THREE.HemisphereLight(0xc9e9ff, 0x22394a, 2.4));
      const key = new THREE.DirectionalLight(0xffffff, 3.2); key.position.set(3, 5, 4); scene.add(key);
      const rim = new THREE.DirectionalLight(0x88d9ee, 2); rim.position.set(-4, 1, -2); scene.add(rim);
      const pivot = new THREE.Group(); pivot.rotation.set(.06, -.3, -.08); scene.add(pivot);
      node.appendChild(renderer.domElement);
      let frame = 0, visible = true, elapsed = 0, last = 0, baseY = 0, loaded = false, contextLost = false;
      const displaySize = new THREE.Vector3(2.7, 1.7, 1.2);
      function resize() {
        if (!node || disposed || contextLost) return;
        const w = node.clientWidth, h = node.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false); camera.aspect = w / h;
        const fitHeight = Math.max(displaySize.y / .78, displaySize.x / (camera.aspect * .8));
        const distance = fitHeight / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))) + displaySize.z * .5;
        camera.position.set(0, distance * .06, distance); camera.lookAt(0, 0, 0); camera.updateProjectionMatrix();
        if (loaded) renderer.render(scene, camera);
      }
      function stop() { if (frame) cancelAnimationFrame(frame); frame = 0; last = 0; }
      function render(time: number) {
        frame = 0;
        if (disposed || contextLost || !visible || document.hidden || pausedRef.current) { last = 0; return; }
        elapsed += last ? Math.min((time - last) / 1000, .05) : 0; last = time;
        pivot.rotation.set(.06 + Math.sin(elapsed * .35) * .06, -.3 + Math.sin(elapsed * .22) * .18, -.08);
        pivot.position.y = baseY + Math.sin(elapsed * .6) * .045;
        renderer.render(scene, camera); frame = requestAnimationFrame(render);
      }
      function resume() { if (loaded && !disposed && !contextLost && visible && !document.hidden && !pausedRef.current && !frame) frame = requestAnimationFrame(render); }
      resumeRef.current = resume;
      const observer = new ResizeObserver(resize); observer.observe(node); resize();
      const intersection = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (!visible) stop(); else resume(); }); intersection.observe(node);
      const visibility = () => { if (document.hidden) stop(); else resume(); };
      document.addEventListener("visibilitychange", visibility);
      const lost = (event: Event) => { event.preventDefault(); contextLost = true; stop(); setReady(false); };
      renderer.domElement.addEventListener("webglcontextlost", lost);
      const release = (root: import("three").Object3D) => {
        const textures = new Set<import("three").Texture>(), materials = new Set<import("three").Material>();
        root.traverse(item => {
          const mesh = item as import("three").Mesh;
          mesh.geometry?.dispose();
          for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) if (material) materials.add(material);
        });
        for (const material of materials) {
          for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
          material.dispose();
        }
        const bitmaps = new Set<ImageBitmap>();
        textures.forEach(texture => { const image = texture.source.data; if (typeof ImageBitmap !== "undefined" && image instanceof ImageBitmap) bitmaps.add(image); texture.dispose(); });
        bitmaps.forEach(bitmap => bitmap.close());
      };
      cleanup = () => {
        stop(); resumeRef.current = () => {};
        observer.disconnect(); intersection.disconnect();
        document.removeEventListener("visibilitychange", visibility);
        renderer.domElement.removeEventListener("webglcontextlost", lost);
        release(pivot); renderer.dispose(); renderer.domElement.remove();
      };
      try {
        const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync("/assets/nike-tn-blue-white.glb");
        if (disposed) { release(gltf.scene); return; }
        const model = gltf.scene;
        // Normalize in model space before the presentation group's scale/turn.
        const box = new THREE.Box3().setFromObject(model), size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);
        const normalized = new THREE.Group(); normalized.add(model); normalized.rotation.y = Math.PI / 2; pivot.add(normalized);
        pivot.scale.setScalar(2.7 / Math.max(size.x, size.y, size.z));
        const centered = new THREE.Box3().setFromObject(pivot).getCenter(new THREE.Vector3()); pivot.position.sub(centered); baseY = pivot.position.y;
        new THREE.Box3().setFromObject(pivot).getSize(displaySize);
        loaded = true; resize();
        renderer.render(scene, camera); setReady(true); resume();
      } catch { /* The photograph remains a complete static fallback. */ }
    })().catch(() => {});
    return () => { disposed = true; cleanup(); };
  }, [near, reduced]);

  return <div className="auth-visual"><div ref={host} className="auth-scene" data-ready={ready ? "true" : undefined} aria-hidden="true"><img src="/assets/hero-product-desktop.webp" alt="" width="635" height="301"/><span className="auth-scene-shadow"/></div>{!reduced && <button className="auth-motion-toggle" type="button" disabled={!ready} onClick={() => setPaused(value => !value)} aria-pressed={paused}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">{paused ? <path d="m8 5 11 7-11 7Z"/> : <path d="M8 5v14M16 5v14"/>}</svg>{!ready ? "Static product preview" : paused ? "Play animation" : "Pause animation"}</button>}</div>;
}
