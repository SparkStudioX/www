# SparkStudio website

Static landing page and documentation for [sparkstudiox.com](https://sparkstudiox.com). Application source belongs in [SparkStudioX/src](https://github.com/SparkStudioX/src); installers and workshop bundles belong in [SparkStudioX/releases](https://github.com/SparkStudioX/releases/releases).

## Build and preview

Use Node.js 22 or newer. With the application repository in `../source`:

```sh
npm ci --ignore-scripts
npm test
npm run release:check
npm run docker:check
npm run build
npm run preview
```

Open `http://127.0.0.1:4174`. Preview serves `dist/`, not the repository root. To use another source checkout, run `npm run build -- /path/to/src`. That checkout must contain the commit recorded in `docs-source.json`; fetch it if necessary. The build reads Git blobs at that commit and ignores unstaged or newer worktree content. A fresh website checkout needs a source checkout too; CI obtains it automatically.

## Documentation

`docs-source.json` pins the reviewed source commit. Every Markdown file in that commit's `docs/architecture/` becomes a page under `/docs/`. `README.md` supplies the grouped navigation and overview. Other filenames become lowercase hyphenated URLs, such as `TEMPLATE_PARAMETER_BINDINGS.md` → `/docs/template-parameter-bindings/`.

The build uses markdown-it with raw HTML disabled and local highlight.js. It rewrites documentation links, checks page and heading targets, validates complete navigation coverage, and points other source links to the same GitHub revision. No Markdown is fetched or interpreted at runtime. Generated output and npm dependencies are ignored by Git.

The reader includes full-text search over all guides, active-page navigation, heading permalinks, highlighted/copyable code, scrolling tables, adjacent-page links, source provenance, light/dark/system appearance and a keyboard-accessible mobile drawer. Search runs in the visitor's browser. Desktop content is usable without JavaScript; mobile topic navigation requires JavaScript. There are no external fonts, analytics, tracking or gateway connections.

The collection is **Development docs**, pinned to the reviewed source and documentation commit recorded in `docs-source.json`. All linked workshop sources are published at this pin; no unpublished-source exceptions are needed. Unexpected missing sources fail the build. Keep the pin and compatibility guidance deliberate when newer development work is published.

The **Data source setup** navigation group contains [MQTT](https://sparkstudiox.com/docs/mqtt-setup/), [MTConnect](https://sparkstudiox.com/docs/mtconnect-setup/) and [i3X](https://sparkstudiox.com/docs/i3x-setup/) user walkthroughs. They cover endpoint/authentication setup, connection tests, browsing, both tag creation routes, live-value checks, optional acquisition settings and troubleshooting. Each guide identifies the development feature it requires; the currently published Windows and Docker binaries do not include these three source clients.

The MQTT guide includes a [topic mapping field reference](https://sparkstudiox.com/docs/mqtt-setup/#topic-mapping-field-reference) explaining every setting, the three tag creation modes, topic-to-tag path examples, structured messages, freshness/retained behavior and publisher ordering expressions.

To publish a documentation update:

1. Review and commit authored docs in the application repository under its source-boundary policy. Include new guides in the architecture README navigation.
2. Push the source commit and confirm its checks pass.
3. Change `docs-source.json` to that full 40-character commit. Review any unpublished-source exceptions.
4. Run the commands above and review the generated pages, search, links and mobile navigation.
5. Commit and push this website change. Documentation revisions are deliberate and reproducible; an arbitrary source push cannot silently change public docs.

## Downloads

The [standard preview release cycle](https://sparkstudiox.com/docs/release-process/) joins installer building and verification, GitHub prerelease publication, download updates and hosted docs into one release checklist. Its source is maintained in `SparkStudioX/src` at `docs/architecture/RELEASE_PROCESS.md`. A release is not complete until its installer/assets and the live website/docs are verified.

The homepage links **v0.2.0-preview.12**, including its installer, installation guide, workshop ZIP and installer checksum. Windows preview.12 adds Modbus TCP, Allen Bradley EtherNet/IP, Siemens S7 and Beckhoff ADS connections with saved point maps and reviewed scalar commands. The [industrial device guide](https://sparkstudiox.com/docs/industrial-device-connections/) covers supported address/type profiles and the hardware qualification still required. The separate Docker edition is **ladder99/sparkstudio:0.2.0-preview.11-docker.1**, with Linux AMD64 and ARM64 images, an example Compose file in the application repository and a [deployment guide](https://sparkstudiox.com/docs/docker-release/). GitHub's `/releases/latest` excludes prereleases, so Windows downloads use verified explicit tags.

After publishing the next complete Windows preview, run `npm run release:update`, review `release.json` and the Windows card in `index.html`, then commit. `npm run release:check` queries GitHub, excludes drafts and releases without their matching Windows installer, selects the most recently published Windows preview, verifies all four uploaded assets, and rejects stale or mismatched Windows links. The updater preserves the separate Docker card and ignores newer Docker-only prereleases. Set `GITHUB_TOKEN` if needed for API limits; never write it to the repository. CI checks releases before deployment but does not rewrite or commit files automatically.

After publishing and verifying a Docker edition, record its public multi-platform index digest, full application source commit and corresponding-source asset checksums/size in `docker-release.json`, then update the Docker card's explicit tag and Compose link in `index.html`. Run `npm run docker:check` before building or publishing. It verifies anonymous public pulls, the index digest, one image for each supported architecture, each image's edition/source labels, the committed example Compose, the small corresponding-source manifest checksum/completeness and the source archive's public availability/size. The release cycle verifies the full archive checksum separately; Pages CI does not download that large asset. Docker and Windows previews have independent publication records; a container release does not rewrite installer download links.

## Publish

The `Publish website and docs` GitHub Actions workflow builds and validates on pull requests and pushes. Only `main` deploys through GitHub Pages. Configure Pages to use **GitHub Actions**, with the existing custom domain `sparkstudiox.com` and HTTPS enforcement. The workflow uses pinned official action commits and uploads only `dist/`. It preserves `CNAME`, `.nojekyll`, assets and the landing page, and generates a sitemap containing every docs page plus the homepage.

The site uses local sample-application screenshots. Operator images 02–04 hide runtime controls. Screenshots may show newer development features than the installer. Publish only reviewed authored samples without credentials, customer data or third-party product artifacts.
