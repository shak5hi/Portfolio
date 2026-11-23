// "The Builds" page (builds.html): its own page, opened by the third folder
// tab. It opens on a wall of BUILD, with "BREAK IT. FIX IT. SHIP IT ANYWAY." in blue, then
// a card per project, each opening its case study.

import './style.css';
import { initEverything } from './everything.js';
import { initBuildList } from './buildlist.js';
import { initSite } from './site.js';

const reduce = document.documentElement.classList.contains('no-motion');

initEverything({ reduce });
initBuildList({ reduce });
initSite({ reduce, logo: true });
