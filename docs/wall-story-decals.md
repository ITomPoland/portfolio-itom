# Corridor wall artwork replacement

Only the three decorative planes beside/above SegmentDoors were replaced.
Wall meshes, door geometry, animation and entrance continuity are unchanged.

Final source: `public/assets/corridor/wall-story-atlas.png`, copied byte-for-byte
from the user's `ChatGPT Image 2026年9月14日 04_10_43.png` (1672 x 941).
SHA-256: B4C7556B3256F5DFCF2E49184644C176CFEEA9BC3F8D03DC3942B8B5EE8A643D.

`StoryWallDecal.jsx` selects three UV rectangles from the same texture and removes
near-white paper in the material fragment shader. The file itself remains opaque
and unmodified; the website renders it as three transparent decals. This preserves
the supplied lettering instead of redrawing it. Texture clones are disposed on
unmount; the image is shared through the existing loader cache.

Mapping:
- Left: 成长轨迹 (2023 / 2024–2026 / 2027).
- Top: 边走，边做，边成为。 / Make · Explore · Repeat.
- Right: 探索中 / AI, cursor, airplane / things I’m still exploring.

Image editing was attempted with the built-in image tool, not the CLI. Those
generated variants had unwanted haze and were rejected, not installed in the app.
Prompt set: Extract the left growth timeline / center calligraphy / right
exploration column separately; preserve all original Chinese and English text,
sage and graphite strokes and layout; use genuine transparent backgrounds, tight
framing, no extra objects, no restyling. The left and right retries explicitly
required opaque ink and no shadows, glow, blur, gradients or tinted washes.

Validation: production build, targeted StoryWallDecal ESLint and 8 performance
tests passed. The local asset endpoint returned HTTP 200. Source and copied asset
hashes match. Browser automation could not connect after two attempts, so final
in-scene visual verification remains outstanding.
