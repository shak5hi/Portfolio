import './styles.css';
import { beachScene } from './scene.js';
import { doodles } from './doodles.js';
import { playIntro } from './intro.js';

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

// Message in a bottle: count characters
const note = document.getElementById('note');
const count = document.getElementById('note-count');
note.addEventListener('input', () => {
  count.textContent = `${note.value.length} / 600 characters`;
});

playIntro();

