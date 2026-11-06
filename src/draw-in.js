// Draw a set of paths in, in their original order, in a fixed total time
// however many strokes there are. Each stroke gets time in proportion to
// its length (softened, so long lines don't hog the clock and dots don't
// vanish), and neighbouring strokes overlap so it flows rather than ticks.

import { gsap } from 'gsap';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';

gsap.registerPlugin(DrawSVGPlugin);

export function drawIn(paths, { total = 5, overlap = 0.7, ease = 'power1.inOut' } = {}) {
  const list = [...paths];
  const tl = gsap.timeline();
  if (!list.length) return tl;

  const lengths = list.map((p) => {
    try {
      return p.getTotalLength();
    } catch {
      return 0;
    }
  });
  const weights = lengths.map((l) => Math.pow(Math.max(l, 4), 0.7));
  const sum = weights.reduce((a, b) => a + b, 0);

  gsap.set(list, { drawSVG: '0%' });
  let at = 0;
  list.forEach((p, i) => {
    const d = Math.max(0.04, (weights[i] / sum) * (total / (1 - overlap)));
    tl.to(p, { drawSVG: '100%', duration: d, ease }, at);
    at += d * (1 - overlap);
  });

  // squeeze or stretch the whole thing to land exactly on the total
  tl.duration(total);
  return tl;
}
