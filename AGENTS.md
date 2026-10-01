# Website release responsibilities

This repository owns the public website only. Keep application source, installers, runtime data and private references out of its committed files.

Follow the [standard preview release cycle](https://github.com/SparkStudioX/src/blob/main/docs/architecture/RELEASE_PROCESS.md) when shipping an application release. A release includes building and verifying a new Windows preview installer and matching workshops in the application repository, publishing the verified assets to SparkStudioX/releases, then updating this website's downloads and hosted docs.

After release assets are public, run `npm run release:update` and `npm run release:check`; review that the intended preview is selected. Update `docs-source.json` to the reviewed full source/docs commit, reconcile any unpublished-source exceptions, run `npm test` and `npm run build`, and check the browser layout. Push the reviewed website changes, require a successful Pages deployment, and verify the live download and documentation pages before reporting the release complete. Documentation/website-only requests can publish independently without a new installer.

For a request explicitly limited to a Docker release, follow [Docker deployment and publication](https://github.com/SparkStudioX/src/blob/main/docs/architecture/DOCKER_RELEASE.md). Publish and verify the Docker images before updating `docker-release.json`, the Docker download card and the reviewed documentation pin. Run `npm run docker:check` in addition to the website tests/build and existing Windows release check; require successful Pages deployment and verify the live Compose/image/guide links. Docker editions have independent publication metadata and do not require rebuilding or changing the existing Windows installer/workshop assets. The Windows updater must select published releases containing their matching Windows installer, even when a Docker-only GitHub prerelease is newer.

Architecture Markdown remains authoritative in SparkStudioX/src. Do not hand-edit generated `dist/` or copy live gateway/private reference content into docs or screenshots.
