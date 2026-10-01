import fs from 'node:fs';
import { downloadCard, updateWindowsDownload, selectWindowsRelease, windowsAssetNames } from './downloads.mjs';
const file = new URL('../release.json', import.meta.url);
const config = JSON.parse(fs.readFileSync(file, 'utf8'));
const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'SparkStudio-website-build', ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}) };
const response = await fetch(`https://api.github.com/repos/${config.repository}/releases?per_page=100`, { headers });
if (!response.ok) throw new Error(`Release API returned ${response.status}`);
const latest = selectWindowsRelease(await response.json());
if (!latest) throw new Error('No published Windows preview with its matching installer');
const version = latest.tag_name.slice(1);
const names = windowsAssetNames(version);
for (const name of names) if (!latest.assets.some(asset => asset.name === name && asset.state === 'uploaded' && asset.size > 0)) throw new Error(`Latest preview is missing asset ${name}`);
const index = new URL('../index.html', import.meta.url); let html = fs.readFileSync(index, 'utf8');
if (process.argv.includes('--update')) {
  html = updateWindowsDownload(html, version); fs.writeFileSync(index, html);
  config.tag = latest.tag_name; fs.writeFileSync(file, JSON.stringify(config, null, 2) + '\n');
}
if (config.tag !== latest.tag_name) throw new Error(`Latest is ${latest.tag_name}; run npm run release:update (configured ${config.tag})`);
const card = downloadCard(html, 'windows-download');
for (const name of names) if (!card.includes(`/download/${latest.tag_name}/${name}`)) throw new Error(`Homepage is missing verified release link ${name}`);
const versions = new Set(card.match(/\d+\.\d+\.\d+-preview\.\d+/g));
if (versions.size !== 1 || !versions.has(version) || !card.includes(`/tag/${latest.tag_name}`)) throw new Error('Windows homepage versions and release notes must match latest preview');
console.log(`Verified latest published preview ${latest.tag_name} and all four download assets.`);
