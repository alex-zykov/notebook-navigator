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

import { describe, expect, it } from 'vitest';
import {
    formatPropertyValueText,
    getFilePropertyRecord,
    parsePropertyValueText,
    sanitizeFilePropertyOverrides
} from '../../src/utils/filePropertyOverrides';
import { createTestTFile } from '../utils/createTestTFile';

describe('getFilePropertyRecord', () => {
    it('returns null for Markdown files', () => {
        const file = createTestTFile('notes/Hub.md');
        const overrides = { [file.path]: { type: 'Hub' } };

        expect(getFilePropertyRecord(file, overrides)).toBeNull();
    });

    it('returns the stored record for non-Markdown files', () => {
        const file = createTestTFile('notes/Hub.html');
        const overrides = { [file.path]: { type: 'Hub' } };

        expect(getFilePropertyRecord(file, overrides)).toEqual({ type: 'Hub' });
    });

    it('returns null when no override exists for the path', () => {
        const file = createTestTFile('notes/Hub.html');

        expect(getFilePropertyRecord(file, {})).toBeNull();
        expect(getFilePropertyRecord(file, undefined)).toBeNull();
    });
});

describe('parsePropertyValueText / formatPropertyValueText', () => {
    it('parses numbers, lists, plain text, and invalid YAML', () => {
        expect(parsePropertyValueText('1')).toBe(1);
        expect(parsePropertyValueText('[a, b]')).toEqual(['a', 'b']);
        expect(parsePropertyValueText('Hub')).toBe('Hub');
        expect(parsePropertyValueText(': bad')).toBe(': bad');
    });

    it('round-trips common values through stringifyYaml', () => {
        expect(formatPropertyValueText(1)).toBe('1');
        expect(formatPropertyValueText(['a', 'b'])).toBe('[a, b]');
        expect(formatPropertyValueText('Hub')).toBe('Hub');
        expect(parsePropertyValueText(formatPropertyValueText(1))).toBe(1);
        expect(parsePropertyValueText(formatPropertyValueText(['a', 'b']))).toEqual(['a', 'b']);
        expect(parsePropertyValueText(formatPropertyValueText('Hub'))).toBe('Hub');
    });
});

describe('sanitizeFilePropertyOverrides', () => {
    it('drops non-object entries, empty keys, and empty path records', () => {
        const sanitized = sanitizeFilePropertyOverrides({
            'a.html': { type: 'Hub', '': 'ignored' },
            'b.html': {},
            'c.html': 'not-an-object' as unknown as Record<string, unknown>,
            '': { type: 'Bad' }
        });

        expect(sanitized).toEqual({
            'a.html': { type: 'Hub' }
        });
    });
});
