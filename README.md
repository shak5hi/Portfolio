# shakshi — portfolio

Personal portfolio. Right now it is the hero only: a preloader of big words and photo flashes
that collapses into a line, then HELLO / MEET / SHAKSHI around the photo, with hand-drawn ink,
typed lines and the handwritten logo writing itself.

## Run it

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build in dist/
npm run preview   # serve the build
```

## Pages

- `index.html`: the landing page, the first folder tab ("Who's this?").
- `me.html`: "Me, Basically", its own page, opened by the second tab.
- `project.html?p=<slug>`: a case study.

## Edit

- Preloader words and the ribbon text: top of `src/main.js`.
- Hero words and the typed lines: `index.html`.
- Colours and fonts: top of `src/style.css`.
- Projects (posters + case studies): `src/work/projects.js`. Each case study is
  `project.html?p=<slug>`. Diagrams live in `src/work/diagrams.js`, stack icons in
  `src/work/stack.js`, screenshots in `public/work/<slug>/`.
- Logo: open `/sign.html` while `npm run dev` is running, write your name, save.

Dev-only helpers: `?nointro` skips the preloader, `?slow=0.25` plays everything at quarter speed.
