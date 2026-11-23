// What every page shares: the folder tabs down the right edge, the footer,
// the flower cursor, the logo in the corner and the paper plane.
// Each page's own script (main.js, me.js, builds.js) calls initSite once,
// after setting up its own sections.

import { initCursor } from './cursor.js';
import { initFooter } from './footer.js';
import { initFolders } from './folders.js';

export function initSite({ reduce = false, cursor = true, logo = false } = {}) {
  if (cursor) initCursor({ reduce });

  // the landing page draws its own logo in; other pages just show it
  if (logo) {
    const slot = document.getElementById('logo');
    fetch('/logo.svg')
      .then((r) => (r.ok ? r.text() : ''))
      .then((svg) => {
        if (svg && slot) slot.innerHTML = svg;
      })
      .catch(() => {});
  }

  initFooter({ reduce });
  initFolders({ reduce });

  // the paper plane needs three.js; fetch it after the page is up so nothing waits on it
  import('./plane.js').then((m) => m.initPlane({ reduce }));
}
