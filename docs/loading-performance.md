# Local loading and rendering improvements — 2026-09-14

This change preserves the models, textures, room layouts and interaction physics.
It is local only; it does not deploy the website.

## Changes

- Preload entrance textures only. Read local project metadata without fetching all
  room images, certificates, or duplicate HTML/Three.js images.
- Split the four rooms into dynamic imports; begin fetching on door hover/click.
  Keep the existing per-room readiness signal before opening the door.
- Remove four offscreen warmup rooms and the second full-scene shader warmup.
- Mount corridor segments -1 and 0 before entry, with segment -1 clipped at the
  entrance (Z=22) and its doors hidden; retain neighboring segments after entry.
  Segment 0 starts at Z=10, so omitting segment -1 leaves the entrance passage open.
- Defer the 15,882,828-byte portrait GLB until corridor entry, behind its own Suspense boundary.
- Select hardware quality before WebGL creation, cap HIGH DPR at 1.5 and MEDIUM at
  1.25, and pause the render loop when the page is hidden.
- Load optional analytics independently; defer background music until interaction.
- Finish the preloader from scene readiness, including when resource cache events
  occur before the loading-manager listeners subscribe.
- Release the old door's camera ownership during teleport so the new room can
  acquire it instead of leaving the paper transition closed indefinitely.

## Evidence and limits

The old explicit desktop preload list had 207 unique paths, 24,232,696 bytes
(23.11 MiB) of existing files and three missing paths. The entrance-only list has
22 paths, 6,207,616 bytes (5.92 MiB), all present. This is a preload-list comparison,
not a measurement of total startup traffic: mounted corridor assets and fonts
still load normally.

Before these changes, the production entry and Experience chunks were respectively
1,412.66 and 444.27 kB (gzip 415.21 and 140.95 kB). After splitting rooms, the
portrait/GLTF loader and optional analytics, they were 1,227.05 and 213.92 kB
(gzip 354.48 and 71.57 kB). Small subsequent code changes may alter hashes/sizes.
The Three.js/React entry bundle still exceeds Vite's 500 kB warning threshold.

Run:

- `npm run test:performance` — device policy and loading-boundary regression checks.
- `npm run test:fonts` — Chinese glyph coverage and the reported missing 一.
- `npm run test:portrait-chat` — mocked chat API regression tests (not a real API call).
- `npm run build` — production compilation.

Chrome trace tools were unavailable in this session. Do not treat these build and
source measurements as measured FPS, Lighthouse scores, or cold-load timings.
For a future timing comparison, use the production build, an empty browser cache,
the same viewport/device/network, and separate initial entry from first room entry.

## Local browser smoke checks

Verified on the portfolio dev server at `http://127.0.0.1:5317/`:

- Entrance loading completes and the corridor renders after clicking the door.
- Gallery opens and project detail text renders, including the reported Chinese glyph.
- Gallery to Contact and Contact to Studio transitions complete after the camera-owner fix.
- Contact water, lighthouse, duck and social models render; a WeChat drag changes its position.
- About opens with its sky scene, avatar and paper plane, and its back button returns to the corridor.

The final fresh browser tab reported no captured console errors. These are smoke
checks, not a frame-rate benchmark or exhaustive physics/visual regression testing.

## Entrance continuity regression fix

The initial `[0]` segment set introduced a visible gap between the entrance at
Z=22 and the first corridor segment at Z=10. Restored `[-1, 0]` before entry so
the existing clipped section supplies walls, floor and ceiling throughout the
camera flight to Z=11. Room lazy-loading and the hidden-door clipping stay intact.
Added a regression test sampling this entire path at 0.25-unit intervals.

After the fix: 8 performance tests, 4 font tests, targeted ESLint and production
build passed. A full browser reload followed by opening the main doors showed
the passage during opening and the enclosed corridor after entry, with no
captured browser console errors.
