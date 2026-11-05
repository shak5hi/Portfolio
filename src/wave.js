// The wave: a canvas layer that rises from the bottom of the screen, rears
// up into a crest, crashes over the whole screen, throws droplets onto the
// "glass", then drains away to reveal the page while the droplets slide off.
// Everything is drawn in the same ink-and-wash style as the beach.

import { gsap } from 'gsap';

const INK = '#1d4b88';
const SEA = '#a9cbe3';
const SEA_DEEP = '#8bb8da';
const PAPER = '#f5f0da';

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function runWave(canvas, { onCrash, onCovered, onDone } = {}) {
  const ctx = canvas.getContext('2d');
  const rand = rng(42);
  let W = 0;
  let H = 0;
  let dpr = 1;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  // Animated state, tweened by GSAP and read every frame.
  const s = {
    level: -0.08, // 0 = bottom edge, 1 = top edge
    lip: 0, // height of the breaking crest, in px
    crest: 0.15, // crest position, 0..1 across the screen
    phase: 0,
    amp: 14,
    glass: 0, // opacity of droplets left on the screen
  };

  // Ripple marks that live inside the water, in water coordinates.
  const marks = Array.from({ length: 70 }, () => ({
    u: rand(),
    d: 40 + rand() * 1400,
    w: 14 + rand() * 18,
  }));

  const spray = []; // flying droplets
  const drops = []; // droplets stuck on the glass

  function surfaceY(x) {
    const base = H - s.level * H * 1.3;
    const cx = s.crest * W;
    const spread = W * 0.22;
    const bump = s.lip * Math.exp(-(((x - cx) / spread) ** 2));
    return (
      base +
      Math.sin(x * 0.0065 + s.phase) * s.amp +
      Math.sin(x * 0.017 - s.phase * 1.6) * s.amp * 0.35 -
      bump
    );
  }

  function inkLine(points, width) {
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length - 1; i++) {
      const mx = (points[i][0] + points[i + 1][0]) / 2;
      const my = (points[i][1] + points[i + 1][1]) / 2;
      ctx.quadraticCurveTo(points[i][0], points[i][1], mx, my);
    }
    ctx.lineWidth = width;
    ctx.strokeStyle = INK;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  function drawWater() {
    const step = 18;
    const pts = [];
    for (let x = -step; x <= W + step; x += step) pts.push([x, surfaceY(x)]);

    // body
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (const [x, y] of pts) ctx.lineTo(x, y);
    ctx.lineTo(W + step, H + 10);
    ctx.lineTo(-step, H + 10);
    ctx.closePath();
    ctx.fillStyle = SEA;
    ctx.fill();

    drawCurl('fill');

    // a deeper band a little below the surface, like a second wash of paint
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1] + 70);
    for (const [x, y] of pts) ctx.lineTo(x, y + 70 + Math.sin(x * 0.01 + s.phase * 0.7) * 10);
    ctx.lineTo(W + step, H + 10);
    ctx.lineTo(-step, H + 10);
    ctx.closePath();
    ctx.fillStyle = SEA_DEEP;
    ctx.fill();

    // ripple marks drawn in ink, carried by the water
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = INK;
    ctx.lineCap = 'round';
    for (const m of marks) {
      const x = m.u * W;
      const y = surfaceY(x) + m.d;
      if (y > H + 20 || y < -20) continue;
      const w = m.w;
      ctx.beginPath();
      ctx.moveTo(x - w, y);
      ctx.quadraticCurveTo(x - w / 2, y - 7, x, y);
      ctx.quadraticCurveTo(x + w / 2, y + 7, x + w, y);
      ctx.stroke();
    }

    // foam scallops along the crest
    const cx = s.crest * W;
    ctx.fillStyle = PAPER;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.4;
    for (let x = -10; x < W + 20; x += 26) {
      const near = Math.exp(-(((x - cx) / (W * 0.26)) ** 2));
      const r = 5 + near * Math.min(s.lip, 220) * 0.09;
      if (r < 6) continue;
      const y = surfaceY(x) + 4;
      ctx.beginPath();
      ctx.arc(x, y, r, Math.PI, 0);
      ctx.fill();
      ctx.stroke();
    }

    // the surface line itself, slightly thicker than the beach strokes
    inkLine(pts, 4);

    drawCurl('stroke');
  }

  // The breaking lip: the crest folds forward over itself into a hook,
  // with a spiral drawn inside the barrel, like a woodblock wave in ink.
  function drawCurl(mode) {
    const L = Math.min(s.lip, 300) * 0.85;
    if (L < 24) return;
    const px = s.crest * W;
    const py = surfaceY(px);
    const back = px - L * 0.9;

    const outline = () => {
      ctx.moveTo(back, surfaceY(back));
      ctx.bezierCurveTo(px - L * 0.45, py - L * 0.05, px - L * 0.2, py - L * 0.42, px + L * 0.25, py - L * 0.45);
      ctx.bezierCurveTo(px + L * 0.8, py - L * 0.45, px + L * 1.15, py - L * 0.05, px + L * 0.95, py + L * 0.38);
      ctx.bezierCurveTo(px + L * 0.82, py + L * 0.62, px + L * 0.45, py + L * 0.55, px + L * 0.5, py + L * 0.28);
      ctx.bezierCurveTo(px + L * 0.55, py + L * 0.05, px + L * 0.8, py + L * 0.12, px + L * 0.72, py + L * 0.3);
      ctx.bezierCurveTo(px + L * 0.6, py + L * 0.6, px + L * 0.3, py + L * 0.7, px + L * 0.1, py + L * 0.9);
    };
    // fill the lip down into the body of the water, but ink only its edge
    ctx.beginPath();
    outline();
    ctx.lineTo(px + L * 0.1, H + 20);
    ctx.lineTo(back, H + 20);
    ctx.closePath();
    if (mode === 'fill') {
      ctx.fillStyle = SEA;
      ctx.fill();
      return;
    }
    ctx.beginPath();
    outline();
    ctx.lineWidth = 4;
    ctx.strokeStyle = INK;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // inner wash and the spiral of the barrel
    ctx.beginPath();
    ctx.moveTo(px - L * 0.55, py + L * 0.05);
    ctx.bezierCurveTo(px - L * 0.2, py - L * 0.25, px + L * 0.45, py - L * 0.3, px + L * 0.75, py - L * 0.05);
    ctx.lineWidth = 2.6;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(px - L * 0.35, py + L * 0.3);
    ctx.bezierCurveTo(px - L * 0.05, py + L * 0.02, px + L * 0.3, py - L * 0.05, px + L * 0.5, py + L * 0.1);
    ctx.stroke();

    // foam fingers flicking off the tip
    ctx.fillStyle = PAPER;
    ctx.lineWidth = 2.4;
    for (let i = 0; i < 6; i++) {
      const a = -0.9 + i * 0.32 + Math.sin(s.phase * 2 + i) * 0.08;
      const fx = px + L * 0.25 + Math.cos(a) * L * 0.55;
      const fy = py - L * 0.12 + Math.sin(a) * L * 0.38;
      ctx.beginPath();
      ctx.arc(fx, fy, 4 + (i % 3) * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  function spawnSpray(n) {
    const cx = s.crest * W;
    for (let i = 0; i < n; i++) {
      const x = cx + (rand() - 0.5) * W * 0.5;
      spray.push({
        x,
        y: surfaceY(x) - 6,
        vx: (rand() - 0.35) * 6,
        vy: -6 - rand() * 12,
        r: 3 + rand() * 9,
        life: 1,
      });
    }
  }

  function drawDroplet(x, y, r, angle, stretch, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    // a teardrop: round head, pointed tail
    ctx.moveTo(0, -r * stretch);
    ctx.bezierCurveTo(r * 0.9, -r * 0.2, r, r * 0.9, 0, r);
    ctx.bezierCurveTo(-r, r * 0.9, -r * 0.9, -r * 0.2, 0, -r * stretch);
    ctx.fillStyle = SEA;
    ctx.fill();
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = INK;
    ctx.stroke();
    // a little highlight on the bigger drops
    if (r < 9) return ctx.restore();
    ctx.beginPath();
    ctx.arc(-r * 0.3, r * 0.2, r * 0.22, 0, Math.PI * 2);
    ctx.fillStyle = PAPER;
    ctx.fill();
    ctx.restore();
  }

  function splashGlass() {
    const n = Math.round(Math.min(55, (W * H) / 24000));
    for (let i = 0; i < n; i++) {
      const big = rand() < 0.1;
      drops.push({
        x: rand() * W,
        y: rand() * H,
        r: big ? 22 + rand() * 30 : 5 + rand() * 14,
        vy: 0,
        acc: 0.06 + rand() * 0.14,
        trail: [],
        delay: rand() * 0.35,
      });
    }
  }

  function step() {
    ctx.clearRect(0, 0, W, H);
    s.phase += 0.045;

    if (s.level > -0.1) drawWater();

    // flying spray
    for (let i = spray.length - 1; i >= 0; i--) {
      const p = spray[i];
      p.vy += 0.42;
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.012;
      if (p.life <= 0 || p.y > H + 40) {
        spray.splice(i, 1);
        continue;
      }
      drawDroplet(p.x, p.y, p.r, Math.atan2(p.vy, p.vx) - Math.PI / 2, 1.6, Math.min(1, p.life * 2));
    }

    // droplets on the glass, sliding down and leaving a short trail
    if (s.glass > 0.01) {
      for (const d of drops) {
        if (d.delay > 0) d.delay -= 1 / 60;
        else {
          d.vy = Math.min(d.vy + d.acc, 9);
          d.y += d.vy;
          d.trail.push(d.y);
          if (d.trail.length > 14) d.trail.shift();
        }
        if (d.trail.length > 1 && d.r < 40) {
          ctx.save();
          ctx.globalAlpha = s.glass * 0.6;
          ctx.strokeStyle = SEA_DEEP;
          ctx.lineWidth = d.r * 0.55;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(d.x, d.trail[0] - d.r);
          ctx.lineTo(d.x, d.y - d.r * 0.5);
          ctx.stroke();
          ctx.restore();
        }
        drawDroplet(d.x, d.y, d.r, 0, 1.25, s.glass);
      }
    }
  }

  gsap.ticker.add(step);

  // Choreography
  const tl = gsap.timeline({
    onComplete() {
      gsap.ticker.remove(step);
      window.removeEventListener('resize', resize);
      ctx.clearRect(0, 0, W, H);
      onDone?.();
    },
  });

  // 1. The sea gathers at the bottom and starts to swell.
  tl.to(s, { level: 0.22, amp: 22, duration: 0.9, ease: 'sine.inOut' })
    // 2. It rears up into a breaking crest that runs across the screen.
    .to(s, { level: 0.45, lip: 230, crest: 0.5, amp: 26, duration: 1, ease: 'power1.inOut' })
    .call(() => spawnSpray(26), null, '-=0.35')
    .call(() => spawnSpray(30), null, '-=0.1')
    // 3. Crash: the crest folds over and the water takes the whole screen.
    .to(s, { level: 1.15, lip: 120, crest: 0.85, duration: 0.5, ease: 'power3.in' })
    .call(() => {
      spawnSpray(40);
      splashGlass();
      s.glass = 1;
      onCrash?.();
    })
    .call(() => onCovered?.(), null, '+=0.12')
    // 4. A beat underwater, then it drains away and reveals the page.
    .to(s, { level: -0.2, lip: 0, amp: 16, duration: 1.25, ease: 'power2.inOut' }, '+=0.25')
    .to(s, { glass: 0, duration: 1.1, ease: 'power1.in' }, '-=0.6');


  return {
    skip() {
      tl.progress(1);
    },
  };
}
