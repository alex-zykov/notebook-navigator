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

import { App, Modal, setIcon } from 'obsidian';
import { strings } from '../i18n';
import { runAsyncAction, type MaybePromise } from '../utils/async';
import { addAsyncEventListener } from '../utils/domEventListeners';
import { casefold } from '../utils/recordUtils';
import { formatPropertyValueText, parsePropertyValueText } from '../utils/filePropertyOverrides';

export interface FilePropertiesModalParams {
    title: string;
    initial: Record<string, unknown>;
    apply: (record: Record<string, unknown>) => MaybePromise;
}

export interface FilePropertyEditorRow {
    key: string;
    valueText: string;
}

export type BuildFilePropertiesRecordResult =
    | { ok: true; record: Record<string, unknown> }
    | { ok: false; error: 'duplicate-keys' };

/**
 * Builds the property record from editor rows.
 * Empty keys are ignored; case-insensitive duplicate keys fail the build.
 */
export function buildFilePropertiesRecord(rows: readonly FilePropertyEditorRow[]): BuildFilePropertiesRecordResult {
    const record: Record<string, unknown> = {};
    const seen = new Set<string>();

    for (const row of rows) {
        const key = row.key.trim();
        if (!key) {
            continue;
        }

        const normalized = casefold(key);
        if (seen.has(normalized)) {
            return { ok: false, error: 'duplicate-keys' };
        }
        seen.add(normalized);
        record[key] = parsePropertyValueText(row.valueText);
    }

    return { ok: true, record };
}

interface PropertyRowElements {
    keyInput: HTMLInputElement;
    valueInput: HTMLInputElement;
    rowEl: HTMLElement;
}

/**
 * Staged editor for sidecar properties on non-Markdown files.
 */
export class FilePropertiesModal extends Modal {
    private params: FilePropertiesModalParams;
    private rowsEl: HTMLElement | null = null;
    private errorEl: HTMLElement | null = null;
    private saveBtn: HTMLButtonElement | null = null;
    private rowElements: PropertyRowElements[] = [];
    private domDisposers: (() => void)[] = [];
    private isSubmitting = false;

    constructor(app: App, params: FilePropertiesModalParams) {
        super(app);
        this.params = params;
    }

    onOpen(): void {
        const { contentEl } = this;
        contentEl.empty();
        this.modalEl.addClass('nn-file-properties-modal');
        this.titleEl.setText(this.params.title);

        this.rowsEl = contentEl.createDiv('nn-file-properties-rows');

        const initialEntries = Object.entries(this.params.initial);
        if (initialEntries.length === 0) {
            this.addRow('', '');
        } else {
            initialEntries.forEach(([key, value]) => {
                this.addRow(key, formatPropertyValueText(value));
            });
        }

        const addButton = contentEl.createEl('button', {
            text: strings.modals.fileProperties.addProperty,
            cls: 'nn-file-properties-add'
        });
        this.domDisposers.push(addAsyncEventListener(addButton, 'click', () => this.addRow('', '', true)));

        this.errorEl = contentEl.createDiv({ cls: 'nn-file-properties-error' });
        this.errorEl.hide();

        const buttonContainer = contentEl.createDiv('nn-button-container');
        const cancelBtn = buttonContainer.createEl('button', { text: strings.common.cancel });
        this.domDisposers.push(addAsyncEventListener(cancelBtn, 'click', () => this.close()));

        this.saveBtn = buttonContainer.createEl('button', {
            text: strings.common.save,
            cls: 'mod-cta'
        });
        this.domDisposers.push(addAsyncEventListener(this.saveBtn, 'click', () => this.handleSave()));
    }

    onClose(): void {
        this.domDisposers.forEach(dispose => {
            try {
                dispose();
            } catch (error) {
                console.error('Error disposing file properties modal listener:', error);
            }
        });
        this.domDisposers = [];
        this.rowElements = [];
        this.rowsEl = null;
        this.errorEl = null;
        this.saveBtn = null;
        this.contentEl.empty();
        this.modalEl.removeClass('nn-file-properties-modal');
    }

    private addRow(key: string, valueText: string, focusKey = false): void {
        if (!this.rowsEl) {
            return;
        }

        const rowEl = this.rowsEl.createDiv('nn-file-properties-row');
        const keyInput = rowEl.createEl('input', {
            type: 'text',
            cls: 'nn-input nn-file-properties-key',
            attr: {
                placeholder: strings.modals.fileProperties.keyPlaceholder
            },
            value: key
        });
        const valueInput = rowEl.createEl('input', {
            type: 'text',
            cls: 'nn-input nn-file-properties-value',
            attr: {
                placeholder: strings.modals.fileProperties.valuePlaceholder
            },
            value: valueText
        });
        const removeBtn = rowEl.createEl('button', {
            cls: 'nn-action-btn',
            attr: {
                type: 'button',
                'aria-label': strings.modals.fileProperties.removeProperty
            }
        });
        setIcon(removeBtn, 'lucide-x');

        const row: PropertyRowElements = { keyInput, valueInput, rowEl };
        this.rowElements.push(row);

        this.domDisposers.push(
            addAsyncEventListener(removeBtn, 'click', () => {
                this.removeRow(row);
            })
        );

        this.domDisposers.push(
            addAsyncEventListener(valueInput, 'keydown', (event: KeyboardEvent) => {
                if (event.key !== 'Enter') {
                    return;
                }
                const isLast = this.rowElements[this.rowElements.length - 1] === row;
                if (!isLast) {
                    return;
                }
                event.preventDefault();
                this.addRow('', '', true);
            })
        );

        this.domDisposers.push(
            addAsyncEventListener(keyInput, 'input', () => this.clearError()),
            addAsyncEventListener(valueInput, 'input', () => this.clearError())
        );

        if (focusKey) {
            keyInput.focus();
        }
    }

    private removeRow(row: PropertyRowElements): void {
        const index = this.rowElements.indexOf(row);
        if (index === -1) {
            return;
        }
        this.rowElements.splice(index, 1);
        row.rowEl.remove();
        if (this.rowElements.length === 0) {
            this.addRow('', '', true);
        }
        this.clearError();
    }

    private collectRows(): FilePropertyEditorRow[] {
        return this.rowElements.map(row => ({
            key: row.keyInput.value,
            valueText: row.valueInput.value
        }));
    }

    private clearError(): void {
        if (!this.errorEl) {
            return;
        }
        this.errorEl.hide();
        this.errorEl.setText('');
    }

    private showDuplicateError(): void {
        if (!this.errorEl) {
            return;
        }
        this.errorEl.setText(strings.modals.fileProperties.duplicateKeyError);
        this.errorEl.show();
    }

    private handleSave(): void {
        if (this.isSubmitting) {
            return;
        }

        const result = buildFilePropertiesRecord(this.collectRows());
        if (!result.ok) {
            this.showDuplicateError();
            return;
        }

        this.isSubmitting = true;
        runAsyncAction(async () => {
            try {
                await this.params.apply(result.record);
                this.close();
            } finally {
                this.isSubmitting = false;
            }
        });
    }
}
