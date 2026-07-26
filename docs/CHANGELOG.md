# Changelog

Living log of significant changes to the project. This is **not** optional bookkeeping â€” every significant change (new feature, format change, dependency change, removed feature, policy change) gets an entry here at the time it's made. See the documentation policy in [.claude/CLAUDE.md](../.claude/CLAUDE.md).

Format: `YYYY-MM-DD â€” short description. Why (if not obvious). Files touched.`

## 2026-07-26 (0.1.0)

- **Initial scaffold** from the Obsidian plugin bootstrap template. Files: all.
- **2026-07-26 — Core work-note feature.** Ribbon button + command create/open `Work note DD-MM-YYYY`
  in a configurable folder (optional `YYYY/MM` subfolders). Notes have Yesterday, Today, Daily Notes,
  and a shared Global Notes section (transcluded `Work Notes - Global.md`). New notes seed Yesterday from
  the previous note's Today, embed the previous note in a collapsed foldout, and label Yesterday with the
  previous note's weekday when it isn't the day before. Files: `src/main.ts`, `README.md`,
  `docs/ARCHITECTURE.md`, `docs/FAQ.md`.
