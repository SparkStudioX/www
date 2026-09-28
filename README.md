# SparkStudio website

Static landing page for [sparkstudiox.com](https://sparkstudiox.com). This repository contains the public website only. The industrial gateway and designer application are maintained separately.

## Preview

Serve this directory with any static HTTP server, for example:

```sh
python -m http.server 4173 --bind 127.0.0.1
```

Open `http://127.0.0.1:4173`. No package installation or build step is required.

## Publish

GitHub Pages publishes the root of `main`. `CNAME` declares `sparkstudiox.com`; the same custom domain must be configured in the repository's Pages settings. `.nojekyll` keeps the source files as plain static assets.

The page uses local assets and system fonts. The product gallery contains static screenshots of SparkStudio sample applications, stored in `assets/screenshots/`. Images link directly to their full-size files; there is no interactive product demo or gateway connection. The site's appearance preference is stored in the visitor's browser. There are no analytics, tracking scripts, or collection forms.

Screenshots show the current development build and may include features newer than the linked installer. Only publish reviewed screenshots of authored sample projects, with no credentials, customer data or third-party product artifacts.

Keep capability and release claims aligned with the application. The current product is an early preview for trusted local development. Installer binaries, checksums and installation guides are distributed through [SparkStudioX/releases](https://github.com/SparkStudioX/releases/releases), separately from this website repository.
