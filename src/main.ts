import { App, Plugin, PluginSettingTab, Setting } from "obsidian";

interface WorkNotesPluginSettings {
	// Add plugin settings here as they're needed.
}

const DEFAULT_SETTINGS: WorkNotesPluginSettings = {};

export default class WorkNotesPlugin extends Plugin {
	settings: WorkNotesPluginSettings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new WorkNotesPluginSettingTab(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
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
	}
}
