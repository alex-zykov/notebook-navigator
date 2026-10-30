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
import { buildFilePropertiesRecord } from '../../src/modals/FilePropertiesModal';

describe('buildFilePropertiesRecord', () => {
    it('ignores empty-key rows and parses YAML values', () => {
        expect(
            buildFilePropertiesRecord([
                { key: '  ', valueText: 'ignored' },
                { key: 'type', valueText: 'Hub' },
                { key: 'score', valueText: '1' },
                { key: 'tags', valueText: '[a, b]' }
            ])
        ).toEqual({
            ok: true,
            record: {
                type: 'Hub',
                score: 1,
                tags: ['a', 'b']
            }
        });
    });

    it('rejects case-insensitive duplicate keys', () => {
        expect(
            buildFilePropertiesRecord([
                { key: 'Type', valueText: 'Hub' },
                { key: 'type', valueText: 'Note' }
            ])
        ).toEqual({ ok: false, error: 'duplicate-keys' });
    });

    it('allows clearing all properties with an empty result', () => {
        expect(buildFilePropertiesRecord([{ key: '', valueText: 'x' }])).toEqual({
            ok: true,
            record: {}
        });
    });
});
