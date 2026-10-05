import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

const args = process.argv.slice(2);
const option = (name, fallback) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : fallback; };
const port = Number(option('--port', '5173'));
const host = option('--host', '0.0.0.0');
const root = resolve('dist');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  try {
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
    const url = new URL(req.url, 'http://localhost');
    let path = resolve(root, '.' + decodeURIComponent(url.pathname));
    if (path !== root && !path.startsWith(root + sep)) { res.writeHead(403); res.end(); return; }
    if (url.pathname === '/__qa') path = resolve('tests/browser-preview.html');
    if ((await stat(path)).isDirectory()) path = resolve(path, 'index.html');
    const size = (await stat(path)).size;
    res.writeHead(200, { 'Content-Type': mime[extname(path)] || 'application/octet-stream', 'Content-Length': size, 'Cache-Control': 'no-store' });
    if (req.method === 'HEAD') res.end(); else createReadStream(path).pipe(res);
  } catch { res.writeHead(404); res.end('Not found'); }
});
server.listen(port, host, () => console.log(`War table preview: http://${host}:${port}`));
