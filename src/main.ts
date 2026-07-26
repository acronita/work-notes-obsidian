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

		this.addRibbonIcon("notebook-pen", "Create work note", () => this.createOrOpenTodayNote());
		this.addCommand({
			id: "create-work-note",
			name: "Create or open today's work note",
			callback: () => this.createOrOpenTodayNote(),
		});

		this.addSettingTab(new WorkNotesPluginSettingTab(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	// --- work-note creation -------------------------------------------------

	async createOrOpenTodayNote() {
		const today = new Date();
		const folder = this.folderForDate(today);
		const path = normalizePath(`${folder}/${fileNameForDate(today)}.md`);

		const existing = this.app.vault.getAbstractFileByPath(path);
		if (existing instanceof TFile) {
			await this.openFile(existing);
			return;
		}

		await this.ensureFolder(folder);
		await this.ensureGlobalNote();

		const prev = this.findPreviousNote(today);
		const content = await this.buildNoteContent(today, prev);

		const file = await this.app.vault.create(path, content);
		await this.openFile(file);
	}

	// Assemble the four-section note, seeding Yesterday from the previous note's Today.
	async buildNoteContent(today: Date, prev: TFile | null): Promise<string> {
		let foldout = "";
		let yesterdayLabel = "Yesterday";
		let yesterdayBody = "";

		if (prev) {
			foldout = `> [!note]- Previous: ${prev.basename}\n> ![[${prev.basename}]]\n\n`;
			const prevDate = parseDateFromName(prev.basename);
			if (prevDate && !isDayBefore(prevDate, today)) {
				yesterdayLabel = WEEKDAYS[prevDate.getDay()];
			}
			const prevContent = await this.app.vault.read(prev);
			yesterdayBody = extractSection(prevContent, "Today");
		}

		const globalPath = this.globalNotePath();
		return (
			foldout +
			`## ${yesterdayLabel}\n${yesterdayBody ? yesterdayBody + "\n" : ""}\n` +
			`## Today\n\n` +
			`## Daily Notes\n\n` +
			`## Global Notes\n![[${globalPath}]]\n`
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

	// Create the shared Global Notes file once, so its embed isn't a broken link.
	async ensureGlobalNote() {
		await this.ensureFolder(normalizePath(this.settings.folder));
		const path = this.globalNotePath();
		if (!this.app.vault.getAbstractFileByPath(path)) {
			await this.app.vault.create(path, "# Global Notes\n\n");
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

// Return the body under a `## <heading>` up to the next `## ` heading, trimmed.
function extractSection(content: string, heading: string): string {
	const lines = content.split("\n");
	const start = lines.findIndex((l) => l.trim() === `## ${heading}`);
	if (start === -1) return "";
	const body: string[] = [];
	for (let i = start + 1; i < lines.length; i++) {
		if (/^##\s/.test(lines[i])) break;
		body.push(lines[i]);
	}
	return body.join("\n").trim();
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
