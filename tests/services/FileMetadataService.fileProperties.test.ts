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

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App, TFile } from 'obsidian';
import { FileMetadataService } from '../../src/services/metadata/FileMetadataService';
import { DEFAULT_SETTINGS } from '../../src/settings/defaultSettings';
import type { NotebookNavigatorSettings } from '../../src/settings';
import type { ISettingsProvider } from '../../src/interfaces/ISettingsProvider';
import type { CollapsedPinnedContexts } from '../../src/types';

vi.mock('../../src/storage/fileOperations', () => ({
    getDBInstance: () => ({
        updateFileMetadata: vi.fn()
    })
}));

class TestSettingsProvider implements ISettingsProvider {
    constructor(public settings: NotebookNavigatorSettings) {}

    saveSettingsAndUpdate = vi.fn().mockResolvedValue(undefined);

    notifySettingsUpdate(): void {}

    getRecentNotes(): string[] {
        return [];
    }

    setRecentNotes(): void {}

    getRecentIcons(): Record<string, string[]> {
        return {};
    }

    setRecentIcons(): void {}

    collapsedPinnedContexts: CollapsedPinnedContexts = {};

    getCollapsedPinnedContexts(): CollapsedPinnedContexts {
        return { ...this.collapsedPinnedContexts };
    }

    updateCollapsedPinnedContexts(mutator: (record: CollapsedPinnedContexts) => boolean): boolean {
        return mutator(this.collapsedPinnedContexts);
    }

    getRecentColors(): string[] {
        return [];
    }

    setRecentColors(): void {}
}

describe('FileMetadataService file property overrides', () => {
    let app: App;
    let service: FileMetadataService;
    let settingsProvider: TestSettingsProvider;

    beforeEach(() => {
        settingsProvider = new TestSettingsProvider({
            ...DEFAULT_SETTINGS,
            filePropertyOverrides: {}
        });
        app = new App();
        app.vault.getAbstractFileByPath = vi.fn();
        app.vault.getFiles = vi.fn(() => []);
        service = new FileMetadataService(app, settingsProvider);
    });

    it('setFileProperties replaces the record and removes the path when empty', async () => {
        await service.setFileProperties('notes/Hub.html', { type: 'Hub', kind: 'page' });
        expect(service.getFileProperties('notes/Hub.html')).toEqual({ type: 'Hub', kind: 'page' });

        await service.setFileProperties('notes/Hub.html', { type: 'Note' });
        expect(service.getFileProperties('notes/Hub.html')).toEqual({ type: 'Note' });

        await service.setFileProperties('notes/Hub.html', {});
        expect(service.getFileProperties('notes/Hub.html')).toBeNull();
        expect(settingsProvider.settings.filePropertyOverrides['notes/Hub.html']).toBeUndefined();
    });

    it('mergeFileProperties adds or overwrites keys and keeps the rest', async () => {
        await service.setFileProperties('a.png', { kind: 'photo', type: 'Image' });
        await service.mergeFileProperties('a.png', { type: 'Photo', album: 'Trip' });

        expect(service.getFileProperties('a.png')).toEqual({
            kind: 'photo',
            type: 'Photo',
            album: 'Trip'
        });
    });

    it('moves the record on rename and removes it on delete', async () => {
        await service.setFileProperties('old/Hub.html', { type: 'Hub' });

        await service.handleFileRename('old/Hub.html', 'new/Hub.html');
        expect(service.getFileProperties('old/Hub.html')).toBeNull();
        expect(service.getFileProperties('new/Hub.html')).toEqual({ type: 'Hub' });

        await service.handleFileDelete('new/Hub.html');
        expect(service.getFileProperties('new/Hub.html')).toBeNull();
    });

    it('cleanup drops records whose files are gone', async () => {
        settingsProvider.settings.filePropertyOverrides = {
            'gone.html': { type: 'Hub' },
            'kept.html': { type: 'Page' }
        };

        const kept = new TFile();
        kept.path = 'kept.html';
        app.vault.getFiles = vi.fn(() => [kept]);

        const changed = await service.cleanupWithValidators({
            vaultFiles: new Set(['kept.html']),
            vaultFolders: new Set(),
            dbFiles: [],
            tagTree: new Map()
        });

        expect(changed).toBe(true);
        expect(settingsProvider.settings.filePropertyOverrides).toEqual({
            'kept.html': { type: 'Page' }
        });
    });
});
