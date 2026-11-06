// The paper plane: a little 3D plane that flies in once you scroll past the
// hero, hangs about on the right, leans towards the cursor, and when you tap it
// it launches off across the page and opens a new email to me.

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  Group,
  BufferGeometry,
  Float32BufferAttribute,
  MeshStandardMaterial,
  MeshBasicMaterial,
  LineBasicMaterial,
  Mesh,
  LineSegments,
  EdgesGeometry,
  Shape,
  ShapeGeometry,
  AmbientLight,
  DirectionalLight,
  HemisphereLight,
  DoubleSide,
  SRGBColorSpace,
  Vector3,
} from 'three';

gsap.registerPlugin(ScrollTrigger);

export const EMAIL = 'pysharma0612@gmail.com';
const SUBJECT = 'Hi Shakshi!';

const BLUE = 0x2152e3;
const FOLD = 0x173fb8;

/* ---------- the model: folded from flat triangles, like real paper ---------- */
// Nose points down -x. Units are roughly "plane lengths".
function buildPlane() {
  const N = [-1.25, 0.02, 0]; // nose
  const T = [0.95, 0.06, 0]; // tail, top of the centre fold
  const K = [0.95, -0.46, 0]; // tail, bottom of the keel
  const WL = [0.95, 0.13, -0.27]; // the wing fold, left
  const WR = [0.95, 0.13, 0.27];
  const LL = [1.02, 0.44, -0.86]; // wing tips, folded up into a V
  const LR = [1.02, 0.44, 0.86];
  const KL = [0.95, -0.42, -0.06]; // keel halves, just apart
  const KR = [0.95, -0.42, 0.06];

  const tris = [
    // wings: inner panel and outer panel each side, so the fold catches light
    [N, T, WL], [N, WL, LL],
    [N, WR, T], [N, LR, WR],
    // the keel hanging under the centre fold
    [N, KL, T], [N, T, KR],
    [N, K, KL], [N, KR, K],
  ];
  const pos = [];
  tris.forEach((t) => t.forEach((v) => pos.push(...v)));
  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute(pos, 3));
  geo.computeVertexNormals();

  const paper = new MeshStandardMaterial({
    color: BLUE,
    roughness: 0.72,
    metalness: 0,
    side: DoubleSide,
    flatShading: true,
  });
  const body = new Mesh(geo, paper);
  const folds = new LineSegments(
    new EdgesGeometry(geo, 1),
    new LineBasicMaterial({ color: 0x9db4ff, transparent: true, opacity: 0.5 }),
  );

  // a small paper heart stuck on the near wing, like the seal on a letter
  const h = new Shape();
  h.moveTo(0, -0.5);
  h.bezierCurveTo(-0.15, -0.3, -0.62, -0.05, -0.5, 0.25);
  h.bezierCurveTo(-0.4, 0.52, -0.08, 0.5, 0, 0.25);
  h.bezierCurveTo(0.08, 0.5, 0.4, 0.52, 0.5, 0.25);
  h.bezierCurveTo(0.62, -0.05, 0.15, -0.3, 0, -0.5);
  const heart = new Mesh(
    new ShapeGeometry(h, 12),
    new MeshBasicMaterial({ color: 0xf6f1e4, side: DoubleSide }),
  );
  heart.scale.setScalar(0.21);
  // lie it flat on the near wing's outer panel, its point towards the nose
  const a = new Vector3(...N);
  const b = new Vector3(...LR);
  const w = new Vector3(...WR);
  const normal = new Vector3().subVectors(w, a).cross(new Vector3().subVectors(b, a)).normalize();
  if (normal.y < 0) normal.negate();
  heart.position.copy(a.multiplyScalar(0.3).add(b.multiplyScalar(0.35)).add(w.multiplyScalar(0.35))).addScaledVector(normal, 0.012);
  heart.quaternion.setFromUnitVectors(new Vector3(0, 0, 1), normal);
  heart.rotateZ(Math.PI / 2 + 0.3);

  const plane = new Group();
  plane.add(body, folds, heart);
  return plane;
}

/* ---------- a flat fallback if WebGL is not available ---------- */
const FLAT_PLANE = `<svg class="plane__flat" viewBox="0 0 120 90" aria-hidden="true">
  <path d="M8 46 112 14 70 80 56 56Z" fill="#2152e3"/>
  <path d="M8 46 56 56 112 14Z" fill="#3b6af0"/>
  <path d="M56 56 62 74 70 80" fill="#173fb8"/>
</svg>`;

export function initPlane({ reduce = false } = {}) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'plane';
  btn.setAttribute('aria-label', `Email Shakshi at ${EMAIL}`);
  btn.dataset.cursor = 'send me a note ✈';
  btn.dataset.visible = 'false';
  btn.inert = true;

  const toast = document.createElement('p');
  toast.className = 'plane-toast';
  toast.setAttribute('role', 'status');

  // the dotted line it leaves behind when it launches
  const trail = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  trail.setAttribute('class', 'plane-trail');
  trail.setAttribute('aria-hidden', 'true');
  trail.innerHTML = '<path/>';

  document.body.append(trail, btn, toast);

  /* ----- three.js scene ----- */
  let renderer = null;
  let scene;
  let camera;
  let plane;
  try {
    renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.domElement.setAttribute('aria-hidden', 'true');
    btn.appendChild(renderer.domElement);

    scene = new Scene();
    camera = new PerspectiveCamera(28, 1, 0.1, 50);
    camera.position.set(0, 2.7, 5.5);
    camera.lookAt(0, 0, 0);

    // a warm key light from the top left, cool fill, and a rim from behind
    scene.add(new HemisphereLight(0xfff4e0, 0x1b2a66, 0.7));
    scene.add(new AmbientLight(0xffffff, 0.12));
    const sun = new DirectionalLight(0xfff6ea, 2.8);
    sun.position.set(2.5, 4, 5);
    scene.add(sun);
    const rim = new DirectionalLight(0xbcd0ff, 0.9);
    rim.position.set(3, 1, -4);
    scene.add(rim);

    plane = buildPlane();
    scene.add(plane);
  } catch {
    renderer = null;
    btn.insertAdjacentHTML('beforeend', FLAT_PLANE);
  }

  const size = () => {
    const r = btn.getBoundingClientRect();
    if (!renderer || !r.width) return;
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    camera.updateProjectionMatrix();
  };
  size();
  new ResizeObserver(size).observe(btn);

  /* ----- state everything animates ----- */
  // pose: what the plane is doing in 3D. fly: where the button sits on screen.
  const pose = { yaw: 0, pitch: 0, roll: 0, scale: 1 };
  const look = { x: 0, y: 0 }; // where the cursor is, -1..1 around the plane
  const lean = { yaw: 0, pitch: 0 }; // smoothed towards look
  const fly = { x: 0, y: 0, s: 1, o: 1 };
  const magnet = { x: 0, y: 0 };
  let tilt = 0; // from scroll speed
  let visible = false;
  let busy = false; // launching
  let hover = false;

  const place = () => {
    btn.style.transform = `translate3d(${(fly.x + magnet.x).toFixed(1)}px, ${(fly.y + magnet.y).toFixed(1)}px, 0) scale(${fly.s.toFixed(3)})`;
    btn.style.opacity = fly.o.toFixed(3);
  };

  // resting pose: nose towards the page (left), turned a little to us
  const base = { yaw: 0.8, pitch: 0.2, roll: 0.1 };
  if (import.meta.env.DEV) window.__plane = { base, camera, render: () => renderer?.render(scene, camera) };

  let t0 = performance.now();
  let raf = 0;
  const frame = (now) => {
    raf = requestAnimationFrame(frame);
    const t = (now - t0) / 1000;
    const k = 0.09;
    lean.yaw += (look.x - lean.yaw) * k;
    lean.pitch += (look.y - lean.pitch) * k;
    tilt *= 0.92;

    if (renderer) {
      const bob = reduce ? 0 : Math.sin(t * 1.6) * 0.07;
      const sway = reduce ? 0 : Math.sin(t * 1.1 + 1) * 0.07;
      plane.position.y = bob;
      plane.rotation.order = 'YZX';
      // it turns its nose towards the cursor, but only so far
      plane.rotation.y = base.yaw + pose.yaw - lean.yaw * 0.4;
      plane.rotation.z = base.pitch + pose.pitch - lean.pitch * 0.3 + tilt;
      plane.rotation.x = base.roll + pose.roll + sway - lean.yaw * 0.2;
      plane.scale.setScalar(pose.scale * (hover ? 1.08 : 1));
      renderer.render(scene, camera);
    }
    place();
  };
  const run = () => {
    if (!raf) {
      t0 = performance.now() - 1000;
      raf = requestAnimationFrame(frame);
    }
  };
  const stop = () => {
    cancelAnimationFrame(raf);
    raf = 0;
  };
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : visible && run()));

  /* ----- the cursor: it watches you, and comes a little closer when you're near ----- */
  const centre = () => {
    const r = btn.getBoundingClientRect();
    return [r.left + r.width / 2 - magnet.x, r.top + r.height / 2 - magnet.y];
  };
  const toMagnet = {
    x: gsap.quickTo(magnet, 'x', { duration: 0.6, ease: 'power3.out' }),
    y: gsap.quickTo(magnet, 'y', { duration: 0.6, ease: 'power3.out' }),
  };
  window.addEventListener(
    'pointermove',
    (e) => {
      if (!visible || busy) return;
      const [cx, cy] = centre();
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      look.x = gsap.utils.clamp(-1, 1, dx / (window.innerWidth * 0.5));
      look.y = gsap.utils.clamp(-1, 1, dy / (window.innerHeight * 0.5));
      const d = Math.hypot(dx, dy);
      const reach = 220;
      if (d < reach && !reduce) {
        const pull = (1 - d / reach) * 0.3;
        toMagnet.x(dx * pull);
        toMagnet.y(dy * pull);
      } else {
        toMagnet.x(0);
        toMagnet.y(0);
      }
    },
    { passive: true },
  );
  btn.addEventListener('pointerenter', () => (hover = true));
  btn.addEventListener('pointerleave', () => {
    hover = false;
    gsap.to(pose, { scale: 1, duration: 0.3 });
  });
  btn.addEventListener('pointerdown', () => !busy && gsap.to(pose, { scale: 0.88, duration: 0.15 }));

  /* ----- scrolling banks it: nose dips as you scroll down, lifts as you go up ----- */
  if (!reduce) {
    ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: (s) => {
        tilt = gsap.utils.clamp(-0.5, 0.5, tilt + s.getVelocity() / -9000);
      },
    });
  }

  /* ----- in and out ----- */
  let tl = null;
  function show() {
    if (visible) return;
    visible = true;
    btn.dataset.visible = 'true';
    btn.inert = false;
    run();
    tl?.kill();
    if (reduce) {
      tl = gsap.fromTo(fly, { x: 0, y: 0, s: 1, o: 0 }, { o: 1, duration: 0.4 });
      return;
    }
    // swoops up from the bottom corner with a barrel roll, then settles
    tl = gsap
      .timeline()
      .fromTo(fly, { x: 220, y: 320, s: 0.6, o: 1 }, { x: 0, y: 0, s: 1, duration: 1.15, ease: 'power3.out' }, 0)
      .fromTo(pose, { roll: -Math.PI * 2, pitch: 0.5, yaw: 0.4 }, { roll: 0, pitch: 0, yaw: 0, duration: 1.3, ease: 'power3.out' }, 0);
  }
  function hide() {
    if (!visible) return;
    visible = false;
    btn.dataset.visible = 'false';
    btn.inert = true;
    tl?.kill();
    const done = () => !visible && stop();
    if (reduce) {
      tl = gsap.to(fly, { o: 0, duration: 0.3, onComplete: done });
      return;
    }
    // climbs away off the top right
    tl = gsap
      .timeline({ onComplete: done })
      .to(fly, { x: 260, y: -420, s: 0.7, duration: 0.8, ease: 'power2.in' }, 0)
      .to(pose, { pitch: -0.6, roll: 0.8, duration: 0.8, ease: 'power2.in' }, 0);
  }
  fly.o = 0;
  place();

  // visible once the hero is mostly scrolled past, until the footer (when there is one)
  const stopAt = () => document.querySelector('[data-plane-stop]');
  const check = () => {
    const hero = document.getElementById('hero');
    const past = hero ? hero.getBoundingClientRect().bottom < window.innerHeight * 0.45 : window.scrollY > 200;
    const foot = stopAt();
    const atFoot = foot ? foot.getBoundingClientRect().top < window.innerHeight * 0.8 : false;
    if (past && !atFoot) show();
    else if (!busy) hide();
  };
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: check, onRefresh: check });
  window.addEventListener('resize', check);

  /* ----- tap: launch it, and open a new email ----- */
  let toastTimer = 0;
  function say(text) {
    toast.textContent = text;
    toast.dataset.show = 'true';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toast.dataset.show = 'false'), 3400);
  }

  function openMail() {
    const href = `mailto:${EMAIL}?subject=${encodeURIComponent(SUBJECT)}`;
    // also put the address on the clipboard, for people with no mail app set up
    navigator.clipboard?.writeText(EMAIL).then(
      () => say(`opening your mail… (${EMAIL} is copied too)`),
      () => say(`opening your mail… or write to ${EMAIL}`),
    );
    window.location.href = href;
  }

  function launchTrail(from) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    trail.setAttribute('viewBox', `0 0 ${w} ${h}`);
    const [x0, y0] = from;
    const x1 = w * 0.18;
    const y1 = -60;
    const d = `M${x0} ${y0} C${x0 - 160} ${y0 + 120} ${x0 - w * 0.3} ${y0 + 40} ${(x0 + x1) / 2} ${h * 0.25} S${x1 + 80} ${y1 + 80} ${x1} ${y1}`;
    const path = trail.querySelector('path');
    path.setAttribute('d', d);
    return path;
  }

  btn.addEventListener('click', () => {
    if (busy || !visible) return;
    if (reduce) {
      openMail();
      return;
    }
    busy = true;
    hover = false;
    tl?.kill();
    toMagnet.x(0);
    toMagnet.y(0);
    const [cx, cy] = centre();
    const path = launchTrail([cx, cy]);
    const len = path.getTotalLength();
    const at = { p: 0 };

    // pull back, then throw: it follows the dotted line off the top of the screen
    tl = gsap
      .timeline({
        onComplete: () => {
          busy = false;
          visible = false;
          check();
        },
      })
      .to(pose, { scale: 0.85, pitch: -0.35, yaw: 0.25, duration: 0.22, ease: 'power2.out' })
      .to(fly, { x: 18, y: 8, duration: 0.22, ease: 'power2.out' }, 0)
      .set(trail, { opacity: 1 })
      .to(
        at,
        {
          p: 1,
          duration: 1.05,
          ease: 'power2.in',
          onUpdate: () => {
            const pt = path.getPointAtLength(at.p * len);
            fly.x = pt.x - cx;
            fly.y = pt.y - cy;
            fly.s = 1 - at.p * 0.45;
          },
        },
        0.22,
      )
      .fromTo(path, { drawSVG: '0% 0%' }, { drawSVG: '0% 100%', duration: 1.05, ease: 'power2.in' }, 0.22)
      .to(pose, { scale: 1, yaw: -0.9, pitch: 0.55, roll: Math.PI * 2, duration: 1.05, ease: 'power2.in' }, 0.22)
      .call(openMail, null, 0.75)
      .to(path, { drawSVG: '100% 100%', duration: 0.6, ease: 'power1.inOut' }, 1.15)
      .set(trail, { opacity: 0 })
      .set(fly, { o: 0 })
      .set(pose, { roll: 0, yaw: 0, pitch: 0 })
      // a beat later it comes back for the next person
      .to({}, { duration: 0.9 });
  });

  return { show, hide };
}
