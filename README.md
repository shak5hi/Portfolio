# shakshi — portfolio

A hand-drawn, beach-themed personal site. It opens by inking a beach line by line, then a wave
rises, curls, crashes over the screen and drains away to reveal the page.

## Run it

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build in dist/
npm run preview   # serve the build
```

Dev-only helpers: `?nointro` skips the intro, `?slow=0.25` plays every animation at quarter speed.

## Stack

- **Vite**: dev server and build
- **GSAP 3.13**: DrawSVG (inking the beach), SplitText (headline entrances), ScrollTrigger (reveals, pinned shoreline walk)
- **Lenis**: smooth scrolling, synced to ScrollTrigger
- **Canvas 2D**: the wave, its curling lip, the spray and the droplets on the glass

## Where things live

| File | What it is |
| --- | --- |
| `index.html` | All the copy: hero, about, projects, shoreline (experience), FAQ, contact |
| `src/scene.js` | The beach drawing, a seeded SVG used by the intro and the hero card |
| `src/intro.js` | Draws the beach stroke by stroke, then hands over to the wave |
| `src/wave.js` | The canvas wave: swell, curl, crash, droplets, drain |
| `src/motion.js` | Everything that moves after the intro |
| `src/doodles.js` | The ink postcards for each project |
| `src/styles.css` | Design tokens (colours, type, spacing) at the top |
| `src/main.js` | Wires it together, plus the live clock (`TIME_ZONE`) |

## Before you publish

- Swap the sample projects, timeline entries and skills in `index.html` for your real ones, and
  point each project link at its case study or repo.
- Replace the drawn portrait in the about section with a real photo (there's a comment showing where).
- Fill in the LinkedIn, GitHub and Instagram URLs in the contact section.
- Check `TIME_ZONE` in `src/main.js`.
- The bottle form opens the visitor's email app with the note pre-filled (no backend needed).
  Change the address in `src/motion.js` if you want messages to go somewhere else.

Reduced motion is respected: the intro is skipped and nothing travels.
