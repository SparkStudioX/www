import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { validateDockerRelease, validateDockerPlatforms, validateDockerImage, validateDockerSources } from './downloads.mjs';

const config = JSON.parse(fs.readFileSync(new URL('../docker-release.json', import.meta.url), 'utf8'));
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
validateDockerRelease(config, html);
const timeout = () => AbortSignal.timeout(60000);
const tokenResponse = await fetch(`https://auth.docker.io/token?service=registry.docker.io&scope=repository:${config.repository}:pull`, { signal: timeout() });
if (!tokenResponse.ok) throw new Error(`Docker Hub anonymous pull authorization returned ${tokenResponse.status}.`);
const token = (await tokenResponse.json()).token;
if (typeof token !== 'string' || !token) throw new Error('Docker Hub did not return an anonymous pull token.');
const accept = ['application/vnd.oci.image.index.v1+json', 'application/vnd.docker.distribution.manifest.list.v2+json', 'application/vnd.oci.image.manifest.v1+json', 'application/vnd.docker.distribution.manifest.v2+json'].join(', ');

async function registryJson(kind, reference, digest) {
  const response = await fetch(`https://registry-1.docker.io/v2/${config.repository}/${kind}/${reference}`, { headers: { Authorization: `Bearer ${token}`, Accept: accept }, signal: timeout() });
  if (!response.ok) throw new Error(`Public Docker ${kind} request returned ${response.status}.`);
  if (Number(response.headers.get('content-length') ?? 0) > 2 * 1024 * 1024) throw new Error('Docker release metadata exceeds the expected bound.');
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > 2 * 1024 * 1024 || `sha256:${createHash('sha256').update(bytes).digest('hex')}` !== digest) throw new Error('Public Docker release metadata differs from its reviewed digest.');
  return JSON.parse(bytes.toString('utf8'));
}

const index = await registryJson('manifests', config.tag, config.digest);
for (const descriptor of validateDockerPlatforms(config, index)) {
  const manifest = await registryJson('manifests', descriptor.digest, descriptor.digest);
  if (!/^sha256:[0-9a-f]{64}$/.test(manifest.config?.digest ?? '')) throw new Error('Docker image configuration digest is missing.');
  validateDockerImage(config, descriptor, await registryJson('blobs', manifest.config.digest, manifest.config.digest));
}
const composeResponse = await fetch(`https://raw.githubusercontent.com/${config.sourceRepository}/${config.sourceCommit}/${config.composePath}`, { signal: timeout() });
if (!composeResponse.ok) throw new Error(`Public example Compose returned ${composeResponse.status}.`);
if (!(await composeResponse.text()).includes(`${config.repository}:${config.tag}`)) throw new Error('The public example Compose does not reference this Docker edition.');
const sourceResponse = await fetch(config.sourceManifest.url, { signal: timeout() });
if (!sourceResponse.ok) throw new Error(`Public corresponding-source manifest returned ${sourceResponse.status}.`);
if (Number(sourceResponse.headers.get('content-length') ?? 0) > 2 * 1024 * 1024) throw new Error('Corresponding-source manifest exceeds the expected bound.');
const sourceBytes = Buffer.from(await sourceResponse.arrayBuffer());
if (sourceBytes.length > 2 * 1024 * 1024 || createHash('sha256').update(sourceBytes).digest('hex') !== config.sourceManifest.sha256) throw new Error('Public corresponding-source manifest differs from its reviewed checksum.');
validateDockerSources(config, JSON.parse(sourceBytes.toString('utf8')));
const archiveResponse = await fetch(config.sourceArchive.url, { method: 'HEAD', signal: timeout() });
if (!archiveResponse.ok || Number(archiveResponse.headers.get('content-length')) !== config.sourceArchive.size) throw new Error('Public corresponding-source archive is missing or its size differs from the reviewed asset.');
console.log(`Verified public Docker ${config.repository}:${config.tag} at ${config.digest}, both Linux architectures, source labels, example Compose and corresponding-source availability.`);
