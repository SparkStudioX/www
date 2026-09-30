import fs from 'node:fs';
const file = new URL('../release.json', import.meta.url);
const config = JSON.parse(fs.readFileSync(file, 'utf8'));
const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'SparkStudio-website-build', ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}) };
const response = await fetch(`https://api.github.com/repos/${config.repository}/releases?per_page=100`, { headers });
if (!response.ok) throw new Error(`Release API returned ${response.status}`);
const releases = (await response.json()).filter(release => !release.draft && /^v\d+\.\d+\.\d+-preview\.\d+$/.test(release.tag_name)).sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at));
const latest = releases[0]; if (!latest) throw new Error('No published preview release');
const version = latest.tag_name.slice(1);
const names = [`SparkStudio-Setup-${version}-windows-x64-unsigned.exe`, `SparkStudio-Setup-${version}-windows-x64-unsigned.exe.sha256`, `SparkStudio-Workshops-${version}.zip`, 'SparkStudio-Windows-Installation-Guide.md'];
for (const name of names) if (!latest.assets.some(asset => asset.name === name && asset.state === 'uploaded' && asset.size > 0)) throw new Error(`Latest preview is missing asset ${name}`);
const index = new URL('../index.html', import.meta.url); let html = fs.readFileSync(index, 'utf8');
if (process.argv.includes('--update')) {
  html = html.replace(/0\.\d+\.\d+-preview\.\d+/g, version); fs.writeFileSync(index, html);
  config.tag = latest.tag_name; fs.writeFileSync(file, JSON.stringify(config, null, 2) + '\n');
}
if (config.tag !== latest.tag_name) throw new Error(`Latest is ${latest.tag_name}; run npm run release:update (configured ${config.tag})`);
for (const name of names) if (!html.includes(`/download/${latest.tag_name}/${name}`)) throw new Error(`Homepage is missing verified release link ${name}`);
const versions = new Set(html.match(/\d+\.\d+\.\d+-preview\.\d+/g));
if (versions.size !== 1 || !versions.has(version) || !html.includes(`/tag/${latest.tag_name}`)) throw new Error('Homepage versions and release notes must match latest preview');
console.log(`Verified latest published preview ${latest.tag_name} and all four download assets.`);
