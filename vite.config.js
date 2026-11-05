import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

// Dev-only endpoint used by /sign.html: saves the handwritten logo into the
// project (public/logo.svg for the site, src/logo-strokes.json as the raw
// strokes so it can be re-rendered or re-animated later).
function saveLogo() {
  return {
    name: 'save-logo',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__save-logo', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          return res.end();
        }
        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
          if (body.length > 2_000_000) req.destroy();
        });
        req.on('end', () => {
          try {
            const { svg, strokes } = JSON.parse(body);
            if (typeof svg !== 'string' || !svg.startsWith('<svg')) throw new Error('bad svg');
            const root = server.config.root;
            fs.writeFileSync(path.join(root, 'public', 'logo.svg'), svg);
            fs.writeFileSync(path.join(root, 'src', 'logo-strokes.json'), JSON.stringify(strokes));
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true }));
          } catch (e) {
            res.statusCode = 400;
            res.end(JSON.stringify({ ok: false, error: String(e.message || e) }));
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [saveLogo()],
});
