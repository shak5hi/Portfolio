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



// A live clock in Shakshi's time zone, with a guess at what she's up to.
const TIME_ZONE = 'Asia/Kolkata'; // change if you move
const doing = [
  [0, 'asleep and dreaming of the sea'],
  [6, 'making the first chai'],
  [9, 'deep in some code'],
  [13, 'out for lunch'],
  [14, 'shipping things'],
  [18, 'out for an evening walk'],
  [20, 'sketching in my notebook'],
  [23, 'pretending to sleep'],
];
function tick() {
  const now = new Date();
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, hour: 'numeric', minute: 'numeric', hourCycle: 'h23' })
      .formatToParts(now)
      .map((p) => [p.type, p.value])
  );
  const h = Number(parts.hour);
  const m = Number(parts.minute);
  document.getElementById('clock-time').textContent = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    hour: 'numeric',
    minute: '2-digit',
  })
    .format(now)
    .toLowerCase();
  document.getElementById('clock-doing').textContent = doing.filter(([from]) => h >= from).pop()[1];
  document.getElementById('clock-h').setAttribute('transform', `rotate(${(h % 12) * 30 + m / 2} 36 36)`);
  document.getElementById('clock-m').setAttribute('transform', `rotate(${m * 6} 36 36)`);
}
tick();
setInterval(tick, 30000);
