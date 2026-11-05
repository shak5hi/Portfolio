// Postcard-sized ink drawings for each project, in the beach's palette.
// viewBox 640 x 440. Classes match the shared .doodle ink styles.

const frame = (label, inner) =>
  `<svg class="doodle" viewBox="0 0 640 440" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${label}">
    <rect width="640" height="440" fill="#f5f0da"/>
    ${inner}
  </svg>`;

const ripples = (y, from = 0, to = 640, step = 40) => {
  let d = `M${from} ${y}`;
  for (let x = from; x < to; x += step) d += ` q${step / 4} -8 ${step / 2} 0 t${step / 2} 0`;
  return d;
};

export const doodles = {
  tidepool: frame(
    'A phone drawn in ink, its screen a rock pool slowly filling with water and a starfish',
    `<circle cx="520" cy="96" r="44" fill="#cf9550"/>
     <path class="ink thin" d="M80 80 q10 -12 20 0 q10 -12 20 0 M150 120 q8 -9 16 0 q8 -9 16 0"/>
     <path class="ink" d="${ripples(380, -20, 680)}"/>
     <g transform="rotate(-6 320 230)">
       <rect class="ink paper-fill" x="230" y="50" width="180" height="340" rx="30"/>
       <rect x="248" y="200" width="144" height="168" rx="6" fill="#a9cbe3"/>
       <path class="ink" d="M248 200 q18 -10 36 0 t36 0 t36 0 t36 0"/>
       <path class="ink thin" d="M262 250 q8 -6 16 0 M330 300 q8 -6 16 0 M300 340 q8 -6 16 0"/>
       <path class="ink sun-fill" d="M318 270 l6 14 l15 1 l-12 9 l5 15 l-14 -9 l-13 9 l5 -15 l-12 -9 l15 -1 Z"/>
       <rect class="ink" x="248" y="84" width="144" height="96" rx="6"/>
       <path class="ink" d="M268 150 l20 -24 l18 16 l24 -36 l22 30 l20 -14"/>
       <circle cx="320" cy="68" r="5" fill="#1d4b88"/>
     </g>`
  ),
  saltlines: frame(
    'A long hand-drawn tide chart line rising and falling across the page with storm markers',
    `<rect x="0" y="300" width="640" height="140" fill="#a9cbe3"/>
     <path class="ink" d="M0 300 ${Array.from({ length: 17 }, (_, i) => `L${i * 40} ${300 - Math.sin(i * 0.9) * 26}`).join(' ')}"/>
     <path class="ink" d="M30 230 C80 120 120 260 170 170 S250 70 300 160 S380 260 430 140 S520 60 610 150" stroke-width="4"/>
     <path class="ink thin" d="M30 270 L610 270 M30 70 L30 270"/>
     <g>
       <circle class="ink sun-fill" cx="250" cy="104" r="12"/>
       <path class="ink" d="M250 84 l-10 -30 l14 6 l-6 -30"/>
       <circle class="ink sun-fill" cx="508" cy="96" r="12"/>
       <path class="ink" d="M508 76 l-10 -30 l14 6 l-6 -30"/>
     </g>
     <path class="ink thin" d="${ripples(350, -20, 680, 50)} ${ripples(395, -40, 680, 60)}"/>`
  ),
  sandcastle: frame(
    'A sandcastle made of stacked interface components: buttons, toggles and cards, with a flag on top',
    `<rect x="0" y="330" width="640" height="110" fill="#efdfae"/>
     <path class="ink" d="M0 330 q40 -10 80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0"/>
     <g>
       <rect class="ink sea-fill" x="190" y="230" width="260" height="100"/>
       <rect class="ink paper-fill" x="230" y="160" width="180" height="70"/>
       <rect class="ink sun-fill" x="280" y="100" width="80" height="60"/>
       <path class="ink" d="M190 230 v-20 h26 v20 M232 230 v-20 h26 v20 M380 230 v-20 h26 v20 M424 230 v-20 h26 v20"/>
       <path class="ink" d="M320 100 V40"/><path class="ink stripe" d="M320 42 L356 52 L320 64 Z"/>
       <rect class="ink paper-fill" x="216" y="262" width="80" height="30" rx="15"/>
       <rect class="ink" x="350" y="262" width="62" height="30" rx="15"/><circle cx="397" cy="277" r="10" fill="#1d4b88"/>
       <path class="ink thin" d="M248 188 h70 M248 204 h110"/>
       <path class="ink" d="M298 312 a22 22 0 0 1 44 0 v18 h-44 Z"/>
     </g>
     <path class="ink" d="M500 390 l12 -30 l16 30 M520 360 v-10"/>
     <path class="ink thin" d="M80 380 q6 -8 12 0 M560 410 q6 -8 12 0 M130 410 q6 -8 12 0"/>`
  ),
  hermit: frame(
    'A hermit crab carrying a chat bubble as its shell, peeking out on the sand',
    `<rect x="0" y="300" width="640" height="140" fill="#efdfae"/>
     <path class="ink" d="M0 300 q40 -12 80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0"/>
     <circle cx="120" cy="100" r="40" fill="#cf9550"/>
     <g>
       <path class="ink sea-fill" d="M240 110 h220 a30 30 0 0 1 30 30 v100 a30 30 0 0 1 -30 30 h-150 l-40 34 v-34 h-30 a30 30 0 0 1 -30 -30 v-100 a30 30 0 0 1 30 -30 Z"/>
       <path class="ink" d="M262 158 h176 M262 192 h140 M262 226 h90" stroke-width="5"/>
       <path class="ink sun-fill" d="M420 300 C420 270 470 266 482 296 Z"/>
       <path class="ink" d="M440 284 L430 250 M462 282 L470 250"/>
       <circle class="ink paper-fill" cx="430" cy="246" r="9"/><circle class="ink paper-fill" cx="472" cy="246" r="9"/>
       <circle cx="432" cy="247" r="3.5" fill="#1d4b88"/><circle cx="470" cy="247" r="3.5" fill="#1d4b88"/>
       <path class="ink" d="M486 292 c18 -6 30 -2 34 10 c-10 2 -18 0 -22 -6 M416 296 l-18 16 M440 302 l-6 20 M470 302 l6 20 M492 298 l14 16"/>
     </g>
     <path class="ink thin" d="M80 380 q6 -8 12 0 M560 400 q6 -8 12 0 M200 410 q6 -8 12 0"/>`
  ),
};
