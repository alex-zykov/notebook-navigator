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

import { parseYaml, stringifyYaml, type TFile } from 'obsidian';
import { isPlainObjectRecordValue, sanitizeRecord } from './recordUtils';

/**
 * Returns the sidecar property record for a non-Markdown file.
 * Markdown files keep using real frontmatter; this always returns null for them.
 */
export function getFilePropertyRecord(
    file: TFile,
    overrides: Record<string, Record<string, unknown>> | undefined
): Record<string, unknown> | null {
    if (file.extension === 'md') {
        return null;
    }

    const record = overrides?.[file.path];
    return record ?? null;
}

/**
 * Parses a property value cell as YAML text (same shape as frontmatter values).
 * Invalid YAML is kept as the raw string so the user can fix it later.
 */
export function parsePropertyValueText(text: string): unknown {
    try {
        return parseYaml(text);
    } catch {
        return text;
    }
}

/**
 * Formats a property value for editing in a text cell.
 * Trims the trailing newline that Obsidian's stringifyYaml appends.
 */
export function formatPropertyValueText(value: unknown): string {
    const yaml = stringifyYaml(value);
    return yaml.endsWith('\n') ? yaml.slice(0, -1) : yaml;
}

/**
 * Sanitizes the filePropertyOverrides settings record on load.
 * Drops non-object entries and empty keys, and removes paths whose record is empty.
 */
export function sanitizeFilePropertyOverrides(
    record: Record<string, Record<string, unknown>> | undefined
): Record<string, Record<string, unknown>> {
    const source = sanitizeRecord(record, isPlainObjectRecordValue);
    const sanitized = Object.create(null) as Record<string, Record<string, unknown>>;

    for (const [path, value] of Object.entries(source)) {
        if (!path) {
            continue;
        }

        const inner = Object.create(null) as Record<string, unknown>;
        for (const [key, propValue] of Object.entries(value)) {
            if (!key) {
                continue;
            }
            inner[key] = propValue;
        }

        if (Object.keys(inner).length > 0) {
            sanitized[path] = inner;
        }
    }

    return sanitized;
}
