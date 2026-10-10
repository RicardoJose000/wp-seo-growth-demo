import * as THREE from "three";

const stage = document.getElementById("kwStage");
const DATA = window.KW_DATA || [];
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (stage && DATA.length) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  stage.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x060b16, 12, 26);
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 15);
  camera.lookAt(0, 0, 0);

  // soft round sprite for points and glows
  const makeTex = (inner, outer) => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d");
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, inner);
    grd.addColorStop(0.35, outer);
    grd.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  const dotTex = makeTex("rgba(255,255,255,1)", "rgba(255,255,255,0.55)");
  const glowTex = makeTex("rgba(255,255,255,0.9)", "rgba(255,255,255,0.18)");

  const root = new THREE.Group();
  scene.add(root);

  // background dust
  {
    const n = 500, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const r = 9 + Math.random() * 8, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = r * Math.cos(ph) * 0.6;
      pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    root.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0x8fa3c4, size: 0.05, map: dotTex, transparent: true, opacity: 0.45, depthWrite: false })));
  }

  // clusters
  const clusters = [];
  const hubs = [];
  const R = 4.6;
  DATA.forEach((c, i) => {
    const a = (i / DATA.length) * Math.PI * 2 + 0.3;
    const center = new THREE.Vector3(Math.cos(a) * R, [0.9, -1.1, 1.4, -0.6, 0.2][i % 5], Math.sin(a) * R);
    const col = new THREE.Color(c.color);
    const g = new THREE.Group();
    g.position.copy(center);
    root.add(g);

    const hub = new THREE.Mesh(new THREE.SphereGeometry(0.34, 32, 32), new THREE.MeshBasicMaterial({ color: col }));
    hub.userData.index = i;
    g.add(hub);
    hubs.push(hub);

    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: col, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
    glow.scale.set(2.4, 2.4, 1);
    g.add(glow);

    const n = 22 + c.rows.length * 4;
    const pos = new Float32Array(n * 3);
    const linePos = new Float32Array(n * 6);
    for (let k = 0; k < n; k++) {
      const r = 1.0 + Math.random() * 1.3, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
      const x = r * Math.sin(ph) * Math.cos(th), y = r * Math.cos(ph) * 0.8, z = r * Math.sin(ph) * Math.sin(th);
      pos.set([x, y, z], k * 3);
      linePos.set([0, 0, 0, x, y, z], k * 6);
    }
    const pg = new THREE.BufferGeometry();
    pg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const pMat = new THREE.PointsMaterial({ color: col, size: 0.16, map: dotTex, transparent: true, opacity: 0.95, depthWrite: false });
    const pts = new THREE.Points(pg, pMat);
    g.add(pts);

    const lg = new THREE.BufferGeometry();
    lg.setAttribute("position", new THREE.BufferAttribute(linePos, 3));
    const lMat = new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 0.22, depthWrite: false });
    g.add(new THREE.LineSegments(lg, lMat));

    const label = document.createElement("button");
    label.className = "kw-label";
    label.textContent = c.name;
    label.style.borderColor = "rgba(148,170,205,.24)";
    label.addEventListener("click", () => window.selectCluster && window.selectCluster(i));
    stage.appendChild(label);

    clusters.push({ g, hub, glow, pMat, lMat, label, center, spin: (Math.random() * 0.5 + 0.25) * (i % 2 ? 1 : -1), scale: 1 });
  });

  // links between hubs (internal linking between clusters)
  {
    const arr = [];
    for (let i = 0; i < clusters.length; i++) {
      const a = clusters[i].center, b = clusters[(i + 1) % clusters.length].center, c2 = clusters[(i + 2) % clusters.length].center;
      arr.push(a.x, a.y, a.z, b.x, b.y, b.z, a.x, a.y, a.z, c2.x, c2.y, c2.z);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(arr, 3));
    root.add(new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0x5b6d8c, transparent: true, opacity: 0.18 })));
  }

  // core node = your site
  {
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 1), new THREE.MeshBasicMaterial({ color: 0xeef3fb, wireframe: true, transparent: true, opacity: 0.55 }));
    root.add(core);
    const arr = [];
    clusters.forEach(c => arr.push(0, 0, 0, c.center.x, c.center.y, c.center.z));
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(arr, 3));
    root.add(new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0x22c39a, transparent: true, opacity: 0.25 })));
    clusters.core = core;
  }

  // selection
  let selected = 0;
  const applySelection = () => {
    clusters.forEach((c, i) => {
      const on = i === selected;
      c.pMat.opacity = on ? 1 : 0.35;
      c.lMat.opacity = on ? 0.5 : 0.1;
      c.glow.material.opacity = on ? 0.85 : 0.3;
      c.label.classList.toggle("active", on);
    });
  };
  document.addEventListener("kw:select", e => { selected = e.detail; applySelection(); });
  applySelection();

  // interaction: drag to rotate, click hub to select
  let rotY = 0.35, rotX = 0.5, velY = 0, dragging = false, moved = 0, lx = 0, ly = 0;
  const el = renderer.domElement;
  el.addEventListener("pointerdown", e => { dragging = true; moved = 0; lx = e.clientX; ly = e.clientY; el.setPointerCapture(e.pointerId); });
  el.addEventListener("pointermove", e => {
    if (!dragging) { hover(e); return; }
    const dx = e.clientX - lx, dy = e.clientY - ly;
    moved += Math.abs(dx) + Math.abs(dy);
    lx = e.clientX; ly = e.clientY;
    velY = dx * 0.005;
    rotY += velY;
    rotX = Math.max(-0.2, Math.min(0.9, rotX + dy * 0.004));
  });
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const pick = e => {
    const r = el.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(hubs, false)[0];
    return hit ? hit.object.userData.index : -1;
  };
  const hover = e => { el.style.cursor = pick(e) >= 0 ? "pointer" : "grab"; };
  el.addEventListener("pointerup", e => {
    dragging = false;
    if (moved < 6) { const i = pick(e); if (i >= 0 && window.selectCluster) window.selectCluster(i); }
  });

  // sizing
  const resize = () => {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.z = w < 520 ? 18.5 : 14;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(stage);
  resize();

  // render loop, only while visible
  let visible = false;
  new IntersectionObserver(e => { visible = e[0].isIntersecting; }, { threshold: 0.01 }).observe(stage);
  const v = new THREE.Vector3();
  const clock = new THREE.Clock();
  const tick = () => {
    requestAnimationFrame(tick);
    if (!visible) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    if (!dragging) {
      velY *= 0.94;
      rotY += velY + (reduce ? 0 : dt * 0.12);
    }
    root.rotation.y = rotY;
    root.rotation.x = rotX;
    if (clusters.core) clusters.core.rotation.y -= dt * 0.4;

    const w = stage.clientWidth, h = stage.clientHeight;
    clusters.forEach((c, i) => {
      if (!reduce) c.g.rotation.y += dt * c.spin;
      const target = i === selected ? 1.35 : 1;
      c.scale += (target - c.scale) * 0.1;
      c.hub.scale.setScalar(c.scale + (i === selected && !reduce ? Math.sin(t * 3) * 0.05 : 0));
      c.hub.getWorldPosition(v);
      const depth = v.z;
      v.project(camera);
      const x = (v.x * 0.5 + 0.5) * w, y = (-v.y * 0.5 + 0.5) * h;
      c.label.style.transform = `translate(${x}px, ${y}px) translate(-50%, -170%)`;
      c.label.style.opacity = depth < -3 ? 0.45 : 1;
      c.label.style.zIndex = depth < 0 ? 1 : 3;
    });
    renderer.render(scene, camera);
  };
  tick();
}
