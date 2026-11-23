import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

// Read a JSON request body (capped at 4 MB).
function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 4_000_000) req.destroy(new Error('too large'));
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function reply(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

// Dev-only endpoints used by the drawing tools:
//   /sign.html  -> POST /__save-logo     -> public/logo.svg + src/logo-strokes.json
//   /draw.html  -> POST /__save-drawing  -> public/drawings/<name>.svg + src/drawings/<name>.json
function saveTools() {
  return {
    name: 'save-tools',
    apply: 'serve',
    configureServer(server) {
      const root = server.config.root;

      server.middlewares.use('/__save-logo', async (req, res) => {
        if (req.method !== 'POST') return reply(res, 405, { ok: false });
        try {
          const { svg, strokes } = await readJson(req);
          if (typeof svg !== 'string' || !svg.startsWith('<svg')) throw new Error('bad svg');
          fs.writeFileSync(path.join(root, 'public', 'logo.svg'), svg);
          fs.writeFileSync(path.join(root, 'src', 'logo-strokes.json'), JSON.stringify(strokes));
          reply(res, 200, { ok: true });
        } catch (e) {
          reply(res, 400, { ok: false, error: String(e.message || e) });
        }
      });

      server.middlewares.use('/__save-drawing', async (req, res) => {
        if (req.method !== 'POST') return reply(res, 405, { ok: false });
        try {
          const { name, svg, data } = await readJson(req);
          const slug = String(name || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40);
          if (!slug) throw new Error('needs a name');
          if (typeof svg !== 'string' || !svg.startsWith('<svg')) throw new Error('bad svg');
          const pub = path.join(root, 'public', 'drawings');
          const src = path.join(root, 'src', 'drawings');
          fs.mkdirSync(pub, { recursive: true });
          fs.mkdirSync(src, { recursive: true });
          fs.writeFileSync(path.join(pub, `${slug}.svg`), svg);
          fs.writeFileSync(path.join(src, `${slug}.json`), JSON.stringify(data));
          reply(res, 200, { ok: true, file: `public/drawings/${slug}.svg` });
        } catch (e) {
          reply(res, 400, { ok: false, error: String(e.message || e) });
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [saveTools()],
  build: {
    rollupOptions: {
      // every page: home (who's this?), me (me, basically), builds (the builds), and the case studies (project.html?p=<slug>)
      input: {
        main: path.resolve(import.meta.dirname, 'index.html'),
        project: path.resolve(import.meta.dirname, 'project.html'),
        me: path.resolve(import.meta.dirname, 'me.html'),
        builds: path.resolve(import.meta.dirname, 'builds.html'),
      },
    },
  },
});
