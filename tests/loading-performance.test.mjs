import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { TIERS, SETTINGS, detectPerformanceTier, nextLowerTier } from '../src/config/performance.js';
import { ENTRANCE_TEXTURES, PRELOAD_ALL, PRELOAD_LOADER } from '../src/config/texturePreloadList.js';

const source = path => readFileSync(new URL('../src/' + path, import.meta.url), 'utf8');

test('hardware tier is selected before the WebGL context is constructed', () => {
  assert.equal(detectPerformanceTier({}), TIERS.HIGH);
  assert.equal(detectPerformanceTier({ userAgent: 'Android', hardwareConcurrency: 8 }), TIERS.MEDIUM);
  assert.equal(detectPerformanceTier({ userAgent: 'iPhone', hardwareConcurrency: 4 }), TIERS.LOW);
  assert.equal(detectPerformanceTier({ hardwareConcurrency: 4 }), TIERS.MEDIUM);
  assert.equal(detectPerformanceTier({ hardwareConcurrency: 16, deviceMemory: 4 }), TIERS.LOW);
  assert.equal(SETTINGS[TIERS.LOW].antialias, false);
});

test('quality degrades monotonically with bounded high-DPI rendering', () => {
  assert.equal(nextLowerTier(TIERS.HIGH), TIERS.MEDIUM);
  assert.equal(nextLowerTier(TIERS.MEDIUM), TIERS.LOW);
  assert.equal(nextLowerTier(TIERS.LOW), TIERS.LOW);
  assert.ok(SETTINGS[TIERS.HIGH].dpr[1] <= 1.5);
  assert.ok(SETTINGS[TIERS.MEDIUM].dpr[1] < SETTINGS[TIERS.HIGH].dpr[1]);
  assert.ok(SETTINGS[TIERS.LOW].dpr[1] < SETTINGS[TIERS.MEDIUM].dpr[1]);
});

test('explicit startup preload queue contains existing entrance assets only', () => {
  const paths = [...new Set(ENTRANCE_TEXTURES)];
  const bytes = paths.reduce((total, path) =>
    total + statSync(new URL('../public' + path, import.meta.url)).size, 0);
  assert.ok(paths.length <= 24);
  assert.ok(bytes < 7 * 1024 * 1024);
  assert.ok(paths.length < new Set([...PRELOAD_ALL, ...PRELOAD_LOADER]).size / 4);
  const app = source('App.jsx');
  assert.doesNotMatch(app, /PRELOAD_ALL|PRELOAD_LOADER|<Preload\s/);
  assert.match(app, /filterTexturesByDevice\(ENTRANCE_TEXTURES/);
});

test('reading local metadata never starts texture or certificate downloads', () => {
  const data = source('hooks/useSanityData.js');
  assert.doesNotMatch(data, /useTexture|useLoader|new Image|\.preload\(/);
  assert.match(data, /cache\.projects = localProjects/);
  assert.match(data, /cache\.content = localStudioContent/);
  assert.match(data, /cache\.awards = localAwards/);
});

test('rooms and the large portrait are lazy, with no offscreen room warmup', () => {
  const warmup = source('components/canvas/corridor/RoomWarmup.jsx');
  assert.doesNotMatch(warmup, /import .*Room from|<GalleryRoom|<StudioRoom|<AboutRoom|<ContactRoom/);
  const modules = source('components/canvas/corridor/roomModules.js');
  for (const room of ['Gallery', 'Studio', 'About', 'Contact']) {
    assert.ok(modules.includes("import('../rooms/" + room + '/' + room + "Room')"));
  }
  const interior = source('components/canvas/corridor/RoomInterior.jsx');
  assert.equal((interior.match(/lazy\(\(\) => loadRoom\(/g) || []).length, 4);
  assert.match(source('components/canvas/corridor/CorridorDecorations.jsx'), /hasEntered && \(\s*<Suspense/);
});

test('background rendering pauses; scene readiness overrides missed cache events', () => {
  assert.match(source('App.jsx'), /frameloop=\{isPageVisible \? 'always' : 'never'\}/);
  assert.match(source('components/dom/Preloader.jsx'), /if \(ready\) \{\s*newTarget = 100;\s*\} else if \(active\)/);
  assert.match(source('components/canvas/corridor/InfiniteCorridorManager.jsx'), /if \(!hasEntered\) return;/);
});

test('teleport releases the old door owner before the destination acquires the camera', () => {
  const door = source('components/canvas/corridor/DoorSection.jsx');
  const resetStart = door.indexOf('// --- SILENT RESET FOR TELEPORTATION ---');
  const resetEnd = door.indexOf('// Save camera state before entering room', resetStart);
  const reset = door.slice(resetStart, resetEnd);
  assert.ok(reset.includes("teleportPhase === 'teleporting'"));
  assert.ok(reset.includes('currentRoom === doorId'));
  assert.ok(reset.includes('setCameraOverride?.(false, cameraOwner)'));
});

test('entrance walls cover the entire door-to-corridor camera path before entry', () => {
  const manager = source('components/canvas/corridor/InfiniteCorridorManager.jsx');
  const experience = source('components/canvas/Experience.jsx');
  const segment = source('components/canvas/corridor/CorridorSegment.jsx');
  const entrance = source('components/canvas/entrance/EntranceDoors.jsx');
  const initialSegments = JSON.parse(manager.match(/useState\((\[[\d,\s-]+\])\)/)[1]);
  const segmentLength = Number(segment.match(/const SEGMENT_LENGTH = (\d+)/)[1]);
  const corridorStartZ = Number(segment.match(/const zOffset = (\d+) -/)[1]);
  const doorZ = Number(experience.match(/const ENTRANCE_DOORS_Z = (\d+)/)[1]);
  const stopZ = Number(entrance.match(/tl\.to\(camera\.position,\s*\{\s*z: (\d+)/)[1]);
  assert.ok(initialSegments.length <= 2, 'do not restore all offscreen corridor segments');
  assert.ok(initialSegments.includes(0), 'the welcome corridor must already be present');
  for (let z = stopZ; z <= doorZ; z += 0.25) {
    assert.ok(initialSegments.some(index => {
      const start = corridorStartZ - index * segmentLength;
      return z <= Math.min(start, doorZ) && z >= start - segmentLength;
    }), `missing corridor walls at Z=${z} during entrance`);
  }
  assert.match(experience, /hideDoorsForSegments=\{hasEntered \? \[\] : \[-1\]\}/);
  assert.match(experience, /clipSegmentNeg1=\{!hasEntered\}/);
  assert.match(manager, /clipSegmentNeg1 && segmentIndex === -1 \? 22/);
});
