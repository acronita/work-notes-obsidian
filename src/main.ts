import { App, Plugin, PluginSettingTab, Setting, TFile, normalizePath } from "obsidian";

interface WorkNotesPluginSettings {
	// Folder where work notes are created (vault-relative). Empty = vault root.
	folder: string;
	// When true, notes are nested in <folder>/YYYY/MM/ subfolders.
	organizeByYearMonth: boolean;
}

const DEFAULT_SETTINGS: WorkNotesPluginSettings = {
	folder: "Work Notes",
	organizeByYearMonth: false,
};

// Shared note transcluded into every work note's Global Notes section. Lives at
// the root of the configured folder so it's the same file for all notes.
const GLOBAL_NOTE_BASENAME = "Work Notes - Global";

const FILE_PREFIX = "Work note ";
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default class WorkNotesPlugin extends Plugin {
	settings: WorkNotesPluginSettings;

	async onload() {
		await this.loadSettings();

		this.addRibbonIcon("notebook-pen", "Create work note", () => this.createOrOpenNote(new Date()));
		this.addCommand({
			id: "create-work-note",
			name: "Create or open today's work note",
			callback: () => this.createOrOpenNote(new Date()),
		});

		this.addSettingTab(new WorkNotesPluginSettingTab(this.app, this));
	}

	onunload() { }

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	// --- work-note creation -------------------------------------------------

	async createOrOpenNote(date: Date) {
		const folder = this.folderForDate(date);
		const path = normalizePath(`${folder}/${fileNameForDate(date)}.md`);

		const existing = this.app.vault.getAbstractFileByPath(path);
		if (existing instanceof TFile) {
			await this.openFile(existing);
			return;
		}

		await this.ensureFolder(folder);
		await this.ensureGlobalNote();

		const prev = this.findPreviousNote(date);
		const content = await this.buildNoteContent(date, prev);

		const file = await this.app.vault.create(path, content);
		await this.openFile(file);
	}

	// Assemble the note: previous-note foldout (dataviewjs), Yesterday/Today with
	// bold labels, a Daily Notes area between two rules, and a Global Notes box
	// (dataviewjs). Yesterday is seeded from the previous note's Today.
	async buildNoteContent(today: Date, prev: TFile | null): Promise<string> {
		let foldout = "";
		let yesterdayLabel = "Yesterday";
		let yesterdayBody = "";

		if (prev) {
			foldout = foldoutBlock(prev.basename, prev.path) + "\n\n";
			const prevDate = parseDateFromName(prev.basename);
			if (prevDate && !isDayBefore(prevDate, today)) {
				yesterdayLabel = WEEKDAYS[prevDate.getDay()];
			}
			const prevContent = await this.app.vault.read(prev);
			yesterdayBody = extractToday(prevContent);
		}

		return (
			`\n` + foldout +
			`**${yesterdayLabel}:** ${yesterdayBody}\n\n` +
			`**Today:** \n\n` +
			`---\n\n\n\n` +
			`---\n\n` +
			globalBlock(this.globalNotePath())
		);
	}

	// Most recent work note strictly before `today`, across all subfolders.
	findPreviousNote(today: Date): TFile | null {
		const base = normalizePath(this.settings.folder);
		let best: TFile | null = null;
		let bestTime = -Infinity;

		for (const file of this.app.vault.getMarkdownFiles()) {
			if (this.settings.folder && !isInsideFolder(file.path, base)) continue;
			const date = parseDateFromName(file.basename);
			if (!date) continue;
			const t = date.getTime();
			if (t < startOfDay(today).getTime() && t > bestTime) {
				bestTime = t;
				best = file;
			}
		}
		return best;
	}

	// --- filesystem helpers -------------------------------------------------

	folderForDate(date: Date): string {
		const base = this.settings.folder;
		if (!this.settings.organizeByYearMonth) return base;
		const year = String(date.getFullYear());
		const month = pad(date.getMonth() + 1);
		return [base, year, month].filter(Boolean).join("/");
	}

	globalNotePath(): string {
		return normalizePath(`${this.settings.folder}/${GLOBAL_NOTE_BASENAME}.md`);
	}

	// Create `folder` and any missing parents. No-op if it already exists.
	async ensureFolder(folder: string) {
		if (!folder) return;
		const parts = normalizePath(folder).split("/");
		let current = "";
		for (const part of parts) {
			current = current ? `${current}/${part}` : part;
			if (!this.app.vault.getAbstractFileByPath(current)) {
				await this.app.vault.createFolder(current);
			}
		}
	}

	// Create the shared Global Notes file once, so its dataviewjs load isn't empty.
	// No heading: the box renders its own "Global Notes" title.
	async ensureGlobalNote() {
		await this.ensureFolder(normalizePath(this.settings.folder));
		const path = this.globalNotePath();
		if (!this.app.vault.getAbstractFileByPath(path)) {
			await this.app.vault.create(path, "");
		}
	}

	async openFile(file: TFile) {
		await this.app.workspace.getLeaf(false).openFile(file);
	}
}

// --- pure helpers -----------------------------------------------------------

function pad(n: number): string {
	return String(n).padStart(2, "0");
}

// "Work note DD-MM-YYYY"
function fileNameForDate(date: Date): string {
	return `${FILE_PREFIX}${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;
}

// Parse a "Work note DD-MM-YYYY" basename back to a Date, or null if it doesn't match.
function parseDateFromName(basename: string): Date | null {
	if (!basename.startsWith(FILE_PREFIX)) return null;
	const m = basename.slice(FILE_PREFIX.length).match(/^(\d{2})-(\d{2})-(\d{4})$/);
	if (!m) return null;
	const [, dd, mm, yyyy] = m;
	const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
	// Reject impossible dates (e.g. 32-13-2026 rolling over).
	if (date.getDate() !== Number(dd) || date.getMonth() !== Number(mm) - 1) return null;
	return date;
}

function startOfDay(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// True when `a` is exactly the calendar day before `b`.
function isDayBefore(a: Date, b: Date): boolean {
	const prev = startOfDay(b);
	prev.setDate(prev.getDate() - 1);
	return startOfDay(a).getTime() === prev.getTime();
}

function isInsideFolder(filePath: string, folder: string): boolean {
	return filePath === folder || filePath.startsWith(folder + "/");
}

// Text after `**Today:**` up to the first `---` rule, trimmed. Strips dataviewjs
// blocks first so their code never leaks into the carried-over text.
function extractToday(content: string): string {
	const stripped = content.replace(/```dataviewjs[\s\S]*?```/g, "");
	const marker = "**Today:**";
	const idx = stripped.indexOf(marker);
	if (idx === -1) return "";
	let rest = stripped.slice(idx + marker.length);
	const sep = rest.search(/\n---\s*(\n|$)/);
	if (sep !== -1) rest = rest.slice(0, sep);
	return rest.trim();
}

// dataviewjs block: collapsible box embedding the previous note, with its own
// dataviewjs blocks (foldout + global box) stripped so the preview shows only
// that note's Yesterday/Today/Daily content. Requires Dataview's JS queries.
function foldoutBlock(prevBasename: string, prevPath: string): string {
	return [
		"```dataviewjs",
		'const details = dv.container.createEl("details", { cls: "work-notes-prev" });',
		`details.createEl("summary", { text: ${JSON.stringify("Previous: " + prevBasename)} });`,
		`const raw = await dv.io.load(${JSON.stringify(prevPath)});`,
		'const md = (raw ?? "*(previous note not found)*").replace(/```dataviewjs[\\s\\S]*?```/g, "").trim();',
		'dv.el("div", md, { container: details });',
		"```",
	].join("\n");
}

// dataviewjs block: renders the shared Global Notes file inside a titled box.
function globalBlock(globalPath: string): string {
	return [
		"```dataviewjs",
		'const box = dv.container.createEl("div", { cls: "work-notes-global-box" });',
		'const head = box.createEl("div", { cls: "work-notes-global-head" });',
		'head.createEl("div", { cls: "work-notes-global-title", text: "Global Notes" });',
		'const edit = head.createEl("button", { cls: "work-notes-global-edit", text: "Edit" });',
		`edit.onclick = () => app.workspace.openLinkText(${JSON.stringify(globalPath)}, "", false);`,
		`const raw = await dv.io.load(${JSON.stringify(globalPath)});`,
		'dv.el("div", raw ?? "", { container: box });',
		"```",
	].join("\n") + "\n";
}

class WorkNotesPluginSettingTab extends PluginSettingTab {
	plugin: WorkNotesPlugin;

	constructor(app: App, plugin: WorkNotesPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		new Setting(containerEl).setName("Work Notes").setHeading();

		new Setting(containerEl)
			.setName("Notes folder")
			.setDesc("Vault-relative folder where work notes are created. Leave empty for the vault root.")
			.addText((text) =>
				text
					.setPlaceholder("Work Notes")
					.setValue(this.plugin.settings.folder)
					.onChange(async (value) => {
						this.plugin.settings.folder = value.trim();
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Organize by year and month")
			.setDesc("Store notes in <folder>/YYYY/MM/ subfolders instead of a flat folder.")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.organizeByYearMonth).onChange(async (value) => {
					this.plugin.settings.organizeByYearMonth = value;
					await this.plugin.saveSettings();
				})
			);
	}
}
