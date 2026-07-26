# FAQ â€” customizing the project

Practical "where do I go to change X" answers. For the how-things-fit-together view, see [ARCHITECTURE.md](ARCHITECTURE.md).

<!-- init-plugin / whoever adds settings or features: add a "How do I change X" entry
     per user-facing setting or customization point. Keep entries short and point at
     the exact file/symbol, not a general explanation. -->

### Where are work notes created?

Set the folder in Settings → Work Notes → **Notes folder** (`folder` in `WorkNotesPluginSettings`,
[src/main.ts](../src/main.ts)). Empty means the vault root. Enable **Organize by year and month** to nest
notes in `<folder>/YYYY/MM/`.

### How is Global Notes shared across every work note?

It's a single note, `Work Notes - Global.md`, at the root of the configured folder, transcluded into each
note via `![[...]]` (`GLOBAL_NOTE_BASENAME`, [src/main.ts](../src/main.ts)). Edit it once and it changes
everywhere.

### Why does the top section say a weekday name instead of "Yesterday"?

When the previous work note isn't the calendar day before, the section is labelled with that note's
weekday (e.g. "Friday") — see `isDayBefore` / `WEEKDAYS` in [src/main.ts](../src/main.ts).

### Can I bump a dependency version?

Only with explicit approval â€” versions are pinned on purpose. See [DEPENDENCIES.md](DEPENDENCIES.md).

### How do I build without npm?

`node build-local.mjs` (Node 22+, no installed dependencies, no bundler). See [DEVELOPMENT.md](DEVELOPMENT.md).
