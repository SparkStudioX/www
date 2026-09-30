# SparkStudio website

Static landing page and documentation for [sparkstudiox.com](https://sparkstudiox.com). Application source belongs in [SparkStudioX/src](https://github.com/SparkStudioX/src); installers and workshop bundles belong in [SparkStudioX/releases](https://github.com/SparkStudioX/releases/releases).

## Build and preview

Use Node.js 22 or newer. With the application repository in `../source`:

```sh
npm ci --ignore-scripts
npm test
npm run release:check
npm run build
npm run preview
```

Open `http://127.0.0.1:4174`. Preview serves `dist/`, not the repository root. To use another source checkout, run `npm run build -- /path/to/src`. That checkout must contain the commit recorded in `docs-source.json`; fetch it if necessary. The build reads Git blobs at that commit and ignores unstaged or newer worktree content. A fresh website checkout needs a source checkout too; CI obtains it automatically.

## Documentation

`docs-source.json` pins the reviewed source commit. Every Markdown file in that commit's `docs/architecture/` becomes a page under `/docs/`. `README.md` supplies the grouped navigation and overview. Other filenames become lowercase hyphenated URLs, such as `TEMPLATE_PARAMETER_BINDINGS.md` → `/docs/template-parameter-bindings/`.

The build uses markdown-it with raw HTML disabled and local highlight.js. It rewrites documentation links, checks page and heading targets, validates complete navigation coverage, and points other source links to the same GitHub revision. No Markdown is fetched or interpreted at runtime. Generated output and npm dependencies are ignored by Git.

The reader includes full-text search over all guides, active-page navigation, heading permalinks, highlighted/copyable code, scrolling tables, adjacent-page links, source provenance, light/dark/system appearance and a keyboard-accessible mobile drawer. Search runs in the visitor's browser. Desktop content is usable without JavaScript; mobile topic navigation requires JavaScript. There are no external fonts, analytics, tracking or gateway connections.

The collection is **Development docs**, which can describe work newer than the installer and ongoing application changes. Three linked development workshop sources are not committed at the current pin. Their exact paths are listed in `unpublishedSources`; the renderer displays their labels as text with “source pending publication,” never broken GitHub links. Unexpected missing sources fail the build. When those sources are published, update the pin and remove the obsolete exceptions; the build enforces this cleanup.

To publish a documentation update:

1. Review and commit authored docs in the application repository under its source-boundary policy. Include new guides in the architecture README navigation.
2. Push the source commit and confirm its checks pass.
3. Change `docs-source.json` to that full 40-character commit. Review any unpublished-source exceptions.
4. Run the commands above and review the generated pages, search, links and mobile navigation.
5. Commit and push this website change. Documentation revisions are deliberate and reproducible; an arbitrary source push cannot silently change public docs.

## Downloads

The [standard preview release cycle](https://sparkstudiox.com/docs/release-process/) joins installer building and verification, GitHub prerelease publication, download updates and hosted docs into one release checklist. Its source is maintained in `SparkStudioX/src` at `docs/architecture/RELEASE_PROCESS.md`. A release is not complete until its installer/assets and the live website/docs are verified.

The homepage links **v0.2.0-preview.8**, including its installer, installation guide, workshop ZIP and installer checksum. Docker is coming soon. GitHub's `/releases/latest` excludes prereleases, so downloads use verified explicit tags.

After publishing the next complete preview, run `npm run release:update`, review `release.json` and `index.html`, then commit. `npm run release:check` queries GitHub, excludes drafts, selects the most recently published preview, verifies all four uploaded assets, and rejects stale or mismatched homepage links. Set `GITHUB_TOKEN` if needed for API limits; never write it to the repository. CI checks releases before deployment but does not rewrite or commit files automatically.

## Publish

The `Publish website and docs` GitHub Actions workflow builds and validates on pull requests and pushes. Only `main` deploys through GitHub Pages. Configure Pages to use **GitHub Actions**, with the existing custom domain `sparkstudiox.com` and HTTPS enforcement. The workflow uses pinned official action commits and uploads only `dist/`. It preserves `CNAME`, `.nojekyll`, assets and the landing page, and generates a sitemap containing every docs page plus the homepage.

The site uses local sample-application screenshots. Operator images 02–04 hide runtime controls. Screenshots may show newer development features than the installer. Publish only reviewed authored samples without credentials, customer data or third-party product artifacts.
