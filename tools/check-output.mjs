import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve('dist');
const pages = fs.readdirSync(path.join(root, 'docs'), { recursive: true }).filter(file => file.endsWith('.html')).map(file => path.join(root, 'docs', file));
pages.push(path.join(root, 'index.html'));
let links = 0;
for (const file of pages) {
  const html = fs.readFileSync(file, 'utf8');
  if (!html.includes('id="main"')) throw new Error(`No main landmark: ${file}`);
  for (const [, raw] of html.matchAll(/(?:href|src)="([^"]*)"/g)) {
    if (/^(?:https?:|mailto:|data:)/.test(raw) || !raw) continue;
    const url = new URL(raw.replaceAll('&amp;', '&'), 'https://sparkstudiox.com/' + path.relative(root, file).replaceAll('\\', '/'));
    const local = path.join(root, decodeURIComponent(url.pathname));
    const target = url.pathname.endsWith('/') ? path.join(local, 'index.html') : local;
    if (!fs.existsSync(target)) throw new Error(`Missing output link ${raw} in ${file}`);
    if (url.hash) {
      const id = decodeURIComponent(url.hash.slice(1));
      if (!fs.readFileSync(target, 'utf8').includes(`id="${id}"`)) throw new Error(`Missing output anchor ${raw} in ${file}`);
    }
    links++;
  }
}
console.log(`Checked ${pages.length} pages and ${links} local links, anchors and assets.`);
