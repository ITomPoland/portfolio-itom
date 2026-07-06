import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
    VILLE_BUILDINGS,
    VILLE_BOUNDS,
    VILLE_TOUR_WAYPOINTS,
    VILLE_EYE_Y,
    VILLE_WALK_SPEED,
    VILLE_RUN_SPEED,
    VILLE_SPAWN,
    villeIsNightNow,
    villeNightTargetFor,
    getStoredVilleTheme,
    VILLE_THEME_STORAGE_KEY,
} from '../villeConfig.js';

// Derive the set of room ids actually wired up in the corridor (door -> room mapping),
// by parsing the source instead of hardcoding a guessed list (task requirement).
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const corridorSource = readFileSync(
    path.resolve(__dirname, '../../corridor/CorridorSegment.jsx'),
    'utf-8'
);
const WIRED_ROOM_IDS = new Set(
    [...corridorSource.matchAll(/roomId:\s*'([^']+)'/g)].map((m) => m[1])
);

describe('villeConfig — VILLE_BUILDINGS', () => {
    it('has at least one wired room id derived from CorridorSegment.jsx', () => {
        expect(WIRED_ROOM_IDS.size).toBeGreaterThan(0);
    });

    it('has unique, non-empty ids', () => {
        const ids = VILLE_BUILDINGS.map((b) => b.id);
        expect(ids.every((id) => typeof id === 'string' && id.length > 0)).toBe(true);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it('has finite position and rotationY for every building', () => {
        for (const b of VILLE_BUILDINGS) {
            expect(b.position).toHaveLength(3);
            for (const coord of b.position) {
                expect(Number.isFinite(coord)).toBe(true);
            }
            expect(Number.isFinite(b.rotationY)).toBe(true);
        }
    });

    it('has a positive collider radius for every building', () => {
        for (const b of VILLE_BUILDINGS) {
            expect(typeof b.collider).toBe('number');
            expect(b.collider).toBeGreaterThan(0);
        }
    });

    it('places every building within VILLE_BOUNDS on X and Z', () => {
        for (const b of VILLE_BUILDINGS) {
            const [x, , z] = b.position;
            expect(Math.abs(x)).toBeLessThanOrEqual(VILLE_BOUNDS);
            expect(Math.abs(z)).toBeLessThanOrEqual(VILLE_BOUNDS);
        }
    });

    it('maps every roomId to a room actually wired in CorridorSegment.jsx, or falls back to a teaser', () => {
        for (const b of VILLE_BUILDINGS) {
            if (b.roomId === null || b.roomId === undefined) {
                expect(typeof b.teaser).toBe('string');
                expect(b.teaser.length).toBeGreaterThan(0);
            } else {
                expect(WIRED_ROOM_IDS.has(b.roomId)).toBe(true);
            }
        }
    });

    it('has a non-empty label for every building', () => {
        for (const b of VILLE_BUILDINGS) {
            expect(typeof b.label).toBe('string');
            expect(b.label.length).toBeGreaterThan(0);
        }
    });
});

describe('villeConfig — VILLE_TOUR_WAYPOINTS', () => {
    it('has at least 2 waypoints', () => {
        expect(VILLE_TOUR_WAYPOINTS.length).toBeGreaterThanOrEqual(2);
    });

    it('has finite coordinates locked to eye height, within bounds', () => {
        for (const [x, y, z] of VILLE_TOUR_WAYPOINTS) {
            expect(Number.isFinite(x)).toBe(true);
            expect(Number.isFinite(y)).toBe(true);
            expect(Number.isFinite(z)).toBe(true);
            expect(y).toBe(VILLE_EYE_Y);
            expect(Math.abs(x)).toBeLessThanOrEqual(VILLE_BOUNDS);
            expect(Math.abs(z)).toBeLessThanOrEqual(VILLE_BOUNDS);
        }
    });
});

describe('villeConfig — spawn & movement tuning', () => {
    it('has a finite spawn position', () => {
        for (const coord of VILLE_SPAWN.position) {
            expect(Number.isFinite(coord)).toBe(true);
        }
        expect(Number.isFinite(VILLE_SPAWN.yaw)).toBe(true);
        expect(Number.isFinite(VILLE_SPAWN.pitch)).toBe(true);
    });

    it('has positive, finite walk/run speeds with run >= walk', () => {
        expect(Number.isFinite(VILLE_WALK_SPEED)).toBe(true);
        expect(Number.isFinite(VILLE_RUN_SPEED)).toBe(true);
        expect(VILLE_WALK_SPEED).toBeGreaterThan(0);
        expect(VILLE_RUN_SPEED).toBeGreaterThan(0);
        expect(VILLE_RUN_SPEED).toBeGreaterThanOrEqual(VILLE_WALK_SPEED);
    });
});

describe('villeConfig — day/night clock', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it('is night at 19h (boundary) and day at 18:59', () => {
        vi.setSystemTime(new Date(2026, 0, 1, 19, 0, 0));
        expect(villeIsNightNow()).toBe(true);
        vi.setSystemTime(new Date(2026, 0, 1, 18, 59, 0));
        expect(villeIsNightNow()).toBe(false);
    });

    it('is night at 6:59 and day at 7h (boundary)', () => {
        vi.setSystemTime(new Date(2026, 0, 1, 6, 59, 0));
        expect(villeIsNightNow()).toBe(true);
        vi.setSystemTime(new Date(2026, 0, 1, 7, 0, 0));
        expect(villeIsNightNow()).toBe(false);
    });

    it('villeNightTargetFor: "nuit" forces night, "jour" forces day, "auto" follows the clock', () => {
        vi.setSystemTime(new Date(2026, 0, 1, 12, 0, 0)); // noon, would be "day" if auto
        expect(villeNightTargetFor('nuit')).toBe(1);
        expect(villeNightTargetFor('jour')).toBe(0);
        expect(villeNightTargetFor('auto')).toBe(0);

        vi.setSystemTime(new Date(2026, 0, 1, 23, 0, 0)); // night, would be "night" if auto
        expect(villeNightTargetFor('nuit')).toBe(1);
        expect(villeNightTargetFor('jour')).toBe(0);
        expect(villeNightTargetFor('auto')).toBe(1);
    });
});

describe('villeConfig — getStoredVilleTheme', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('returns a stored valid theme value', () => {
        vi.stubGlobal('localStorage', {
            getItem: () => 'nuit',
        });
        expect(getStoredVilleTheme()).toBe('nuit');
    });

    it('falls back to "auto" for garbage values', () => {
        vi.stubGlobal('localStorage', {
            getItem: () => 'not-a-real-theme',
        });
        expect(getStoredVilleTheme()).toBe('auto');
    });

    it('falls back to "auto" when storage throws (private mode)', () => {
        vi.stubGlobal('localStorage', {
            getItem: () => {
                throw new Error('storage unavailable');
            },
        });
        expect(getStoredVilleTheme()).toBe('auto');
    });

    it('uses the documented storage key', () => {
        expect(VILLE_THEME_STORAGE_KEY).toBe('hakkilo-ville-theme');
    });
});
