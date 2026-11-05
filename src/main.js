import './styles.css';
import { beachScene } from './scene.js';
import { doodles } from './doodles.js';
import { playIntro } from './intro.js';
import * as motion from './motion.js';

// Drawings
const heroCard = document.querySelector('[data-scene="hero"]');
heroCard.insertAdjacentHTML('afterbegin', beachScene({ id: 'hero-beach', seed: 7 }));

document.querySelectorAll('[data-doodle]').forEach((el) => {
  el.innerHTML = doodles[el.dataset.doodle] ?? '';
});

// Marquee content (duplicated so the loop is seamless)
const phrases = ['salt water fixes most things', 'so does clean code', 'ship it, then go to the beach', 'chai is a personality'];
const sun = '<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7" fill="#cf9550"/></svg>';
const run = phrases.map((p) => `<span>${p}${sun}</span>`).join('');
document.getElementById('marquee').innerHTML = run + run;

// Motion: set the hero up hidden, play the intro, and bring the hero in
// the moment the wave uncovers the page.
document.fonts.ready.then(() => {
  motion.initScroll();
  motion.prepareHero();
  motion.marquee();
  motion.reveals();
  motion.shoreline();
  motion.faq();
  motion.bottle();
  motion.footer();
  motion.liveBeach();
  if (!document.documentElement.classList.contains('no-intro')) motion.pauseScroll();
  playIntro({
    onReveal() {
      motion.resumeScroll();
      motion.playHero();
      motion.ScrollTrigger.refresh();
    },
  });
});

// Message in a bottle: count characters
const note = document.getElementById('note');
const count = document.getElementById('note-count');
note.addEventListener('input', () => {
  count.textContent = `${note.value.length} / 600 characters`;
});


