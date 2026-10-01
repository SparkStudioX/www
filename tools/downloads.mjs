export function downloadCard(html, id) {
  const pattern = new RegExp(`<article class="download-card" id="${id}">[\\s\\S]*?</article>`);
  const card = html.match(pattern)?.[0];
  if (!card) throw new Error(`Homepage is missing the ${id} card.`);
  return card;
}

export function updateWindowsDownload(html, version) {
  const card = downloadCard(html, 'windows-download');
  return html.replace(card, card.replace(/\d+\.\d+\.\d+-preview\.\d+/g, version));
}

export function windowsAssetNames(version) {
  return [`SparkStudio-Setup-${version}-windows-x64-unsigned.exe`, `SparkStudio-Setup-${version}-windows-x64-unsigned.exe.sha256`, `SparkStudio-Workshops-${version}.zip`, 'SparkStudio-Windows-Installation-Guide.md'];
}

export function selectWindowsRelease(releases) {
  return releases.filter(release => {
    if (release.draft || !/^v\d+\.\d+\.\d+-preview\.\d+$/.test(release.tag_name ?? '')) return false;
    const installer = windowsAssetNames(release.tag_name.slice(1))[0];
    return release.assets?.some(asset => asset.name === installer && asset.state === 'uploaded' && asset.size > 0);
  }).sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at))[0] ?? null;
}

export function validateDockerRelease(config, html) {
  if (config.repository !== 'ladder99/sparkstudio' || !/^\d+\.\d+\.\d+-preview\.\d+-docker\.\d+$/.test(config.tag ?? '') || !/^sha256:[0-9a-f]{64}$/.test(config.digest ?? '') || config.sourceRepository !== 'SparkStudioX/src' || !/^[0-9a-f]{40}$/.test(config.sourceCommit ?? '') || config.composePath !== 'compose.yaml' || config.guide !== '/docs/docker-release/') throw new Error('Docker publication requires a verified image digest, source commit, explicit edition and reviewed repository links.');
  if (JSON.stringify([...config.platforms ?? []].sort()) !== JSON.stringify(['linux/amd64', 'linux/arm64'])) throw new Error('Docker publication must include exactly Linux AMD64 and ARM64.');
  const releaseBase = `https://github.com/SparkStudioX/releases/releases/download/v${config.tag}/`;
  if (config.sourceManifest?.url !== `${releaseBase}SparkStudio-Source-Manifest-${config.tag}.json` || !/^[0-9a-f]{64}$/.test(config.sourceManifest?.sha256 ?? '') || config.sourceArchive?.url !== `${releaseBase}SparkStudio-Corresponding-Sources-${config.tag}.tar.gz` || !/^[0-9a-f]{64}$/.test(config.sourceArchive?.sha256 ?? '') || !Number.isSafeInteger(config.sourceArchive?.size) || config.sourceArchive.size <= 0) throw new Error('Docker publication requires verified public corresponding-source assets.');
  const card = downloadCard(html, 'docker-download');
  const compose = `https://github.com/${config.sourceRepository}/blob/${config.sourceCommit}/${config.composePath}`;
  const image = `https://hub.docker.com/r/${config.repository}/tags?name=${config.tag}`;
  if (!card.includes(`href="${compose}"`) || !card.includes(`href="${image}"`) || !card.includes(`href="${config.guide}"`) || !card.includes(`Container preview: ${config.tag}`) || /Coming soon|DOCKER_SOURCE_COMMIT/.test(card)) throw new Error('Docker homepage links must match the verified container edition and source commit.');
  return { compose, image };
}

export function validateDockerSources(config, manifest) {
  const archiveName = config.sourceArchive.url.split('/').at(-1);
  const identity = manifest.sourceCommit === config.sourceCommit && manifest.containerEdition === config.tag;
  const archive = manifest.archive?.fileName === archiveName && manifest.archive?.sha256 === config.sourceArchive.sha256 && manifest.archive?.size === config.sourceArchive.size;
  const sources = manifest.sources;
  const complete = Array.isArray(sources) && sources.length > 0 && sources.length === manifest.requestedUbuntuPairs && new Set(sources.map(item => `${item.name}/${item.version}`)).size === sources.length && sources.every(item => item.name && item.version && Array.isArray(item.files) && item.files.length > 0 && item.files.every(file => /^[0-9a-f]{64}$/.test(file.sha256 ?? '') && Number.isSafeInteger(file.size) && file.size > 0));
  const python = manifest.python?.version === '3.14.7' && manifest.python.files?.some(file => /^[0-9a-f]{64}$/.test(file.sha256 ?? '') && file.size > 0);
  if (!identity || !archive || !complete || !python || !Array.isArray(manifest.failures) || manifest.failures.length) throw new Error('Public corresponding-source manifest is incomplete or differs from the reviewed Docker release.');
}

export function validateDockerPlatforms(config, index) {
  if (index.schemaVersion !== 2 || !Array.isArray(index.manifests)) throw new Error('The Docker tag must resolve to a multi-platform image index.');
  const images = index.manifests.filter(item => item.platform?.os === 'linux' && ['amd64', 'arm64'].includes(item.platform.architecture));
  const platforms = images.map(item => `${item.platform.os}/${item.platform.architecture}`).sort();
  if (JSON.stringify(platforms) !== JSON.stringify([...config.platforms].sort()) || images.some(item => !/^sha256:[0-9a-f]{64}$/.test(item.digest ?? ''))) throw new Error('The public Docker index must contain one image for each supported architecture.');
  return images;
}

export function validateDockerImage(config, descriptor, image) {
  const labels = image.config?.Labels ?? {};
  if (image.os !== descriptor.platform.os || image.architecture !== descriptor.platform.architecture || labels['org.opencontainers.image.version'] !== config.tag || labels['org.opencontainers.image.revision'] !== config.sourceCommit || labels['org.opencontainers.image.source'] !== `https://github.com/${config.sourceRepository}`) throw new Error('Public Docker image labels or architecture differ from the reviewed release.');
}
