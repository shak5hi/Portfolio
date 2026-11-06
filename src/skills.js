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

  // the heading settles in word by word, then the paragraph and the button
  const head = section.querySelector('.skills__head');
  const label = head.textContent.trim();
  head.setAttribute('aria-label', label);
  head.innerHTML = label
    .split(/\s+/)
    .map((w) => `<span class="skills__hw" aria-hidden="true">${w}</span>`)
    .join(' ');
  const settle = (tl) =>
    tl
      .from(head.querySelectorAll('.skills__hw'), {
        yPercent: 70,
        opacity: 0,
        filter: 'blur(8px)',
        stagger: 0.06,
        duration: 0.5,
        ease: 'power3.out',
      })
      .from([section.querySelector('.skills__body'), section.querySelector('.skills__btn')], {
        y: 24,
        opacity: 0,
        stagger: 0.1,
        duration: 0.45,
        ease: 'power2.out',
      }, '-=0.25');

  const mm = gsap.matchMedia();

  // wide screens: the copy settles as the section arrives, the section pins
  // with the copy alone in the middle for a beat, and then the list rises in
  // from the bottom and slides up past it
  mm.add('(min-width: 761px)', () => {
    const copy = section.querySelector('.skills__copy');
    const intro = settle(
      gsap.timeline({
        scrollTrigger: { trigger: section, start: 'top 75%', end: 'top 5%', scrub: 0.6 },
      }),
    );

    // list positions: first item just below the bottom of the screen, to the
    // last item level with the top of the heading
    const startY = () => pin.offsetHeight - list.offsetTop + 8;
    const endY = () => copy.offsetTop - list.offsetTop - list.offsetHeight + list.lastElementChild.offsetHeight;
    const travel = () => startY() - endY();
    const HOLD = 0.3; // the copy alone, as a share of the list's travel

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        pin,
        start: 'top top',
        end: () => `+=${Math.round(travel() * (1 + HOLD) * 1.1)}`,
        scrub: 0.6,
        invalidateOnRefresh: true,
        onRefresh: focus,
      },
    });
    tl.fromTo(list, { y: startY }, { y: startY, duration: HOLD, ease: 'none' }) // the copy, alone, for a beat
      .fromTo(list, { y: startY }, { y: endY, duration: 1, ease: 'none', immediateRender: false });

    gsap.ticker.add(focus); // keeps up while the scrub eases
    return () => {
      gsap.ticker.remove(focus);
      intro.scrollTrigger?.kill();
      intro.kill();
      tl.scrollTrigger?.kill();
      tl.kill();
      gsap.set(list, { clearProps: 'transform' });
    };
  });

  // phones: no pin. The copy settles once you reach it, and the list's words
  // come into focus as you scroll to them
  mm.add('(max-width: 760px)', () => {
    const intro = settle(gsap.timeline({ scrollTrigger: { trigger: section, start: 'top 70%', once: true } }));
    gsap.ticker.add(focus);
    return () => {
      gsap.ticker.remove(focus);
      intro.kill();
    };
  });
}
