import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve('dist');
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.xml': 'application/xml' };
http.createServer((req, res) => {
  try {
    let target = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
    if (target !== root && !target.startsWith(root + path.sep)) throw new Error('Invalid path');
    if (fs.statSync(target).isDirectory()) target = path.join(target, 'index.html');
    res.writeHead(200, { 'Content-Type': types[path.extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); fs.createReadStream(target).pipe(res);
  } catch { res.writeHead(404); res.end('Not found'); }
}).listen(4174, '127.0.0.1', () => console.log('Website preview: http://127.0.0.1:4174'));
