// Section 4: "work I'm super proud of". The title sits in the middle, the
// section pins, and the poster cards rise from below one after another and
// pile up over it, each at its own little tilt.

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { PROJECTS, marks } from './work/projects.js';

gsap.registerPlugin(ScrollTrigger);

// each poster's resting tilt and how far down it sits (px), in pile order
const LAY = [
  [-3, 0],
  [2, 26],
  [-1.5, 8],
  [3.5, 30],
  [-2.5, 4],
  [1.5, 22],
];

// one poster per project: a little confession in mono in the corner, a
// tinted cut-out of the project itself, and its name at the foot. The whole
// card opens the case study.
function writePosters(pile) {
  pile.innerHTML = PROJECTS.map((p, i) => {
    const [tilt, drop] = LAY[i % LAY.length];
    const n = String(i + 1).padStart(2, '0');
    const art = p.poster.art
      ? `<span class="work__art" aria-hidden="true"><img src="${p.poster.art}" alt="" loading="lazy" decoding="async" /></span>`
      : `<span class="work__type" aria-hidden="true">${(p.poster.type || p.name).replace(/\n/g, '<br />')}</span>`;
    return `
      <li class="work__tile" style="--tilt: ${tilt}deg; --drop: ${drop}; --i: ${i}">
        <a class="work__poster" href="/project.html?p=${p.slug}" style="--poster: ${p.poster.bg}; --poster-ink: ${p.poster.ink}" data-cursor="read the story →" aria-label="${p.name}: ${p.caption.replace(/~~.+?~~\s?/g, '')}">
          <span class="work__cap" aria-hidden="true">${marks(p.caption)}</span>
          ${art}
          <span class="work__name" aria-hidden="true"><span>${n}</span>${p.name}</span>
        </a>
      </li>`;
  }).join('');
}

export function initWork({ reduce = false } = {}) {
  const section = document.getElementById('work');
  if (!section) return;
  const pin = section.querySelector('.work__pin');
  const head = section.querySelector('.work__head');
  writePosters(section.querySelector('.work__pile'));
  const tiles = [...section.querySelectorAll('.work__tile')];
  if (reduce) return;

  const mm = gsap.matchMedia();

  mm.add('(min-width: 761px)', () => {
    // the title rises into place as the section arrives
    const intro = gsap.from(head, {
      yPercent: 40,
      opacity: 0,
      ease: 'power3.out',
      scrollTrigger: { trigger: section, start: 'top 80%', end: 'top 15%', scrub: 0.6 },
    });

    const below = () => window.innerHeight * 1.1;
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        pin,
        start: 'top top',
        end: () => `+=${Math.round(window.innerHeight * (0.45 + tiles.length * 0.55))}`,
        scrub: 0.7,
        invalidateOnRefresh: true,
      },
    });
    tl.to({}, { duration: 0.35 }); // the title alone for a beat
    tiles.forEach((tile, i) => {
      const tilt = parseFloat(getComputedStyle(tile).getPropertyValue('--tilt')) || 0;
      tl.fromTo(
        tile,
        { y: below, rotation: tilt + (i % 2 ? -9 : 9) },
        { y: 0, rotation: tilt, duration: 1, ease: 'power2.out', immediateRender: true },
        0.35 + i * 0.62,
      );
    });
    tl.to({}, { duration: 0.3 }); // let the full pile sit before moving on

    return () => {
      intro.scrollTrigger?.kill();
      intro.kill();
      tl.scrollTrigger?.kill();
      tl.kill();
      gsap.set(tiles, { clearProps: 'transform' });
      gsap.set(head, { clearProps: 'all' });
    };
  });

  // phones: no pinning, each poster slides up and settles as you reach it
  mm.add('(max-width: 760px)', () => {
    const tweens = tiles.map((tile, i) =>
      gsap.from(tile, {
        y: 120,
        rotation: i % 2 ? -8 : 8,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: { trigger: tile, start: 'top 92%', once: true },
      }),
    );
    return () => tweens.forEach((t) => t.kill());
  });
}
