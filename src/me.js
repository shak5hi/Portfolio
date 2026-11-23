// The "Me, Basically" page (me.html): its own page, opened by the second
// folder tab. Still being written.

import './style.css';
import { initSite } from './site.js';

const reduce = document.documentElement.classList.contains('no-motion');

initSite({ reduce, logo: true });
