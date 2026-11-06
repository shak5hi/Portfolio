// Section 5: "before you ask...". The dots after the title pop in one by one,
// and the question cards rise in as they come into view.

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initFaq({ reduce = false } = {}) {
  const section = document.getElementById('faq');
  if (!section || reduce) return;

  const head = section.querySelector('.faq__head');
  gsap
    .timeline({ scrollTrigger: { trigger: head, start: 'top 80%', once: true } })
    .from(head, { yPercent: 30, opacity: 0, duration: 0.8, ease: 'power3.out' })
    .from(section.querySelectorAll('.faq__dot'), {
      y: -18,
      opacity: 0,
      duration: 0.35,
      stagger: 0.16,
      ease: 'back.out(3)',
    }, '-=0.3');

  // cards come in a few at a time, in reading order
  const cards = section.querySelectorAll('.faq__card');
  gsap.set(cards, { y: 40, opacity: 0 });
  ScrollTrigger.batch(cards, {
    start: 'top 88%',
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', stagger: 0.1 }),
  });
}
