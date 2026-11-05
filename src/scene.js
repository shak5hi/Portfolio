// The beach, drawn in ink. One seeded generator so the intro and the hero
// card show the exact same drawing. Every stroke carries a class so the
// intro can draw it in, and the hero card can keep it gently alive.

const W = 1600;
const H = 1000;
const HORIZON = 540;

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const f = (n) => Math.round(n * 10) / 10;

// A line through points, smoothed with quadratic midpoints and nudged by a
// little noise so it reads as drawn by hand rather than plotted.
function wobbly(points, r, jitter = 2) {
  const p = points.map(([x, y]) => [x + (r() - 0.5) * jitter, y + (r() - 0.5) * jitter]);
  let d = `M${f(p[0][0])} ${f(p[0][1])}`;
  for (let i = 1; i < p.length - 1; i++) {
    const mx = (p[i][0] + p[i + 1][0]) / 2;
    const my = (p[i][1] + p[i + 1][1]) / 2;
    d += ` Q${f(p[i][0])} ${f(p[i][1])} ${f(mx)} ${f(my)}`;
  }
  const last = p[p.length - 1];
  d += ` L${f(last[0])} ${f(last[1])}`;
  return d;
}

function horizonPath(r) {
  const pts = [];
  for (let x = -40; x <= W + 40; x += 22) {
    pts.push([x, HORIZON + Math.sin(x / 31) * 3 + (r() - 0.5) * 4]);
  }
  return wobbly(pts, r, 1.5);
}

// The shore: where wet sand meets the sea, sweeping up to the right.
function shoreY(x) {
  return 820 - (x / W) * 120 + Math.sin(x / 140) * 14;
}

function shorePoints(offset = 0) {
  const pts = [];
  for (let x = -40; x <= W + 40; x += 30) pts.push([x, shoreY(x) + offset]);
  return pts;
}

function bird(x, y, s, r) {
  const a = 10 * s;
  const lift = (6 + r() * 6) * s;
  return `<path class="ink bird" d="M${f(x - a * 2)} ${f(y + lift * 0.4)} Q${f(x - a)} ${f(y - lift)} ${f(x)} ${f(y)} Q${f(x + a)} ${f(y - lift * 1.1)} ${f(x + a * 2.1)} ${f(y + lift * 0.3)}"/>`;
}

function gull(x, y, s) {
  // A bigger, more detailed gull like the ones in the reference drawing.
  return `<g class="gull" transform="translate(${x} ${y}) scale(${s})">
    <path class="ink" d="M-34 6 C-24 -14 -10 -16 -2 2 C6 -18 22 -20 36 -4"/>
    <path class="ink" d="M-2 2 C0 8 4 10 8 8"/>
    <path class="ink" d="M-26 -2 l6 6 M-18 -6 l5 7 M16 -10 l-3 8 M25 -10 l-4 8"/>
  </g>`;
}

function fish(x, y, s, flip) {
  const k = flip ? -1 : 1;
  return `<g class="fish" transform="translate(${x} ${y}) scale(${k * s} ${s})">
    <path class="ink" d="M-26 0 C-14 -10 10 -10 22 0 C10 10 -14 10 -26 0 Z"/>
    <path class="ink" d="M22 0 L34 -8 L32 0 L34 8 Z"/>
    <path class="ink thin" d="M-16 -1 l1 1"/>
  </g>`;
}

function wavelet(x, y, s) {
  return `<path class="ink wavelet" d="M${f(x)} ${f(y)} q${f(8 * s)} ${f(-7 * s)} ${f(16 * s)} 0 t${f(16 * s)} 0"/>`;
}

function starfish(x, y, s) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? 22 : 9;
    pts.push(`${f(Math.cos(a) * rad)} ${f(Math.sin(a) * rad)}`);
  }
  return `<g class="prop" transform="translate(${x} ${y}) scale(${s}) rotate(14)">
    <path class="ink sun-fill" d="M${pts.join(' L')} Z"/>
  </g>`;
}

function shell(x, y, s) {
  return `<g class="prop" transform="translate(${x} ${y}) scale(${s})">
    <path class="ink" d="M-18 6 C-18 -14 18 -14 18 6 Z"/>
    <path class="ink thin" d="M0 6 L0 -10 M-8 6 L-5 -8 M8 6 L5 -8 M-14 6 L-12 -3 M14 6 L12 -3"/>
  </g>`;
}

function umbrella() {
  // Canopy as five panels; alternate panels are filled to read as stripes.
  const cx = 1110;
  const top = 610;
  const left = cx - 150;
  const right = cx + 150;
  const base = top + 70;
  const panels = [];
  const edge = [];
  for (let i = 0; i <= 5; i++) {
    const x = left + (i * (right - left)) / 5;
    edge.push([x, base + Math.sin((i / 5) * Math.PI) * 10]);
  }
  for (let i = 0; i < 5; i++) {
    const [x1, y1] = edge[i];
    const [x2, y2] = edge[i + 1];
    const mx = (x1 + x2) / 2;
    panels.push(
      `<path class="ink ${i % 2 === 0 ? 'stripe' : 'paper-fill'}" d="M${cx} ${top} L${f(x1)} ${f(y1)} Q${f(mx)} ${f(y1 - 18)} ${f(x2)} ${f(y2)} Z"/>`
    );
  }
  return `<g class="prop umbrella" transform="rotate(-8 ${cx} 760)">
    <path class="ink" d="M${cx} ${top - 10} L${cx + 6} 820"/>
    ${panels.join('')}
    <path class="ink" d="M${cx - 3} ${top - 18} l3 8 l3 -8"/>
  </g>`;
}

function towel() {
  const stripes = [];
  for (let i = 1; i < 6; i++) {
    const t = i / 6;
    const x1 = 860 + t * 190;
    const x2 = 820 + t * 220;
    stripes.push(`<path class="ink thin" d="M${f(x1)} 812 L${f(x2)} 900"/>`);
  }
  return `<g class="prop towel">
    <path class="ink sea-fill-soft" d="M860 812 L1050 800 L1040 896 L820 900 Z"/>
    ${stripes.join('')}
  </g>`;
}

function sailboat() {
  return `<g class="prop boat" transform="translate(360 ${HORIZON - 6})">
    <path class="ink" d="M-34 0 L34 0 L24 12 L-24 12 Z"/>
    <path class="ink" d="M0 0 L0 -64"/>
    <path class="ink paper-fill" d="M2 -60 L30 -6 L2 -6 Z"/>
    <path class="ink paper-fill" d="M-2 -52 L-24 -6 L-2 -6 Z"/>
  </g>`;
}

function footprints(r) {
  const out = [];
  for (let i = 0; i < 7; i++) {
    const x = 120 + i * 70;
    const y = 930 - i * 9 + (i % 2 ? -14 : 14);
    out.push(
      `<ellipse class="ink thin print" cx="${f(x)}" cy="${f(y + (r() - 0.5) * 3)}" rx="11" ry="6" transform="rotate(-12 ${f(x)} ${f(y)})"/>`
    );
  }
  return out.join('');
}

export function beachScene({ id = 'scene', seed = 7 } = {}) {
  const r = rng(seed);

  const seaBody = (() => {
    const pts = shorePoints().reverse();
    return `M-40 ${HORIZON + 2} L${W + 40} ${HORIZON + 2} ${pts.map(([x, y]) => `L${f(x)} ${f(y)}`).join(' ')} Z`;
  })();
  const sand = (() => {
    const pts = shorePoints();
    return `M${pts.map(([x, y]) => `${f(x)} ${f(y)}`).join(' L')} L${W + 40} ${H + 40} L-40 ${H + 40} Z`;
  })();

  const birds = [];
  const birdSpots = [
    [210, 170, 1.1], [330, 120, 0.8], [520, 220, 0.9], [640, 140, 0.7], [960, 120, 0.8],
    [1090, 210, 1], [1300, 150, 0.9], [1440, 250, 0.7], [760, 260, 0.6], [1500, 110, 0.8],
  ];
  for (const [x, y, s] of birdSpots) birds.push(bird(x, y, s, r));

  const wavelets = [];
  for (let i = 0; i < 46; i++) {
    const x = r() * W;
    const yMin = HORIZON + 24;
    const yMax = shoreY(x) - 24;
    if (yMax <= yMin) continue;
    const y = yMin + r() * (yMax - yMin);
    const depth = (y - HORIZON) / (shoreY(x) - HORIZON);
    wavelets.push(wavelet(x, y, 0.6 + depth * 0.9));
  }

  const school = [
    fish(520, 640, 1, false), fish(600, 668, 0.8, false), fish(470, 690, 0.9, false),
    fish(1040, 620, 0.9, true), fish(1120, 650, 1.1, true), fish(820, 700, 0.7, false),
    fish(1380, 640, 0.8, true),
  ];

  const sandDots = [];
  for (let i = 0; i < 120; i++) {
    const x = r() * W;
    const y = shoreY(x) + 30 + r() * (H - shoreY(x));
    sandDots.push(`<circle class="grain" cx="${f(x)}" cy="${f(y)}" r="${f(1 + r() * 1.6)}"/>`);
  }

  const foam = wobbly(shorePoints(-10), r, 3);
  const foam2 = wobbly(shorePoints(-28).filter((_, i) => i % 1 === 0), r, 4);

  return `<svg class="beach" id="${id}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="A hand-drawn beach: gulls over the sea, an orange sun, fish under the waves, an umbrella and towel on the sand">
  <defs>
    <filter id="${id}-hand" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="2" seed="${seed}" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="5" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
  </defs>
  <rect class="sky" x="0" y="0" width="${W}" height="${H}"/>
  <g filter="url(#${id}-hand)">
    <circle class="sun" cx="800" cy="330" r="74"/>
    <g class="birds">${birds.join('')}${gull(420, 300, 1)}${gull(1230, 300, 0.9)}${gull(1020, 380, 0.7)}</g>
    <path class="sea" d="${seaBody}"/>
    <path class="sand" d="${sand}"/>
    <path class="ink horizon" d="${horizonPath(r)}"/>
    ${sailboat()}
    <g class="wavelets">${wavelets.join('')}</g>
    <g class="school">${school.join('')}</g>
    <g class="grains">${sandDots.join('')}</g>
    <path class="ink foam" d="${foam}"/>
    <path class="ink thin foam" d="${foam2}"/>
    ${footprints(r)}
    ${towel()}
    ${umbrella()}
    ${starfish(1420, 900, 1.1)}
    ${shell(640, 930, 1)}
    ${shell(1500, 820, 0.7)}
  </g>
</svg>`;
}
