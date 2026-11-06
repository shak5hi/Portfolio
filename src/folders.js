// Folders, turned on their side. The page is the front folder; the others sit
// behind it and their tabs peek out of the right edge, each with soft curved
// shoulders like a real file folder's. The folder you're in has its tab in
// front, in the page's colour, running straight into the page. Clicking a tab
// sweeps that folder's colour across the page, jumps to its section, and the
// colour slides on off the left to open it. A folder with no section yet
// sweeps in, says "coming soon" and slides back.

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const SVG = 'http://www.w3.org/2000/svg';

// a folder tab on its side: it grows out of the folder's edge (x = 0) with an
// S-curved shoulder at each end, out to a flat rounded edge at x = w
function tabPath(w, h, s, r) {
  const x0 = -12; // reach back under the page so the tab joins it seamlessly
  return [
    `M${x0} ${-6}`,
    `L0 ${-6}`,
    `C${w * 0.42} ${-6} ${w * 0.5} ${s} ${w - r} ${s}`,
    `Q${w} ${s} ${w} ${s + r}`,
    `L${w} ${h - s - r}`,
    `Q${w} ${h - s} ${w - r} ${h - s}`,
    `C${w * 0.5} ${h - s} ${w * 0.42} ${h + 6} 0 ${h + 6}`,
    `L${x0} ${h + 6}Z`,
  ].join(' ');
}

export function initFolders({ reduce = false } = {}) {
  const nav = document.querySelector('.folders');
  if (!nav) return;
  const tabs = [...nav.querySelectorAll('.folders__tab')];

  // each folder's edge behind the page, stepping out a few pixels per layer
  const edges = tabs.map((tab, i) => {
    const e = document.createElement('span');
    e.className = 'folders__edge';
    e.style.setProperty('--c', tab.style.getPropertyValue('--c'));
    e.style.zIndex = String(1 + tabs.length - i); // nearer folders on top
    e.style.width = `${3 + (i + 1) * 2}px`; // further back peeks out further
    nav.prepend(e);
    return e;
  });

  // draw every tab to fit the screen
  tabs.forEach((tab) => {
    const svg = document.createElementNS(SVG, 'svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.appendChild(document.createElementNS(SVG, 'path'));
    tab.prepend(svg);
  });
  const layout = () => {
    const rail = nav.clientWidth;
    const vh = window.innerHeight;
    const phone = window.innerWidth <= 760;
    const s = phone ? 12 : 18; // shoulder length
    const top = vh * 0.12;
    const room = vh - top - vh * 0.04;
    const n = tabs.length;
    const h = Math.min((room + s * (n - 1)) / n, 190); // neighbours share a shoulder
    const w = rail - (phone ? 3 : 4);
    tabs.forEach((tab, i) => {
      tab.style.top = `${top + i * (h - s)}px`;
      tab.style.height = `${h}px`;
      tab.style.zIndex = String(10 - i);
      tab.querySelector('svg').setAttribute('viewBox', `0 0 ${rail} ${h}`);
      tab.querySelector('path').setAttribute('d', tabPath(w, h, s, phone ? 5 : 7));
      const label = tab.querySelector('span');
      label.style.top = `${s}px`;
      label.style.bottom = `${s}px`;
    });
  };
  layout();
  window.addEventListener('resize', layout);

  // the colour that sweeps across the page
  const sheet = document.createElement('div');
  sheet.className = 'folders__sheet';
  sheet.setAttribute('aria-hidden', 'true');
  sheet.innerHTML = '<span class="folders__sheet-title"></span><span class="folders__sheet-note">coming soon</span>';
  document.body.appendChild(sheet);
  const sheetTitle = sheet.querySelector('.folders__sheet-title');
  const sheetNote = sheet.querySelector('.folders__sheet-note');

  const labelOf = (tab) => tab.querySelector('span').textContent;
  const targetOf = (tab) => document.querySelector(tab.getAttribute('href'));
  const topOf = (el) => el.getBoundingClientRect().top + window.scrollY;
  const setHere = (tab) => tabs.forEach((t) => t.classList.toggle('is-here', t === tab));

  let busy = false;
  const open = (tab) => {
    if (busy) return;
    const target = targetOf(tab);
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

  // keep the open folder in step with the section on screen
  tabs.forEach((tab) => {
    const ids = [tab.getAttribute('href'), ...(tab.dataset.also || '').split(/\s+/)].filter(Boolean);
    ids.forEach((id) => {
      const el = document.querySelector(id);
      if (!el) return;
      ScrollTrigger.create({
        trigger: el,
        start: 'top 50%',
        end: 'bottom 50%',
        onToggle: (st) => st.isActive && !busy && setHere(tab),
      });
    });
  });
  setHere(tabs[0]); // the landing page is "who's this?"

  // tuck the folders away at the footer
  const footer = document.getElementById('footer');
  if (footer) {
    ScrollTrigger.create({
      trigger: footer,
      start: 'top 85%',
      onToggle: (st) => nav.classList.toggle('is-away', st.isActive),
    });
  }
  return edges;
}
