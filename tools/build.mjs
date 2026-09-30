import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { escape as e, parseDocs } from './docs.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const config = JSON.parse(fs.readFileSync(path.join(root, 'docs-source.json'), 'utf8'));
if (config.repository !== 'SparkStudioX/src' || !/^[0-9a-f]{40}$/.test(config.ref)) throw new Error('Documentation requires a pinned source commit');
const args = process.argv.slice(2);
const sourcePath = args[0] === '--source' ? args[1] : args[0];
if ((args[0] === '--source' && !sourcePath) || args.length > (args[0] === '--source' ? 2 : 1)) throw new Error('Usage: npm run build -- SOURCE_CHECKOUT');
const source = path.resolve(root, sourcePath || '../source');
const git = args => execFileSync('git', ['-c', `safe.directory=${source.replaceAll('\\', '/')}`, '-C', source, ...args], { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
const paths = new Set(git(['ls-tree', '-r', '--name-only', config.ref]).trim().split('\n'));
const readSource = file => paths.has(file) ? git(['show', `${config.ref}:${file}`]) : null;
const files = new Map([...paths].filter(p => /^docs\/architecture\/[^/]+\.md$/.test(p)).map(p => [path.basename(p), readSource(p)]));
const { docs, groups, ordered } = parseDocs(files, readSource, config);
const dist = path.join(root, 'dist');
if (path.dirname(dist) !== path.resolve(root)) throw new Error('Output must remain inside website repository');
fs.rmSync(dist, { recursive: true, force: true }); fs.mkdirSync(dist, { recursive: true });
for (const file of ['index.html', 'styles.css', 'script.js', 'favicon.svg', 'CNAME', 'robots.txt', '.nojekyll', 'assets']) fs.cpSync(path.join(root, file), path.join(dist, file), { recursive: true });
fs.cpSync(path.join(root, 'docs-ui'), path.join(dist, 'docs-assets'), { recursive: true });
const homepage = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const header = homepage.match(/  <header class="site-header">[\s\S]*?<\/header>/)[0]
  .replace('href="#"', 'href="/"').replaceAll('href="#product"', 'href="/#product"').replaceAll('href="#capabilities"', 'href="/#capabilities"').replaceAll('href="#download"', 'href="/#download"').replaceAll('src="./favicon.svg"', 'src="/favicon.svg"').replace('href="/docs/"', 'href="/docs/" aria-current="page"');
const symbols = homepage.match(/  <svg class="icon-definitions"[\s\S]*?<\/svg>/)[0];
const theme = homepage.match(/  <script>[\s\S]*?<\/script>/)[0];
const search = [];
for (const doc of docs.values()) {
  const selected = ordered.findIndex(item => item.file === doc.file);
  const nav = `<a class="docs-overview${doc.file === 'README.md' ? ' active' : ''}" href="/docs/"${doc.file === 'README.md' ? ' aria-current="page"' : ''}>Documentation overview</a>` + groups.map(group => `<section class="nav-group"><h2>${e(group.title)}</h2><ul>${group.items.map(item => `<li><a href="${item.url}"${item.file === doc.file ? ' class="active" aria-current="page"' : ''}>${e(item.title)}</a></li>`).join('')}</ul></section>`).join('');
  const pager = (item, label) => item ? `<a href="${item.url}"><small>${label}</small><span>${e(item.title)} ${label === 'Next' ? '→' : ''}</span></a>` : '<span></span>';
  const toc = doc.headings.filter(h => h.level === 2).map(h => `<a href="#${e(h.id)}">${e(h.title)}</a>`).join('');
  const html = `<!doctype html>
<html lang="en" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light dark"><meta name="theme-color" content="#f7f8fc">
<title>${e(doc.title)} · SparkStudio Docs</title><meta name="description" content="${e(doc.title)} — SparkStudio development documentation."><link rel="canonical" href="https://sparkstudiox.com${doc.url}"><meta property="og:title" content="${e(doc.title)} · SparkStudio Docs"><meta property="og:type" content="article"><meta property="og:url" content="https://sparkstudiox.com${doc.url}"><meta property="og:image" content="https://sparkstudiox.com/assets/sparkstudio-icon.png"><link rel="icon" href="/favicon.svg" type="image/svg+xml">${theme}
<link rel="stylesheet" href="/styles.css?v=docs-1"><link rel="stylesheet" href="/docs-assets/docs.css?v=1"><script src="/script.js?v=docs-1" defer></script><script src="/docs-assets/docs.js?v=1" defer></script></head>
<body class="docs-page"><a class="skip-link" href="#main">Skip to content</a>${symbols}${header}
<div class="docs-toolbar"><button id="docs-menu" aria-controls="docs-sidebar" aria-expanded="false">☰ Browse docs</button><span>Development docs</span></div><button class="drawer-shade" aria-label="Close documentation navigation" hidden></button>
<div class="docs-layout"><aside id="docs-sidebar" class="docs-sidebar" aria-label="Documentation"><div class="sidebar-top"><a href="/docs/" class="docs-brand">Documentation</a><button id="docs-close" aria-label="Close documentation navigation">×</button></div><label class="search-label" for="docs-search">Search docs</label><input id="docs-search" type="search" placeholder="Find a topic…" autocomplete="off"><p id="search-status" role="status" aria-live="polite"></p><ul id="search-results" hidden></ul><nav id="docs-nav" aria-label="Documentation topics">${nav}</nav></aside>
<main id="main" class="docs-main"><div class="docs-context"><span class="docs-badge">Development docs</span><span>May include features newer than the installer.</span></div><article class="markdown">${doc.html}</article><nav class="docs-pager" aria-label="Adjacent pages">${pager(ordered[selected - 1], 'Previous')}${pager(ordered[selected + 1], 'Next')}</nav><footer class="docs-footer"><a href="https://github.com/${config.repository}/blob/${config.ref}/docs/architecture/${doc.file}">View Markdown source ↗</a><span>Docs revision <a href="https://github.com/${config.repository}/commit/${config.ref}">${config.ref.slice(0, 7)}</a> · © <span id="year">2026</span> SparkStudio</span></footer></main>
<aside class="docs-toc" aria-label="On this page"><p>On this page</p>${toc}</aside></div></body></html>`;
  const target = path.join(dist, doc.url, 'index.html'); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, html);
  search.push({ title: doc.title, url: doc.url, text: doc.tokens.filter(t => t.type === 'inline').map(t => t.content).join(' ').replace(/[`*#]/g, '') });
}
fs.writeFileSync(path.join(dist, 'docs-assets/search.json'), JSON.stringify(search));
fs.writeFileSync(path.join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['/', ...ordered.map(item => item.url)].map(url => `<url><loc>https://sparkstudiox.com${url}</loc></url>`).join('')}</urlset>\n`);
fs.writeFileSync(path.join(dist, '404.html'), '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Page not found · SparkStudio</title><link rel="stylesheet" href="/styles.css"><main class="container"><h1>Page not found</h1><p><a href="/docs/">Browse documentation</a> or <a href="/">return home</a>.</p></main></html>');
console.log(`Built homepage and ${docs.size} documentation pages from ${config.ref}.`);
