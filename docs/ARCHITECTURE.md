# Architecture

Technical overview of how the Work Notes plugin is built. Read this before making non-trivial changes.

## Overview

Work Notes generates one Markdown note per working day (`Work note DD-MM-YYYY`) in a user-configured
folder, optionally split into `year/month` subfolders. Each note carries four sections — Yesterday,
Today, Daily Notes, and a shared Global Notes — and when a new note is created its Yesterday section is
seeded from the previous note's Today, with a collapsed foldout embedding the previous note. The plugin
owns no custom file format (plain Markdown notes only), makes no network calls, and works on desktop and
mobile. Global Notes are shared across all work notes; the current scaffold does not yet decide the exact
storage mechanism for that shared section — that's an implementation decision for the feature task.

## Source layout

| File | Responsibility |
|---|---|
| `src/main.ts` | Plugin entry point: `onload`/`onunload`, settings load/save, settings tab. |

<!-- Add a row per new src/*.ts file as the project grows past a single file â€” this
     table is the map a new contributor (or future Claude session) reads first. -->

## Build pipeline

- TypeScript (`tsconfig.json`) type-checks `src/**/*.ts` (`tsc -noEmit`) â€” no `.js` is emitted by `tsc` itself.
- [esbuild](https://esbuild.github.io/) (`esbuild.config.mjs`) bundles `src/main.ts` into a single CommonJS `main.js`, externalizing `obsidian`, `electron`, CodeMirror/Lezer packages (provided by the Obsidian host at runtime) and Node builtins.
- A second esbuild step bundles `src/styles/index.css` into the root `styles.css` â€” the file Obsidian actually loads. The root `styles.css` is generated; edit the source under `src/styles/` instead.
- `manifest.json` + `versions.json` follow the standard Obsidian plugin conventions (`minAppVersion` compatibility map).

See [DEVELOPMENT.md](DEVELOPMENT.md) for how to actually run the build.
