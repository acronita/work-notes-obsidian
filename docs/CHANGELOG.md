# Changelog

Living log of significant changes to the project. This is **not** optional bookkeeping â€” every significant change (new feature, format change, dependency change, removed feature, policy change) gets an entry here at the time it's made. See the documentation policy in [.claude/CLAUDE.md](../.claude/CLAUDE.md).

Format: `YYYY-MM-DD â€” short description. Why (if not obvious). Files touched.`

## 2026-07-26 (0.1.0)

- **Initial scaffold** from the Obsidian plugin bootstrap template. Files: all.
- **2026-07-26 — Core work-note feature.** Ribbon button + command create/open `Work note DD-MM-YYYY`
  in a configurable folder (optional `YYYY/MM` subfolders). Notes use bold-labelled `**Yesterday:**` /
  `**Today:**`, a Daily Notes area between two rules, and a shared Global Notes box (backed by
  `Work Notes - Global.md`). New notes seed Yesterday from the previous note's Today, and label it with the
  previous note's weekday when it isn't the day before. The previous-note foldout and the Global Notes box
  render via **Dataview** (`dataviewjs` — requires the Dataview plugin with JS queries enabled); the
  foldout strips the previous note's own dataviewjs blocks so it previews only Yesterday/Today/Daily. The
  Global Notes box has an Edit button that opens the shared note. Files: `src/main.ts`,
  `src/styles/index.css`, `README.md`, `docs/ARCHITECTURE.md`, `docs/FAQ.md`.
