# Work Notes

Daily work log with Yesterday, Today, Daily Notes and a shared Global Notes section

## Features

- Create a work note for the current day via a ribbon button or command — file named `Work note DD-MM-YYYY` in a configurable folder.
- Each note has **Yesterday** and **Today** (bold-labelled, for standups), a **Daily Notes** area, and a **Global Notes** box shared across every work note.
- **Yesterday auto-fill**: a new note's Yesterday is pre-filled with the previous note's Today.
- **Previous-note foldout**: a collapsible box at the top previews the previous work note, trimmed to just its Yesterday/Today/Daily content (its own Global Notes and foldout are hidden).
- **Smart Yesterday label**: when the previous note isn't the day before, the label reads the actual weekday (e.g. "Friday") instead of "Yesterday".
- **Global Notes box** with an **Edit** button that opens the shared note directly.
- Optional setting to organize notes into `year/month` subfolders.

## Requirements

The previous-note foldout and the Global Notes box render through [Dataview](https://github.com/blacksmithgu/obsidian-dataview): install it and enable **Settings → Dataview → Enable JavaScript Queries**, or those two boxes won't render.

## Install

Copy `main.js`, `manifest.json` and `styles.css` into
`YOUR_VAULT/.obsidian/plugins/work-notes/`, then enable **Work Notes** under
Settings → Community plugins.

## Development

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for build setup, and
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for how the plugin is structured.
