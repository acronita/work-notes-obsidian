# Architecture

Technical overview of how the Work Notes plugin is built. Read this before making non-trivial changes.

## Overview

Work Notes generates one Markdown note per working day (`Work note DD-MM-YYYY`) in a user-configured
folder, optionally split into `year/month` subfolders. Each note has bold-labelled `**Yesterday:**` and
`**Today:**` lines, a Daily Notes area between two `---` rules, and a Global Notes box; when a new note is
created its Yesterday is seeded from the previous note's Today, and labelled with that note's weekday when
it isn't the day before. The plugin owns no custom file format (plain Markdown only), makes no network
calls, and works on desktop and mobile.

Two parts of the note render through **Dataview** (`dataviewjs` blocks the plugin writes into the note, so
Dataview with JS queries must be enabled): the collapsible previous-note foldout, which `dv.io.load`s the
previous note and strips its own `dataviewjs` blocks so only Yesterday/Today/Daily show; and the Global
Notes box, which loads the shared `Work Notes - Global.md` (root of the configured folder) and adds an
Edit button that opens it. Because the shared note is loaded live, editing it once updates the box in every
work note.

## Source layout

| File | Responsibility |
|---|---|
| `src/main.ts` | Everything: `onload`/`onunload`, ribbon + command, work-note creation (folder resolution, previous-note lookup, Yesterday seeding, foldout + Global embed), settings tab, and pure date/section helpers. |

<!-- Add a row per new src/*.ts file as the project grows past a single file â€” this
     table is the map a new contributor (or future Claude session) reads first. -->

## Build pipeline

- TypeScript (`tsconfig.json`) type-checks `src/**/*.ts` (`tsc -noEmit`) â€” no `.js` is emitted by `tsc` itself.
- [esbuild](https://esbuild.github.io/) (`esbuild.config.mjs`) bundles `src/main.ts` into a single CommonJS `main.js`, externalizing `obsidian`, `electron`, CodeMirror/Lezer packages (provided by the Obsidian host at runtime) and Node builtins.
- A second esbuild step bundles `src/styles/index.css` into the root `styles.css` â€” the file Obsidian actually loads. The root `styles.css` is generated; edit the source under `src/styles/` instead.
- `manifest.json` + `versions.json` follow the standard Obsidian plugin conventions (`minAppVersion` compatibility map).

See [DEVELOPMENT.md](DEVELOPMENT.md) for how to actually run the build.
