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

## Edit

- Preloader words and the ribbon text: top of `src/main.js`.
- Hero words and the typed lines: `index.html`.
- Colours and fonts: top of `src/style.css`.
- Logo: open `/sign.html` while `npm run dev` is running, write your name, save.

Dev-only helpers: `?nointro` skips the preloader, `?slow=0.25` plays everything at quarter speed.
