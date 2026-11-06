// The footer: the logo again, ways to say hi, links back up the page, and a
// huge pale "stay curious" that rises up from the bottom edge as you arrive.

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initFooter({ reduce = false } = {}) {
  const footer = document.getElementById('footer');
  if (!footer) return;

  // the logo, inlined so it takes the blue
  fetch('/logo.svg')
    .then((r) => (r.ok ? r.text() : ''))
    .then((svg) => {
      if (svg) footer.querySelector('.footer__logo').innerHTML = svg;
    })
    .catch(() => {});

  const year = footer.querySelector('#year');
  if (year) year.textContent = new Date().getFullYear();

  // links whose letters roll on hover
  footer.querySelectorAll('.roll').forEach((el) => {
    const text = el.textContent;
    el.setAttribute('aria-label', text);
    el.innerHTML = [...text]
      .map((ch, i) => `<span class="roll__c" aria-hidden="true" style="--i:${i}">${ch}</span>`)
      .join('');
  });

  // "back to top" and the in-page links glide instead of jumping
  footer.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href').slice(1);
      const target = id === 'top' ? document.body : document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      if (id === 'top') window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  if (reduce) return;
  gsap.from(footer.querySelector('.footer__big'), {
    yPercent: 60,
    ease: 'none',
    scrollTrigger: { trigger: footer, start: 'top bottom', end: 'bottom bottom', scrub: 0.5 },
  });
  gsap.from(footer.querySelectorAll('.footer__hello > *, .footer__nav > *'), {
    y: 24,
    opacity: 0,
    duration: 0.7,
    stagger: 0.07,
    ease: 'power3.out',
    scrollTrigger: { trigger: footer, start: 'top 85%', once: true },
  });
}
