// The posters under the opener on builds.html, one per project, two to a row
// (one on phones), scrolling up over the faded wall. Each poster is the
// project's confession in big type (with the crossed-out word and the
// handwritten fix), a stamp counting how many times it flopped on the way,
// and a taped-on screenshot. Under it: a "spoiler" that gives away just
// enough of what went wrong to make you want the story. The whole thing
// opens the case study.

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { PROJECTS, marks } from './work/projects.js';

gsap.registerPlugin(ScrollTrigger);

// the teaser under each poster: the most tempting thing that went wrong
const HOOKS = {
  getmyhelp: 'spoiler: one login button cost me <em>a whole week</em>.',
  bento: 'spoiler: the lunchbox was <em>too heavy</em> to load.',
  byteforge: 'spoiler: one tiny step decided <em>our whole score</em>.',
  footnote: 'spoiler: the free ai kept saying <em>“not now”</em>.',
  'dsa-odyssey': 'spoiler: it panicked over <em>one bad day</em>.',
  skillable: 'spoiler: we tried to build <em>six products</em> at once.',
};

// each poster's resting tilt, in order
const TILT = [-2, 1.6, 1.2, -1.8, -1.4, 2];

export function initBuildList({ reduce = false } = {}) {
  const list = document.querySelector('.builds__list');
  if (!list) return;

  list.innerHTML = PROJECTS.map((p, i) => {
    const n = String(i + 1).padStart(2, '0');
    const flops = (p.chapters || []).reduce((sum, c) => sum + (c.fails?.length || 0), 0);
    const shot = p.poster.art
      ? `<span class="bp__shot"><span class="bp__shot-in"><img src="${p.poster.art}" alt="" loading="lazy" decoding="async" /></span></span>`
      : `<span class="bp__shot bp__shot--note"><span class="bp__shot-in">${(p.poster.type || p.name).replace(/\n/g, '<br />')}</span></span>`;
    const hook = HOOKS[p.slug] || p.caption;
    return `
      <li class="bp">
        <a class="bp__link" href="/project.html?p=${p.slug}" data-cursor="read the story →">
          <span class="bp__poster" style="--poster: ${p.poster.bg}; --poster-ink: ${p.poster.ink}; --tilt: ${TILT[i % TILT.length]}deg" aria-hidden="true">
            <span class="bp__top"><span>№ ${n} · ${p.name}</span><span>${p.year}</span></span>
            <span class="bp__head">${marks(p.headline)}</span>
            ${flops ? `<span class="bp__stamp">flopped<b>${flops}×</b>shipped anyway</span>` : ''}
            ${shot}
          </span>
          <span class="bp__foot">
            <span class="bp__title"><b>${p.name}</b> · ${(p.tags || []).slice(0, 2).join(' · ')}</span>
            <span class="bp__hook">${hook}</span>
            <span class="bp__more"><span>read how it went</span> →</span>
          </span>
        </a>
      </li>`;
  }).join('');

  if (reduce) return;
  list.querySelectorAll('.bp').forEach((item, i) => {
    gsap.from(item, {
      y: 140,
      rotation: i % 2 ? 6 : -6,
      opacity: 0,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: { trigger: item, start: 'top 95%', once: true },
    });
  });
}
