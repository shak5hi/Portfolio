// Folder tabs down the right edge: plain, soft-cornered tabs, the open one in
// the page's colour joining onto it. Clicking a tab sweeps its colour across
// the page, jumps to its section underneath, and the colour slides on off the
// left to open it. "Who's this?" (the landing page) just takes you straight
// back up, no sweep. A tab with no section yet sweeps in, says "coming soon"
// and slides back.
// A tab with data-page is a whole separate page ("Me, Basically" → me.html):
// its colour sweeps in, the page opens, and the colour slides off there.
// Tabs keep their own colours; the open one just sticks out a little further.

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
  sheet.innerHTML = '<span class="folders__sheet-title"></span><span class="folders__sheet-note">coming soon</span>';
  document.body.appendChild(sheet);
  const sheetTitle = sheet.querySelector('.folders__sheet-title');
  const sheetNote = sheet.querySelector('.folders__sheet-note');

  const labelOf = (tab) => tab.querySelector('span').textContent;
  const sectionOf = (sel) => (sel && sel.startsWith('#') && sel.length > 1 ? document.querySelector(sel) : null);
  const targetOf = (tab) => sectionOf(tab.getAttribute('href'));
  const CARRY = 'folders-sweep'; // carries a sweep across to the next page
  const topOf = (el) => el.getBoundingClientRect().top + window.scrollY;
  const setHere = (tab) => tabs.forEach((t) => t.classList.toggle('is-here', t === tab));

  let busy = false;
  const open = (tab) => {
    if (busy) return;
    if (tab.classList.contains('is-here') && tab.dataset.page) return; // already on that page
    // a whole separate page: sweep its colour in, then go
    if (tab.dataset.page) {
      if (reduce) {
        location.href = tab.dataset.page;
        return;
      }
      busy = true;
      sheet.style.setProperty('--c', tab.style.getPropertyValue('--c'));
      sheetTitle.textContent = ""; // a page tab sweeps in plain colour, no name on it
      sheetNote.style.display = 'none';
      gsap
        .timeline()
        .set(sheet, { visibility: 'visible', xPercent: 100 })
        .set(sheetTitle, { opacity: 0, y: 30 })
        .to(sheet, { xPercent: 0, duration: 0.75, ease: 'power3.inOut' }, 0)
        .to(sheetTitle, { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' }, 0.45)
        .add(() => {
          try {
            sessionStorage.setItem(CARRY, JSON.stringify({ c: tab.style.getPropertyValue('--c'), label: '' }));
          } catch {}
          location.href = tab.dataset.page;
        }, 0.95);
      return;
    }
    const target = targetOf(tab);
    // the first tab is the landing page: straight back to it, no sweep
    if (tab === tabs[0]) {
      setHere(tab);
      window.scrollTo({ top: 0, behavior: 'instant' });
      return;
    }
    if (target && reduce) {
      setHere(tab);
      window.scrollTo({ top: topOf(target), behavior: 'auto' });
      return;
    }
    busy = true;
    sheet.style.setProperty('--c', tab.style.getPropertyValue('--c'));
    sheetTitle.textContent = labelOf(tab);
    sheetNote.style.display = target ? 'none' : '';
    const was = tabs.find((t) => t.classList.contains('is-here'));
    setHere(tab);

    const tl = gsap
      .timeline({ onComplete: () => (busy = false) })
      .set(sheet, { visibility: 'visible', xPercent: 100 })
      .set([sheetTitle, sheetNote], { opacity: 0, y: 30 })
      .to(sheet, { xPercent: 0, duration: 0.75, ease: 'power3.inOut' }, 0)
      .to([sheetTitle, sheetNote], { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power3.out' }, 0.45);

    if (target) {
      tl.add(() => {
        window.scrollTo({ top: topOf(target), behavior: 'instant' });
        ScrollTrigger.update();
      }, 0.8)
        .to(sheetTitle, { opacity: 0, y: -20, duration: 0.3, ease: 'power2.in' }, 0.98)
        .to(sheet, { xPercent: -100, duration: 0.8, ease: 'power3.inOut' }, 1.02);
    } else {
      tl.to([sheetTitle, sheetNote], { opacity: 0, duration: 0.3 }, 1.7)
        .to(sheet, { xPercent: 100, duration: 0.7, ease: 'power3.inOut' }, 1.8)
        .add(() => setHere(was), 1.9);
    }
    tl.set(sheet, { visibility: 'hidden' });
  };

  tabs.forEach((tab) =>
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      open(tab);
    }),
  );

  // keep the open tab in step with the section on screen
  tabs.forEach((tab) => {
    const ids = [tab.getAttribute('href'), ...(tab.dataset.also || '').split(/\s+/)].filter(Boolean);
    ids.forEach((id) => {
      const el = sectionOf(id);
      if (!el) return;
      ScrollTrigger.create({
        trigger: el,
        start: 'top 50%',
        end: 'bottom 50%',
        onToggle: (st) => st.isActive && !busy && setHere(tab),
      });
    });
  });
  // the page says which tab it is (is-here in its markup); the landing page is "who's this?"
  setHere(tabs.find((t) => t.classList.contains('is-here')) || tabs[0]);

  // arriving from another page's tab: its colour is still covering the screen; slide it off
  let carried = null;
  try {
    carried = JSON.parse(sessionStorage.getItem(CARRY) || 'null');
    sessionStorage.removeItem(CARRY);
  } catch {}
  if (carried && !reduce) {
    sheet.style.setProperty('--c', carried.c);
    sheetTitle.textContent = carried.label;
    sheetNote.style.display = 'none';
    gsap
      .timeline({ delay: 0.15 })
      .set(sheet, { visibility: 'visible', xPercent: 0 })
      .to(sheetTitle, { opacity: 0, y: -20, duration: 0.3, ease: 'power2.in' })
      .to(sheet, { xPercent: -100, duration: 0.8, ease: 'power3.inOut' }, 0.1)
      .set(sheet, { visibility: 'hidden' });
  }

  // coming back with the browser's back button: don't leave the sheet up
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
      gsap.set(sheet, { visibility: 'hidden' });
      busy = false;
    }
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
