// Index tabs, like a notebook's, sticking out of the page's right edge.
// Clicking one brings that tab to the top of the stack, sweeps its colour
// across the page like turning to it, jumps to the section underneath, and
// the colour carries on off the left to open onto it.

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initFolders({ reduce = false } = {}) {
  const nav = document.querySelector('.folders');
  if (!nav) return;
  const tabs = [...nav.querySelectorAll('.folders__tab')];

  // the colour that sweeps across the page
  const sheet = document.createElement('div');
  sheet.className = 'folders__sheet';
  sheet.setAttribute('aria-hidden', 'true');
  sheet.innerHTML = '<span class="folders__sheet-title"></span>';
  document.body.appendChild(sheet);
  const sheetTitle = sheet.querySelector('.folders__sheet-title');

  const targetOf = (tab) => document.querySelector(tab.getAttribute('href'));
  const topOf = (el) => el.getBoundingClientRect().top + window.scrollY;

  let busy = false;
  const open = (tab) => {
    const target = targetOf(tab);
    if (!target || busy) return;
    if (reduce) {
      window.scrollTo({ top: topOf(target), behavior: 'auto' });
      return;
    }
    busy = true;
    ['--c', '--ink'].forEach((p) => sheet.style.setProperty(p, tab.style.getPropertyValue(p)));
    // the clicked tab comes to the top of the stack straight away
    tabs.forEach((t) => t.classList.toggle('is-here', t === tab));
    sheetTitle.textContent = tab.textContent;

    gsap
      .timeline({ onComplete: () => (busy = false) })
      .set(sheet, { visibility: 'visible', xPercent: 100 })
      .set(sheetTitle, { opacity: 0, y: 30 })
      // the divider is pulled across and the page turns its colour
      .to(sheet, { xPercent: 0, duration: 0.75, ease: 'power3.inOut' }, 0.08)
      .to(sheetTitle, { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' }, 0.55)
      .add(() => {
        window.scrollTo({ top: topOf(target), behavior: 'instant' });
        ScrollTrigger.update();
      }, 0.85)
      // then it carries on out of the way: the folder is open
      .to(sheetTitle, { opacity: 0, y: -20, duration: 0.3, ease: 'power2.in' }, 1.05)
      .to(sheet, { xPercent: -100, duration: 0.8, ease: 'power3.inOut' }, 1.1)
      .set(sheet, { visibility: 'hidden' });
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      open(tab);
    });
  });

  // the tab for the section you're in sits on top of the stack
  tabs.forEach((tab) => {
    const target = targetOf(tab);
    if (!target) return;
    ScrollTrigger.create({
      trigger: target,
      start: 'top 50%',
      end: 'bottom 50%',
      onToggle: (st) => tab.classList.toggle('is-here', st.isActive),
    });
  });

  // tuck the tabs away at the footer
  const footer = document.getElementById('footer');
  if (footer) {
    ScrollTrigger.create({
      trigger: footer,
      start: 'top 85%',
      onToggle: (st) => nav.classList.toggle('is-away', st.isActive),
    });
  }
}
