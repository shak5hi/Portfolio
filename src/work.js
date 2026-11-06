// Section 4: "work I'm super proud of". The title sits in the middle, the
// section pins, and the poster cards rise from below one after another and
// pile up over it, each at its own little tilt.

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initWork({ reduce = false } = {}) {
  const section = document.getElementById('work');
  if (!section) return;
  const pin = section.querySelector('.work__pin');
  const head = section.querySelector('.work__head');
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
