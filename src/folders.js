// Folder tabs. The whole page is the folder's cover, and the section dividers
// stick out of its right edge. Clicking one pulls that divider across the
// screen in its colour (the page turns that colour), jumps to the section
// underneath, then the sheet carries on off the left so the folder opens.

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initFolders({ reduce = false } = {}) {
  const nav = document.querySelector('.folders');
  if (!nav) return;
  const tabs = [...nav.querySelectorAll('.folders__tab')];

  // the thin coloured page edges behind the tabs
  const edges = nav.querySelector('.folders__edges');
  tabs.forEach((t) => {
    const e = document.createElement('i');
    e.style.background = t.style.getPropertyValue('--c');
    edges.appendChild(e);
  });

  // the sheet that sweeps across: a full-screen divider with its tab attached
  const sheet = document.createElement('div');
  sheet.className = 'folders__sheet';
  sheet.setAttribute('aria-hidden', 'true');
  sheet.innerHTML = '<span class="folders__sheet-tab"></span><span class="folders__sheet-title"></span>';
  document.body.appendChild(sheet);
  const sheetTab = sheet.querySelector('.folders__sheet-tab');
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
    ['--c', '--ink', '--slot'].forEach((p) => sheet.style.setProperty(p, tab.style.getPropertyValue(p)));
    sheetTab.textContent = tab.textContent;
    sheetTitle.textContent = tab.textContent;

    gsap
      .timeline({ onComplete: () => (busy = false) })
      .set(sheet, { visibility: 'visible', xPercent: 100 })
      .set(sheetTitle, { opacity: 0, y: 30 })
      .to(tab, { x: -14, duration: 0.18, ease: 'power2.out' })
      // the divider is pulled across and the page turns its colour
      .to(sheet, { xPercent: 0, duration: 0.75, ease: 'power3.inOut' }, 0.08)
      .to(sheetTitle, { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' }, 0.55)
      .add(() => {
        window.scrollTo({ top: topOf(target), behavior: 'instant' });
        ScrollTrigger.update();
      }, 0.85)
      .to(tab, { x: 0, duration: 0.3 }, 0.85)
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

  // the tab for the section you're in sits pulled out a little
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
