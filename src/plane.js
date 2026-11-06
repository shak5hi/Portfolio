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
  MeshPhysicalMaterial,
  Mesh,
  Shape,
  ExtrudeGeometry,
  DirectionalLight,
  HemisphereLight,
  PMREMGenerator,
  SRGBColorSpace,
  NeutralToneMapping,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

gsap.registerPlugin(ScrollTrigger);

export const EMAIL = 'shaksshisharma@gmail.com';
const SUBJECT = 'Hi Shakshi!';

const BLUE = 0x1e4ad9; // a touch deeper than the logo blue, so it reads the same once lit

/* ---------- the model: a chunky, glossy toy paper plane ---------- */
// Nose points down -x, span along z, y is up. Each panel is a rounded triangle
// with some thickness and soft bevelled edges, folded into place like paper.

// a triangle with its corners rounded off
function roundedTri(pts, r) {
  const s = new Shape();
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const a = pts[(i - 1 + n) % n];
    const b = pts[(i + 1) % n];
    const da = Math.hypot(a[0] - p[0], a[1] - p[1]);
    const db = Math.hypot(b[0] - p[0], b[1] - p[1]);
    const ra = Math.min(r, da / 3);
    const rb = Math.min(r, db / 3);
    const p1 = [p[0] + ((a[0] - p[0]) / da) * ra, p[1] + ((a[1] - p[1]) / da) * ra];
    const p2 = [p[0] + ((b[0] - p[0]) / db) * rb, p[1] + ((b[1] - p[1]) / db) * rb];
    if (i === 0) s.moveTo(...p1);
    else s.lineTo(...p1);
    s.quadraticCurveTo(p[0], p[1], ...p2);
  }
  s.closePath();
  return s;
}

function panel(pts, mat, { depth = 0.05, bevel = 0.035, r = 0.1 } = {}) {
  const geo = new ExtrudeGeometry(roundedTri(pts, r), {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 4,
    curveSegments: 8,
  });
  geo.translate(0, 0, -depth / 2); // centre the thickness on the fold
  return new Mesh(geo, mat);
}

function buildPlane() {
  const paper = new MeshPhysicalMaterial({
    color: BLUE,
    roughness: 0.32,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.12,
    envMapIntensity: 0.3,
  });
  const under = paper.clone();
  under.color.set(0x1a44c4); // the folded-under keel sits a shade deeper

  const plane = new Group();

  // wings: long triangles from the nose back to the tail, each lying flat
  // (span along z), then tipped up so the plane has its V
  const wing = (side) => {
    const g = new Group();
    const m = panel(
      [
        [-1.3, 0],
        [0.95, 0],
        [1.05, 0.88],
      ],
      paper,
    );
    m.rotation.x = side > 0 ? Math.PI / 2 : -Math.PI / 2;
    g.add(m);
    g.rotation.x = -side * 0.3; // dihedral
    g.position.y = 0.02;
    return g;
  };
  const right = wing(1);
  const left = wing(-1);

  // the keel: the folded-down body that hangs under the centre crease
  const keel = new Group();
  [-1, 1].forEach((side) => {
    const k = panel(
      [
        [-1.25, 0],
        [0.95, 0],
        [0.95, -0.36],
      ],
      under,
      { depth: 0.03, bevel: 0.025, r: 0.07 },
    );
    k.rotation.x = side * 0.12;
    k.position.z = side * 0.03;
    keel.add(k);
  });

  // a puffy heart sticker on the near wing, like the seal on a letter
  const h = new Shape();
  h.moveTo(0, -0.5);
  h.bezierCurveTo(-0.15, -0.3, -0.62, -0.05, -0.5, 0.25);
  h.bezierCurveTo(-0.4, 0.52, -0.08, 0.5, 0, 0.25);
  h.bezierCurveTo(0.08, 0.5, 0.4, 0.52, 0.5, 0.25);
  h.bezierCurveTo(0.62, -0.05, 0.15, -0.3, 0, -0.5);
  const heart = new Mesh(
    new ExtrudeGeometry(h, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.1, bevelSegments: 5, curveSegments: 16 }),
    new MeshPhysicalMaterial({ color: 0xfaf4e6, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.1, envMapIntensity: 0.5 }),
  );
  heart.scale.setScalar(0.2);
  // sit it on the right wing's top face (wing local: x along, y across the span)
  // the wing's top face is its local -z once folded, so the heart sits there
  heart.position.set(0.3, 0.4, -0.065);
  heart.rotation.set(0, Math.PI, -(Math.PI / 2 + 0.25)); // facing up, point to the nose
  right.children[0].add(heart);

  plane.add(left, right, keel);
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
    renderer.toneMapping = NeutralToneMapping;
    renderer.toneMappingExposure = 0.88;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.domElement.setAttribute('aria-hidden', 'true');
    btn.appendChild(renderer.domElement);

    scene = new Scene();
    camera = new PerspectiveCamera(28, 1, 0.1, 50);
    camera.position.set(0, 2.2, 5.4);
    camera.lookAt(0, 0, 0);

    // a soft studio room to reflect in (that's the gloss), plus a warm key light
    const pmrem = new PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    scene.add(new HemisphereLight(0xfff4e0, 0x22337a, 0.5));
    const sun = new DirectionalLight(0xfff6ea, 1.6);
    sun.position.set(-2, 5, 4);
    scene.add(sun);

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
  let hoverAmt = 0;

  const drift = { x: 0, y: 0 }; // the idle figure-eight it floats in
  const place = () => {
    const x = fly.x + magnet.x + drift.x;
    const y = fly.y + magnet.y + drift.y;
    btn.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${fly.s.toFixed(3)})`;
    btn.style.opacity = fly.o.toFixed(3);
  };

  // resting pose: nose towards the page (left), turned a little to us
  const base = { yaw: 0.25, pitch: 0.3, roll: 0.55 };
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

    // idle: float round a lazy figure-eight, banking into each turn
    const still = reduce || busy;
    const dx = still ? 0 : Math.sin(t * 0.8) * 14;
    const dy = still ? 0 : Math.sin(t * 1.6) * 10;
    drift.x += (dx - drift.x) * 0.1;
    drift.y += (dy - drift.y) * 0.1;
    const bank = still ? 0 : Math.cos(t * 0.8) * 0.32; // leans the way it's heading
    const nod = still ? 0 : Math.cos(t * 1.6) * 0.12;
    hoverAmt += ((hover ? 1 : 0) - hoverAmt) * 0.12;
    const wiggle = hoverAmt * Math.sin(t * 14) * 0.08;

    if (renderer) {
      plane.position.y = still ? 0 : Math.sin(t * 1.6) * 0.06;
      plane.rotation.order = 'YZX';
      // it turns its nose towards the cursor, but only so far
      plane.rotation.y = base.yaw + pose.yaw - lean.yaw * 0.45 + wiggle;
      plane.rotation.z = base.pitch + pose.pitch - lean.pitch * 0.35 + tilt + nod;
      plane.rotation.x = base.roll + pose.roll + bank - lean.yaw * 0.25 + wiggle;
      plane.scale.setScalar(pose.scale * (1 + hoverAmt * 0.1));
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

  /* ----- every few seconds, a little trick: a barrel roll, or a swoop ----- */
  let trick = 0;
  let trickN = 0;
  const tricks = () => {
    clearTimeout(trick);
    trick = setTimeout(() => {
      if (visible && !busy && !hover && !reduce && !document.hidden) {
        const tl2 = gsap.timeline();
        if (trickN++ % 2 === 0) {
          tl2.to(pose, { roll: '+=' + Math.PI * 2, duration: 1.1, ease: 'power2.inOut' })
            .to(fly, { y: -26, duration: 0.55, ease: 'sine.out', yoyo: true, repeat: 1 }, 0)
            .set(pose, { roll: 0 });
        } else {
          tl2.to(pose, { pitch: 0.55, duration: 0.35, ease: 'sine.out' })
            .to(fly, { y: -38, x: -14, duration: 0.45, ease: 'power2.out' }, 0)
            .to(pose, { pitch: -0.3, duration: 0.5, ease: 'sine.inOut' })
            .to(fly, { y: 0, x: 0, duration: 0.7, ease: 'back.out(2)' }, 0.45)
            .to(pose, { pitch: 0, duration: 0.5, ease: 'sine.out' });
        }
      }
      tricks();
    }, 5200 + Math.random() * 2600);
  };
  tricks();

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
