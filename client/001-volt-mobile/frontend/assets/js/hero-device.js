/* ==========================================================================
   VOLT MOBILE — Hero Device Scene (Three.js)
   Client #1 special interaction — CLIENT-SPECIFIC (stays in this branch).
   Renders the flagship device with rotating spec callouts + particle field.
   ========================================================================== */
import * as THREE from "../vendor/three/three.module.min.js";

(function () {
  var canvas = document.getElementById("vm-hero-device");
  if (!canvas) return;

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Renderer ---------- */
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  /* ---------- Scene ---------- */
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(38, 1, 0.1, 60);
  camera.position.set(0, 0, 9.2);

  var device = new THREE.Group();
  scene.add(device);

  /* ---------- Helpers ---------- */
  function roundedRectShape(w, h, r) {
    var s = new THREE.Shape();
    s.moveTo(-w / 2 + r, -h / 2);
    s.lineTo(w / 2 - r, -h / 2);
    s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    s.lineTo(w / 2, h / 2 - r);
    s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    s.lineTo(-w / 2 + r, h / 2);
    s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
    s.lineTo(-w / 2, -h / 2 + r);
    s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
    return s;
  }

  function extrudeRounded(w, h, r, depth, material) {
    var geo = new THREE.ExtrudeGeometry(roundedRectShape(w, h, r), {
      depth: depth, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 3, curveSegments: 24
    });
    geo.translate(0, 0, -depth / 2);
    var mesh = new THREE.Mesh(geo, material);
    return mesh;
  }

  /* ---------- Phone body ---------- */
  var bodyMat = new THREE.MeshStandardMaterial({
    color: 0x1a1a22, metalness: 0.85, roughness: 0.32
  });
  var body = extrudeRounded(3.1, 6.35, 0.55, 0.22, bodyMat);
  device.add(body);

  /* frame edge light */
  var edgeMat = new THREE.MeshStandardMaterial({ color: 0x2c2c36, metalness: 0.95, roughness: 0.25 });
  var frame = extrudeRounded(3.18, 6.43, 0.62, 0.06, edgeMat);
  frame.position.z = -0.02;
  device.add(frame);

  /* ---------- Screen ---------- */
  var screenCanvas = document.createElement("canvas");
  screenCanvas.width = 640;
  screenCanvas.height = 1240;
  var ctx = screenCanvas.getContext("2d");

  var grad = ctx.createLinearGradient(0, 0, 640, 1240);
  grad.addColorStop(0, "#0a2a33");
  grad.addColorStop(0.45, "#08202a");
  grad.addColorStop(1, "#070a14");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 640, 1240);

  ctx.fillStyle = "rgba(34, 211, 238, 0.16)";
  ctx.beginPath();
  ctx.arc(320, 420, 210, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(103, 232, 249, 0.28)";
  ctx.beginPath();
  ctx.arc(320, 420, 120, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(103, 232, 249, 0.85)";
  ctx.lineWidth = 5;
  ctx.font = "600 42px 'Segoe UI', system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "#eafcff";
  ctx.fillText("VOLT", 320, 640);
  ctx.font = "600 26px 'Segoe UI', system-ui, sans-serif";
  ctx.fillStyle = "rgba(234, 252, 255, 0.72)";
  ctx.fillText("X1 Pro", 320, 692);

  var screenTex = new THREE.CanvasTexture(screenCanvas);
  screenTex.colorSpace = THREE.SRGBColorSpace;
  var screenMat = new THREE.MeshBasicMaterial({ map: screenTex });
  var screenGeo = new THREE.PlaneGeometry(2.92, 6.02);
  var screen = new THREE.Mesh(screenGeo, screenMat);
  screen.position.z = 0.13;
  device.add(screen);

  /* screen glass shine */
  var shineMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, transparent: true, opacity: 0.05, metalness: 1, roughness: 0.1
  });
  var shine = new THREE.Mesh(screenGeo.clone(), shineMat);
  shine.position.z = 0.135;
  device.add(shine);

  /* camera island */
  var camMat = new THREE.MeshStandardMaterial({ color: 0x0d0d12, metalness: 0.9, roughness: 0.3 });
  var camIsland = extrudeRounded(1.1, 1.5, 0.35, 0.12, camMat);
  camIsland.position.set(-0.85, 2.25, 0.12);
  device.add(camIsland);

  var lensMat = new THREE.MeshStandardMaterial({ color: 0x10343d, metalness: 0.95, roughness: 0.15, emissive: 0x22d3ee, emissiveIntensity: 0.22 });
  [0, 0.38, -0.38].forEach(function (dx) {
    var lens = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.1, 32), lensMat);
    lens.rotation.x = Math.PI / 2;
    lens.position.set(dx, 0, 0.08);
    camIsland.add(lens);
  });

  /* side buttons */
  var btnMat = new THREE.MeshStandardMaterial({ color: 0x23232b, metalness: 0.9, roughness: 0.4 });
  [
    { y: 1.4, z: 0.16, len: 0.7 },
    { y: 0.7, z: 0.16, len: 0.7 },
    { y: -1.5, z: 0.16, len: 1.1 }
  ].forEach(function (b) {
    var btn = new THREE.Mesh(new THREE.BoxGeometry(0.05, b.len, 0.09), btnMat);
    btn.position.set(1.62, b.y, b.z);
    device.add(btn);
  });

  /* ---------- Lights ---------- */
  scene.add(new THREE.AmbientLight(0x8899aa, 0.55));
  var key = new THREE.DirectionalLight(0xeafcff, 1.6);
  key.position.set(3, 5, 6);
  scene.add(key);
  var rim = new THREE.DirectionalLight(0x22d3ee, 2.2);
  rim.position.set(-5, -2, -4);
  scene.add(rim);
  var fill = new THREE.PointLight(0x22d3ee, 6, 20);
  fill.position.set(0, -3, 4);
  scene.add(fill);

  /* ---------- Particles ---------- */
  var pCount = 260;
  var pos = new Float32Array(pCount * 3);
  for (var i = 0; i < pCount; i++) {
    var r = 5.5 + Math.random() * 6;
    var theta = Math.random() * Math.PI * 2;
    var phi = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.7;
    pos[i * 3 + 2] = r * Math.cos(phi) * 0.6;
  }
  var pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  var pMat = new THREE.PointsMaterial({
    color: 0x67e8f9, size: 0.045, transparent: true, opacity: 0.7, sizeAttenuation: true
  });
  var particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  /* floor glow ring */
  var ringMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.16, side: THREE.DoubleSide });
  var ring = new THREE.Mesh(new THREE.RingGeometry(2.6, 3.0, 64), ringMat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = -3.6;
  scene.add(ring);

  /* ---------- Sizing ---------- */
  var parent = canvas.parentElement;
  function resize() {
    var w = parent.clientWidth;
    var h = parent.clientHeight || Math.min(w * 1.12, 520);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);

  /* ---------- Pointer parallax ---------- */
  var tx = 0, ty = 0, cx = 0, cy = 0;
  parent.addEventListener("pointermove", function (e) {
    var rect = parent.getBoundingClientRect();
    tx = ((e.clientX - rect.left) / rect.width - 0.5) * 0.55;
    ty = ((e.clientY - rect.top) / rect.height - 0.5) * 0.35;
  });

  /* ---------- Orbit callouts (DOM, synced to device) ---------- */
  var callouts = Array.prototype.slice.call(document.querySelectorAll(".vm-spec-orbit"));

  /* ---------- Animation loop ---------- */
  var clock = new THREE.Clock();
  function tick() {
    var t = clock.getElapsedTime();
    if (!reduced) {
      cx += (tx - cx) * 0.05;
      cy += (ty - cy) * 0.05;
      device.rotation.y = 0.42 + Math.sin(t * 0.34) * 0.1 + cx;
      device.rotation.x = -0.05 + Math.sin(t * 0.22) * 0.03 + cy;
      device.position.y = Math.sin(t * 0.8) * 0.12;
      particles.rotation.y = t * 0.02;
      ring.material.opacity = 0.1 + Math.sin(t * 1.2) * 0.06;
      ring.rotation.z = t * 0.05;
    } else {
      device.rotation.y = 0.4;
    }
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  tick();

  /* ---------- Graceful fallback ---------- */
  window.addEventListener("error", function (e) {
    if (e.target === canvas && canvas.parentElement) {
      canvas.parentElement.style.display = "none";
      callouts.forEach(function (c) { c.style.display = "none"; });
    }
  }, true);
})();