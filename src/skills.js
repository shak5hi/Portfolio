// Section 3: "what I do". On wide screens the section pins and the big list
// slides up past the copy. Each word arrives blurred and faint and comes into
// focus as it rises, then stays sharp and scrolls off the top.

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const BLUR = 6; // px, how soft a word is when it first appears

export function initSkills({ reduce = false } = {}) {
  const section = document.getElementById('skills');
  if (!section) return;
  const pin = section.querySelector('.skills__pin');
  const list = section.querySelector('.skills__list');

  // the roll-over letters on the button
  section.querySelectorAll('.roll').forEach((el) => {
    const text = el.textContent;
    el.setAttribute('aria-label', text);
    el.innerHTML = [...text]
      .map((ch, i) => `<span class="roll__c" aria-hidden="true" style="--i:${i}">${ch}</span>`)
      .join('');
  });

  if (reduce) return;

  // wrap each word so it can come into focus on its own
  const words = [];
  list.querySelectorAll('li').forEach((li) => {
    const label = li.textContent.trim();
    li.setAttribute('aria-label', label);
    li.innerHTML = label
      .split(/\s+/)
      .map((w) => `<span class="skills__w" aria-hidden="true">${w.replace('&', '&amp;')}</span>`)
      .join(' ');
    li.querySelectorAll('.skills__w').forEach((w, i) => words.push({ el: w, nudge: i * 0.035, t: -1 }));
  });

  // a word's focus from where it sits on screen: 0 at the bottom edge,
  // 1 once it has risen to just below the middle
  const focus = () => {
    const vh = window.innerHeight;
    const from = vh * 0.98;
    const to = vh * 0.52;
    const box = section.getBoundingClientRect();
    if (box.bottom < 0 || box.top > vh) return; // off screen: nothing to do
    words.forEach((w) => {
      const r = w.el.getBoundingClientRect();
      const t = gsap.utils.clamp(0, 1, (from - r.top) / (from - to) - w.nudge);
      if (Math.abs(t - w.t) < 0.002) return;
      w.t = t;
      w.el.style.opacity = t.toFixed(3);
      w.el.style.filter = t >= 1 ? 'none' : `blur(${((1 - t) * BLUR).toFixed(2)}px)`;
    });
  };

  const mm = gsap.matchMedia();

  // wide screens: pin, and slide the list up past the copy
  mm.add('(min-width: 761px)', () => {
    const copy = section.querySelector('.skills__copy');
    // the first item starts level with the heading and the list scrolls
    // until its last item has passed the same line
    const startY = () => copy.offsetTop - list.offsetTop;
    const endY = () => startY() - list.offsetHeight + list.lastElementChild.offsetHeight;
    const tween = gsap.fromTo(
      list,
      { y: startY },
      {
        y: endY,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          pin,
          start: 'top top',
          end: () => `+=${Math.round((startY() - endY()) * 1.2)}`,
          scrub: 0.6,
          invalidateOnRefresh: true,
          onRefresh: focus,
        },
      },
    );
    gsap.ticker.add(focus); // keeps up while the scrub eases
    return () => {
      gsap.ticker.remove(focus);
      tween.scrollTrigger?.kill();
      tween.kill();
      gsap.set(list, { clearProps: 'transform' });
    };
  });

  // phones: no pin, words just come into focus as you scroll to them
  mm.add('(max-width: 760px)', () => {
    gsap.ticker.add(focus);
    return () => gsap.ticker.remove(focus);
  });
}
