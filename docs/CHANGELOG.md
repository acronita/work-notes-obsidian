# Changelog

Living log of significant changes to the project. This is **not** optional bookkeeping â€” every significant change (new feature, format change, dependency change, removed feature, policy change) gets an entry here at the time it's made. See the documentation policy in [.claude/CLAUDE.md](../.claude/CLAUDE.md).

Format: `YYYY-MM-DD â€” short description. Why (if not obvious). Files touched.`

## 2026-10-31 (0.1.1)

- **2026-10-31 — Fix: "Previous:" foldout leaked code and rendered the old note as a code block.** Root
  cause: the generated `dataviewjs` block contained a regex with three literal backticks
  (`` /```dataviewjs…```/g ``) on one of its lines, which closed the markdown fence early. `foldoutBlock` now
  builds the fence at runtime (`"`".repeat(3)`) and strips the previous note's `dataviewjs` blocks with a
  line-anchored `RegExp`, so the generated block never holds three consecutive backticks; `extractToday` uses
  the same line-anchored strip. Files: `src/main.ts`.
- **2026-10-31 — Automatic migration of existing notes.** Notes created by 0.1.0 still carry the broken
  foldout on disk. When a work note is opened (`file-open`, plus the already-active note at startup), the
  plugin rewrites only that note's legacy foldout block to the current format via `vault.process`. Safe by
  design: idempotent, only the opened note (no vault scan), only inside the configured folder with a
  `Work note DD-MM-YYYY` name, only when the block matches the legacy one exactly (otherwise untouched), and
  nothing outside the block changes (line endings preserved). Files: `src/main.ts`, `docs/ARCHITECTURE.md`,
  `docs/FAQ.md`, `package.json`, `package-lock.json`, `manifest.json`. `versions.json` unchanged
  (`minAppVersion` still 1.4.0).

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
