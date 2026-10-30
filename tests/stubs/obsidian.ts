/*
 * Notebook Navigator - Plugin for Obsidian
 * Copyright (c) 2025-2026 Johan Sanneblad
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
// Minimal Obsidian API stubs for Vitest environment.
//
// Limitations / test compromises:
// - This file is a functional stub, not a fidelity-accurate Obsidian runtime.
// - The `vault` methods below intentionally avoid using `this` for their internal state.
//   They close over local `Map` instances instead, which has two consequences:
//   1) Tests do not depend on method binding (`this`), so accidental unbound-method usage is less likely to surface here.
//   2) Real Obsidian classes may rely on `this` in ways this stub will not emulate (e.g. calling a method detached from its instance).
// - Prefer relying on ESLint rules in `src/**` (e.g. `@typescript-eslint/unbound-method`) to catch binding mistakes in production code.

import { deriveFileMetadata } from '../utils/pathMetadata';

interface TestVault {
    _files: Map<string, TFile>;
    _folders: Map<string, TFolder>;
    registerFile(file: TFile): void;
    unregisterFile(path: string): void;
    registerFolder(folder: TFolder): void;
    unregisterFolder(path: string): void;
    getFolderByPath(path: string): TFolder | null;
    getFileByPath(path: string): TFile | null;
    getAbstractFileByPath(path: string): TFile | TFolder | null;
    getRoot(): TFolder;
    getAllLoadedFiles(): Array<TFile | TFolder>;
    getMarkdownFiles(): TFile[];
    cachedRead(file: TFile): Promise<string>;
    adapter: {
        readBinary(path: string): Promise<ArrayBuffer>;
    };
}

export class App {
    vault: TestVault;

    metadataCache = {
        getFileCache: () => null,
        getFirstLinkpathDest: () => null
    };

    fileManager = {
        processFrontMatter: async () => {}
    };

    constructor() {
        const files = new Map<string, TFile>();
        const folders = new Map<string, TFolder>();
        const root = new TFolder('/');

        this.vault = {
            _files: files,
            _folders: folders,
            registerFile(file: TFile): void {
                files.set(file.path, file);
            },
            unregisterFile(path: string): void {
                files.delete(path);
            },
            registerFolder(folder: TFolder): void {
                folders.set(folder.path, folder);
            },
            unregisterFolder(path: string): void {
                folders.delete(path);
            },
            getFolderByPath(path: string): TFolder | null {
                return folders.get(path) ?? null;
            },
            getFileByPath(path: string): TFile | null {
                return files.get(path) ?? null;
            },
            getAbstractFileByPath(path: string): TFile | TFolder | null {
                return files.get(path) ?? folders.get(path) ?? null;
            },
            getRoot(): TFolder {
                return root;
            },
            getAllLoadedFiles(): Array<TFile | TFolder> {
                return [...folders.values(), ...files.values()];
            },
            getMarkdownFiles(): TFile[] {
                return Array.from(files.values()).filter(file => file.extension === 'md');
            },
            cachedRead: async () => '',
            adapter: {
                // Stubbed binary reads (tests that care about content typically override this).
                readBinary: async () => new ArrayBuffer(0)
            }
        };
    }
}

export class TFile {
    path = '';
    name = '';
    basename = '';
    extension = '';
    stat = { mtime: 0, ctime: 0 };

    constructor(path = '') {
        this.setPath(path);
    }

    setPath(path: string): void {
        this.path = path;
        const metadata = deriveFileMetadata(path);
        this.name = metadata.name;
        this.basename = metadata.basename;
        this.extension = metadata.extension;
    }
}

export class TFolder {
    path = '';
    children: Array<TFile | TFolder> = [];

    constructor(path = '') {
        this.path = path;
    }
}

export class Scope {
    register(): void {}
}

export class Notice {
    constructor(public message?: string) {}
    hide(): void {}
}

class StubElement {
    setText(): void {}

    createDiv(): StubElement {
        return new StubElement();
    }

    createEl(): StubElement {
        return new StubElement();
    }

    empty(): void {}

    addClass(): void {}
}

export class Modal {
    titleEl = new StubElement();
    contentEl = new StubElement();
    modalEl = new StubElement();
    scope = new Scope();

    constructor(public app: App) {}

    open(): void {
        this.onOpen();
    }

    close(): void {
        this.onClose();
    }

    onOpen(): void {}

    onClose(): void {}
}

/** Minimal suggest modal so modules that define fuzzy pickers can be imported in tests. */
export class FuzzySuggestModal<T> {
    inputEl = new StubElement();
    scope = new Scope();

    constructor(public app: App) {}

    setPlaceholder(): void {}

    setInstructions(): void {}

    open(): void {}

    close(): void {}

    getSuggestions(): Array<{ item: T; match: { score: number; matches: number[][] } }> {
        return [];
    }
}

export function prepareSimpleSearch(): () => null {
    return () => null;
}

export function renderMatches(): void {}

export class Plugin {
    app: App;
    manifest: Record<string, unknown>;

    constructor(app: App, manifest: Record<string, unknown>) {
        this.app = app;
        this.manifest = manifest;
    }
}

export type SettingDefinitionItem = Record<string, unknown>;

export class PluginSettingTab {
    app: App;
    plugin: Plugin;
    icon = '';
    containerEl = { isConnected: false } as HTMLElement;
    settingItems: SettingDefinitionItem[] = [];

    constructor(app: App, plugin: Plugin) {
        this.app = app;
        this.plugin = plugin;
    }

    getSettingDefinitions(): SettingDefinitionItem[] {
        return [];
    }

    getControlValue(): unknown {
        return undefined;
    }

    setControlValue(): void {}

    display(): void {}

    hide(): void {}

    update(): void {
        this.settingItems = this.getSettingDefinitions();
    }
}

export class Menu {}
export class MenuItem {}
export class Setting {}
export class SettingGroup {
    constructor(public containerEl: HTMLElement) {}

    setHeading(_heading?: string | DocumentFragment): this {
        return this;
    }

    addSetting(callback: (setting: Setting) => void): this {
        callback(new Setting());
        return this;
    }
}
export class ButtonComponent {}
export class SliderComponent {}
export class WorkspaceLeaf {}
export class FileSystemAdapter {}
/** Minimal markdown view so cursor placement can locate editors in tests. */
export class MarkdownView {
    file: TFile | null = null;
    editor: unknown = null;
}

export class FileView {
    file: TFile | null = null;
}

export const Platform = {
    isDesktopApp: true,
    isMobile: false,
    isTablet: false,
    isPhone: false,
    isIosApp: false
};

export const normalizePath = (value: string) => value;
export const setIcon = () => {};
export const addIcon = () => {};
export const getIconIds = () => [
    'lucide-home',
    'lucide-user',
    'lucide-search',
    'lucide-star',
    'lucide-tag',
    'lucide-tags',
    'lucide-circle-alert',
    'lucide-building-2',
    'lucide-brain',
    'lucide-calendar',
    'lucide-check-circle',
    'lucide-ph-test',
    'lucide-receipt',
    'lucide-book-open'
];
export const getLanguage = () => 'en';
export const requireApiVersion = () => true;
type RequestUrlResponse = {
    status: number;
    arrayBuffer?: ArrayBuffer;
    headers: Record<string, string>;
};

export const requestUrl = async (): Promise<RequestUrlResponse> => ({
    status: 404,
    headers: {}
});

function parseFrontmatterStringList(raw: unknown, separatorPattern: RegExp): string[] | null {
    if (raw === undefined || raw === null) {
        return null;
    }

    if (Array.isArray(raw)) {
        const values: string[] = [];
        for (const entry of raw) {
            if (typeof entry !== 'string') {
                continue;
            }
            entry
                .split(separatorPattern)
                .map(value => value.trim())
                .filter(value => value.length > 0)
                .forEach(value => values.push(value));
        }
        return values.length > 0 ? values : null;
    }

    if (typeof raw === 'string') {
        const values = raw
            .split(separatorPattern)
            .map(value => value.trim())
            .filter(value => value.length > 0);
        return values.length > 0 ? values : null;
    }

    return null;
}

export function parseFrontMatterTags(frontmatter?: { tags?: unknown }): string[] | null {
    return parseFrontmatterStringList(frontmatter?.tags, /[, ]+/u);
}

export function parseFrontMatterAliases(frontmatter?: { aliases?: unknown; alias?: unknown }): string[] | null {
    const raw = frontmatter?.aliases ?? frontmatter?.alias;
    return parseFrontmatterStringList(raw, /,\s*/u);
}

function stripSurroundingQuotes(value: string): string {
    const trimmed = value.trim();
    if (trimmed.length < 2) {
        return trimmed;
    }

    const first = trimmed[0];
    const last = trimmed[trimmed.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
        return trimmed.slice(1, -1);
    }

    return trimmed;
}

function parseInlineArray(value: string): string[] | null {
    const trimmed = value.trim();
    if (!trimmed.startsWith('[') || !trimmed.endsWith(']')) {
        return null;
    }

    const inner = trimmed.slice(1, -1).trim();
    if (!inner) {
        return [];
    }

    return inner
        .split(',')
        .map(entry => stripSurroundingQuotes(entry))
        .map(entry => entry.trim())
        .filter(Boolean);
}

/**
 * Parses a single YAML scalar / flow sequence for property value cells.
 */
function parseYamlScalar(value: string): unknown {
    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }

    // Real js-yaml rejects a bare `: …` document; keep that behavior so callers can fall back.
    if (trimmed.startsWith(':')) {
        throw new Error('bad indentation of a mapping entry');
    }

    const inlineArray = parseInlineArray(trimmed);
    if (inlineArray) {
        return inlineArray;
    }

    if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/u.test(trimmed)) {
        return Number(trimmed);
    }

    if (trimmed === 'true') {
        return true;
    }
    if (trimmed === 'false') {
        return false;
    }
    if (trimmed === 'null' || trimmed === '~') {
        return null;
    }

    return stripSurroundingQuotes(trimmed);
}

/**
 * Minimal YAML parser for Vitest stubs.
 * Supports frontmatter patterns used by the plugin:
 * - `key: value`
 * - `key: [a, b]`
 * - `key:` followed by `- item` list entries
 * Also parses single-value documents used by file property cells (`1`, `Hub`, `[a, b]`).
 */
export function parseYaml(yaml: string): unknown {
    const lines = yaml.split(/\r?\n/u);
    const hasMappingLine = lines.some(rawLine => {
        const trimmedLine = rawLine.trim();
        if (!trimmedLine || trimmedLine.startsWith('#') || trimmedLine.startsWith('-')) {
            return false;
        }
        return rawLine.indexOf(':') > 0;
    });

    if (!hasMappingLine) {
        return parseYamlScalar(yaml);
    }

    const result: Record<string, unknown> = {};
    let currentListKey: string | null = null;

    for (const rawLine of lines) {
        const trimmedLine = rawLine.trim();
        if (!trimmedLine || trimmedLine.startsWith('#')) {
            continue;
        }

        const listMatch = /^\s*-\s*(.*)$/u.exec(rawLine);
        if (listMatch && currentListKey) {
            const item = stripSurroundingQuotes(listMatch[1] ?? '').trim();
            if (!item) {
                continue;
            }
            const existing = result[currentListKey];
            if (Array.isArray(existing)) {
                existing.push(item);
            } else {
                result[currentListKey] = [item];
            }
            continue;
        }

        currentListKey = null;

        const separatorIndex = rawLine.indexOf(':');
        if (separatorIndex <= 0) {
            continue;
        }

        const key = rawLine.slice(0, separatorIndex).trim();
        if (!key) {
            continue;
        }

        let rawValue = rawLine.slice(separatorIndex + 1).trim();
        if (!rawValue) {
            currentListKey = key;
            continue;
        }

        // Remove inline comments (`value # comment`) but keep fragments in URLs (`...#frag`).
        rawValue = rawValue.replace(/\s+#.*$/u, '').trimEnd();

        const inlineArray = parseInlineArray(rawValue);
        if (inlineArray) {
            result[key] = inlineArray;
            continue;
        }

        if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/u.test(rawValue)) {
            result[key] = Number(rawValue);
            continue;
        }

        result[key] = stripSurroundingQuotes(rawValue);
    }

    return result;
}

/**
 * Minimal YAML serializer for Vitest stubs. Appends a trailing newline like Obsidian's stringifyYaml.
 */
export function stringifyYaml(obj: unknown): string {
    if (obj === null || obj === undefined) {
        return 'null\n';
    }

    if (typeof obj === 'number' || typeof obj === 'boolean') {
        return `${obj}\n`;
    }

    if (typeof obj === 'string') {
        if (
            obj.length === 0 ||
            obj === 'true' ||
            obj === 'false' ||
            obj === 'null' ||
            obj === '~' ||
            /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/u.test(obj) ||
            /[:#\[\]{},&*!|>'%@`]|^\s|\s$/u.test(obj)
        ) {
            return `${JSON.stringify(obj)}\n`;
        }
        return `${obj}\n`;
    }

    if (Array.isArray(obj)) {
        const parts = obj.map(item => {
            if (typeof item === 'string') {
                return /[:#\[\]{},&*!|>'%@`]|^\s|\s$/u.test(item) ? JSON.stringify(item) : item;
            }
            if (typeof item === 'number' || typeof item === 'boolean' || item === null) {
                return String(item);
            }
            return JSON.stringify(item);
        });
        return `[${parts.join(', ')}]\n`;
    }

    if (typeof obj === 'object') {
        const entries = Object.entries(obj as Record<string, unknown>);
        if (entries.length === 0) {
            return '{}\n';
        }
        return (
            entries
                .map(([key, value]) => {
                    if (Array.isArray(value)) {
                        const dump = stringifyYaml(value).replace(/\n$/u, '');
                        return `${key}: ${dump}`;
                    }
                    if (value !== null && typeof value === 'object') {
                        return `${key}: ${JSON.stringify(value)}`;
                    }
                    const dump = stringifyYaml(value).replace(/\n$/u, '');
                    return `${key}: ${dump}`;
                })
                .join('\n') + '\n'
        );
    }

    return `${String(obj)}\n`;
}

export type CachedMetadata = {
    frontmatter?: Record<string, unknown>;
    frontmatterPosition?: Pos;
    tags?: TagCache[];
};

export type FrontMatterCache = Record<string, unknown>;
export type Hotkey = { modifiers: string[]; key: string };
export type Modifier = string;

export type TagCache = { tag: string };

/**
 * Minimal `getAllTags` implementation for Vitest.
 * Returns tags with `#` prefix, or `null` when no tags are present.
 */
export function getAllTags(cache: CachedMetadata): string[] | null {
    const tags: string[] = [];
    const seen = new Set<string>();

    if (cache.tags) {
        for (const entry of cache.tags) {
            const raw = typeof entry.tag === 'string' ? entry.tag.trim() : '';
            if (!raw) {
                continue;
            }
            const normalized = raw.startsWith('#') ? raw : `#${raw}`;
            const key = normalized.toLowerCase();
            if (seen.has(key)) {
                continue;
            }
            seen.add(key);
            tags.push(normalized);
        }
    }

    const frontmatter = cache.frontmatter;
    const fmTags = frontmatter ? frontmatter['tags'] : undefined;
    if (typeof fmTags === 'string') {
        for (const token of fmTags.split(/[,\s]+/u)) {
            const trimmed = token.trim();
            if (!trimmed) {
                continue;
            }
            const normalized = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
            const key = normalized.toLowerCase();
            if (seen.has(key)) {
                continue;
            }
            seen.add(key);
            tags.push(normalized);
        }
    } else if (Array.isArray(fmTags)) {
        for (const item of fmTags) {
            if (typeof item !== 'string') {
                continue;
            }
            const trimmed = item.trim();
            if (!trimmed) {
                continue;
            }
            const normalized = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
            const key = normalized.toLowerCase();
            if (seen.has(key)) {
                continue;
            }
            seen.add(key);
            tags.push(normalized);
        }
    }

    return tags.length > 0 ? tags : null;
}

export type Loc = {
    line: number;
    col: number;
    offset: number;
};

export type Pos = {
    start: Loc;
    end: Loc;
};
