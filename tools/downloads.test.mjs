import { test } from 'node:test';
import assert from 'node:assert/strict';
import { downloadCard, updateWindowsDownload, selectWindowsRelease, windowsAssetNames, validateDockerRelease, validateDockerPlatforms, validateDockerImage, validateDockerSources } from './downloads.mjs';

const config = { repository: 'ladder99/sparkstudio', tag: '0.2.0-preview.11-docker.1', digest: `sha256:${'a'.repeat(64)}`, platforms: ['linux/amd64', 'linux/arm64'], sourceRepository: 'SparkStudioX/src', sourceCommit: 'b'.repeat(40), composePath: 'compose.yaml', guide: '/docs/docker-release/' };
const sourceBase = `https://github.com/SparkStudioX/releases/releases/download/v${config.tag}/`;
config.sourceManifest = { url: `${sourceBase}SparkStudio-Source-Manifest-${config.tag}.json`, sha256: 'd'.repeat(64) };
config.sourceArchive = { url: `${sourceBase}SparkStudio-Corresponding-Sources-${config.tag}.tar.gz`, sha256: 'e'.repeat(64), size: 100 };
const docker = `<article class="download-card" id="docker-download"><a href="https://github.com/${config.sourceRepository}/blob/${config.sourceCommit}/compose.yaml">Compose</a><a href="https://hub.docker.com/r/${config.repository}/tags?name=${config.tag}">Image</a><a href="${config.guide}">Guide</a>Container preview: ${config.tag}</article>`;
const html = `<article class="download-card" id="windows-download">0.2.0-preview.11 /download/v0.2.0-preview.11/file</article>${docker}`;
const descriptor = architecture => ({ digest: `sha256:${'c'.repeat(64)}`, platform: { os: 'linux', architecture } });
test('Windows updater preserves the independently versioned Docker card', () => {
  const updated = updateWindowsDownload(html, '0.2.0-preview.12');
  assert.match(downloadCard(updated, 'windows-download'), /0\.2\.0-preview\.12/);
  assert.equal(downloadCard(updated, 'docker-download'), docker);
});
test('newer Docker-only releases and unpublished installers do not replace the Windows preview', () => {
  const asset = version => ({ name: windowsAssetNames(version)[0], state: 'uploaded', size: 100 });
  const windows = { tag_name: 'v0.2.0-preview.11', published_at: '2026-10-01T00:00:00Z', draft: false, assets: [asset('0.2.0-preview.11')] };
  const releases = [
    windows,
    { tag_name: 'v0.2.0-preview.11-docker.1', published_at: '2026-10-02T00:00:00Z', draft: false, assets: [] },
    { tag_name: 'v0.2.0-preview.12', published_at: '2026-10-03T00:00:00Z', draft: false, assets: [{ name: 'compose.yaml', state: 'uploaded', size: 100 }] },
    { tag_name: 'v0.2.0-preview.13', published_at: '2026-10-04T00:00:00Z', draft: true, assets: [asset('0.2.0-preview.13')] },
    { tag_name: 'v0.2.0-preview.14', published_at: '2026-10-05T00:00:00Z', draft: false, assets: [{ ...asset('0.2.0-preview.14'), state: 'new' }] },
  ];
  assert.equal(selectWindowsRelease(releases), windows);
  assert.equal(selectWindowsRelease(releases.slice(1)), null);
});
test('pending or mismatched Docker publication cannot pass the website gate', () => {
  assert.ok(validateDockerRelease(config, html));
  assert.throws(() => validateDockerRelease({ ...config, digest: null }, html), /requires a verified/);
  assert.throws(() => validateDockerRelease(config, html.replace(config.sourceCommit, 'd'.repeat(40))), /links must match/);
  assert.throws(() => validateDockerRelease({ ...config, platforms: ['linux/amd64'] }, html), /exactly Linux/);
  assert.throws(() => validateDockerRelease({ ...config, sourceArchive: null }, html), /corresponding-source assets/);
});
test('corresponding-source publication requires matching complete source and archive evidence', () => {
  const file = { sha256: 'f'.repeat(64), size: 10 };
  const manifest = { sourceCommit: config.sourceCommit, containerEdition: config.tag, archive: { fileName: config.sourceArchive.url.split('/').at(-1), sha256: config.sourceArchive.sha256, size: config.sourceArchive.size }, requestedUbuntuPairs: 1, sources: [{ name: 'apt', version: '2.8.3', files: [file] }], python: { version: '3.14.7', files: [file] }, failures: [] };
  validateDockerSources(config, manifest);
  for (const changed of [{ ...manifest, sourceCommit: 'a'.repeat(40) }, { ...manifest, requestedUbuntuPairs: 2 }, { ...manifest, failures: [{}] }, { ...manifest, archive: { ...manifest.archive, size: 200 } }, { ...manifest, python: null }]) assert.throws(() => validateDockerSources(config, changed), /incomplete or differs/);
});
test('multi-platform validation permits OCI attestations and rejects duplicate or missing images', () => {
  const index = { schemaVersion: 2, manifests: [descriptor('amd64'), descriptor('arm64'), { platform: { os: 'unknown', architecture: 'unknown' } }] };
  assert.equal(validateDockerPlatforms(config, index).length, 2);
  assert.throws(() => validateDockerPlatforms(config, { ...index, manifests: [descriptor('amd64'), descriptor('amd64'), descriptor('arm64')] }), /one image/);
  assert.throws(() => validateDockerPlatforms(config, { ...index, manifests: [descriptor('amd64')] }), /one image/);
});
test('public image metadata must match source revision, edition and architecture', () => {
  const image = { architecture: 'arm64', os: 'linux', config: { Labels: { 'org.opencontainers.image.version': config.tag, 'org.opencontainers.image.revision': config.sourceCommit, 'org.opencontainers.image.source': `https://github.com/${config.sourceRepository}` } } };
  validateDockerImage(config, descriptor('arm64'), image);
  assert.throws(() => validateDockerImage(config, descriptor('amd64'), image), /labels or architecture/);
  assert.throws(() => validateDockerImage(config, descriptor('arm64'), { ...image, config: { Labels: {} } }), /labels or architecture/);
});
