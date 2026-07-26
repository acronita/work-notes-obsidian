# Work Notes

Daily work log with Yesterday, Today, Daily Notes and a shared Global Notes section

## Features

- Create a work note for the current day via a ribbon button or command — file named `Work note DD-MM-YYYY` in a configurable folder.
- Four sections per note: **Yesterday** (what you did last working day, for standups), **Today** (what you're doing today), **Daily Notes** (free notes for that day), and **Global Notes** (a single section shared across all work notes).
- **Yesterday auto-fill**: a new note's Yesterday is pre-filled with the previous note's Today.
- **Previous-note foldout**: an embed of the previous work note appears in a collapsed foldout at the top.
- **Smart Yesterday label**: when the previous note isn't the day before, the label reads the actual weekday (e.g. "Friday") instead of "Yesterday".
- Optional setting to organize notes into `year/month` subfolders.

## Install

Copy `main.js`, `manifest.json` and `styles.css` into
`YOUR_VAULT/.obsidian/plugins/work-notes/`, then enable **Work Notes** under
Settings â†’ Community plugins.

## Development

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for build setup, and
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for how the plugin is structured.
