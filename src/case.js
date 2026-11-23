// A case study page (project.html?p=<slug>). Reads the project from
// src/work/projects.js and writes out the article: the title, the facts,
// a band in the project's colour, the story with its screenshots and the
// animated diagram, the next project, and finally the stack pit.

import './style.css';
import './case.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initCursor } from './cursor.js';
import { PROJECTS, bySlug, marks } from './work/projects.js';
import { renderDiagram } from './work/diagrams.js';
import { initPit } from './work/pit.js';

gsap.registerPlugin(ScrollTrigger);

const root = document.documentElement;
const reduce = root.classList.contains('no-motion');
const slug = new URLSearchParams(location.search).get('p');
const project = bySlug(slug);

if (!project) {
  location.replace('/#work');
} else {
  build(project);
}

function build(p) {
  initCursor({ reduce });
  const index = PROJECTS.indexOf(p);
  const next = PROJECTS[(index + 1) % PROJECTS.length];
  const two = (n) => String(n).padStart(2, '0');

  document.title = `${p.name} · Shakshi Sharma`;
  document.querySelector('meta[name="description"]').setAttribute('content', p.kicker);
  root.style.setProperty('--case-bg', p.poster.bg);
  root.style.setProperty('--case-ink', p.poster.ink);

  // the dark strip across the top, with a cut-out of the project poking out
  const banner = document.getElementById('banner');
  banner.innerHTML = p.banner
    ? `<div class="cs-banner__cut"><img src="${p.banner}" alt="" /></div>`
    : `<div class="cs-banner__run" aria-hidden="true"><span>${(p.bannerText || p.name).repeat(4)}</span></div>`;

  const links = p.links
    .map((l) => `<li><a href="${l.href}" target="_blank" rel="noopener" data-cursor="open ↗"><span class="roll">${l.label}</span><span aria-hidden="true"> ↗</span></a></li>`)
    .join('');

  const main = document.getElementById('case');
  main.innerHTML = `
    <article class="cs">
      <p class="cs-count"><span>${two(index + 1)} / ${two(PROJECTS.length)}</span><span>${p.year}</span></p>
      <h1 class="cs-title">${marks(p.headline)}</h1>

      <div class="cs-row cs-row--intro">
        <aside class="cs-side">
          <p class="cs-tag">${p.tag}.</p>
          <ul class="cs-tags" role="list">${p.tags.map((t) => `<li>${t}</li>`).join('')}</ul>
          <dl class="cs-facts">
            <div><dt>my part</dt><dd>${p.role}.</dd></div>
            <div><dt>team</dt><dd>${p.team}</dd></div>
            <div><dt>stack</dt><dd>${p.stack.length} tools. they’re at the bottom, falling ↓</dd></div>
          </dl>
          <ul class="cs-links" role="list">${links}</ul>
        </aside>
        <div class="cs-text cs-text--intro">${p.intro.map((t) => `<p>${marks(t)}</p>`).join('')}</div>
      </div>

      <div id="chapters"></div>

      <a class="case-next" href="/project.html?p=${next.slug}" style="--bg:${next.poster.bg}; --fg:${next.poster.ink}" data-cursor="next one →">
        <span class="case-next__label">next up</span>
        <span class="case-next__name">${next.name}<span aria-hidden="true"> →</span></span>
        <span class="case-next__line">${marks(next.caption)}</span>
      </a>
    </article>`;

  const chapters = main.querySelector('#chapters');
  p.chapters.forEach((c) => chapters.appendChild(chapter(c, p)));

  // the roll-over letters on links and buttons
  document.querySelectorAll('.roll').forEach((el) => {
    const text = el.textContent;
    el.setAttribute('aria-label', text);
    el.innerHTML = [...text].map((ch, i) => `<span class="roll__c" aria-hidden="true" style="--i:${i}">${ch}</span>`).join('');
  });

  // the logo, inlined so it can take a colour
  fetch('/logo.svg')
    .then((r) => (r.ok ? r.text() : ''))
    .then((svg) => {
      if (svg) document.getElementById('logo').innerHTML = svg;
    })
    .catch(() => {});

  initPit(document.getElementById('pit'), p.stack, { reduce });
  if (!reduce) animate();
}

// one chapter: a mono label on the left, the words on the right, and then
// whatever it has to show (fails, the diagram, screenshots) underneath
function chapter(c, p) {
  const sec = document.createElement('section');
  sec.className = 'cs-chapter';
  const words = (c.body || []).map((t) => `<p>${marks(t)}</p>`).join('');
  const nerd = c.nerd ? `<p class="cs-nerd"><span>for the curious</span>${c.nerd}</p>` : '';
  const note = c.note ? `<p class="cs-note"><svg class="cs-note__arrow" viewBox="0 0 60 40" aria-hidden="true"><path d="M56 6 C 40 4, 20 10, 12 30 M4 22 L12 31 L20 22"/></svg>${c.note}</p>` : '';
  const fails = c.fails
    ? `<ol class="cs-fails" role="list">${c.fails
        .map((f, i) => `<li class="cs-fail"><h3><span class="cs-fails__n">fail ${String(i + 1).padStart(2, '0')}</span>${marks(f.t)}</h3><p>${marks(f.b)}</p></li>`)
        .join('')}</ol>`
    : '';
  sec.innerHTML = `
    <div class="cs-row reveal">
      <h2 class="cs-label"><span>${c.label}</span></h2>
      <div class="cs-text">${words}${fails}${nerd}</div>
      ${note}
    </div>`;

  if (c.diagram) {
    const art = document.createElement('div');
    art.className = 'cs-art cs-art--diagram';
    renderDiagram(art, p.slug, { reduce });
    sec.appendChild(art);
  }
  const keys = (c.gallery || []).filter((k) => p.shots[k]);
  if (keys.length) {
    const g = document.createElement('div');
    g.className = `cs-art cs-gallery cs-gallery--${Math.min(keys.length, 3)}`;
    keys.forEach((k) => g.appendChild(shot(p.shots[k])));
    sec.appendChild(g);
  }
  return sec;
}

// a screenshot, laid down plain like an artifact on the table; if the image
// is missing the figure quietly goes away
function shot(s) {
  const fig = document.createElement('figure');
  fig.className = 'shot reveal';
  fig.innerHTML = `
    <div class="shot__frame"><img src="${s.src}" alt="${s.alt}" loading="lazy" decoding="async" /></div>
    ${s.caption ? `<figcaption>${marks(s.caption)}</figcaption>` : ''}`;
  fig.querySelector('img').addEventListener('error', () => {
    const wrap = fig.parentElement;
    fig.remove();
    if (wrap && !wrap.querySelector('.shot')) wrap.hidden = true;
  });
  return fig;
}

function animate() {
  // the cut-out drops into the banner, then the headline and the intro settle
  gsap
    .timeline({ delay: 0.1 })
    .from('.cs-banner__cut', { yPercent: 40, rotate: 10, opacity: 0, duration: 1.1, ease: 'power4.out' })
    .from('.cs-count, .cs-title', { y: 40, opacity: 0, duration: 0.8, stagger: 0.08, ease: 'power3.out' }, 0.15)
    .add(() => document.querySelector('.cs-title').classList.add('is-in'), 0.1)
    .from('.cs-title .mk-script', { clipPath: 'inset(0 100% 0 0)', duration: 0.9, ease: 'power2.inOut' }, 1.1)
    .from('.cs-row--intro .cs-side > *, .cs-text--intro p', { y: 24, opacity: 0, duration: 0.6, stagger: 0.06, ease: 'power3.out' }, 0.5);

  // the text-only banner just keeps running
  const run = document.querySelector('.cs-banner__run span');
  if (run) gsap.to(run, { xPercent: -50, ease: 'none', duration: 40, repeat: -1 });

  // chapters and screenshots ease up as you reach them
  gsap.set('.reveal', { y: 36, opacity: 0 });
  ScrollTrigger.batch('.reveal', {
    start: 'top 92%',
    once: true,
    onEnter: (els) => gsap.to(els, { y: 0, opacity: 1, duration: 0.8, stagger: 0.08, ease: 'power3.out', overwrite: true }),
  });

  document.fonts.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh());
}
