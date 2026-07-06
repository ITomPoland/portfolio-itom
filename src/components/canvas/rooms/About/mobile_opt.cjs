const fs = require('fs');

const path = require('path');
const FILE_PATH = path.join(__dirname, 'InfiniteSkyManager.jsx');
let content = fs.readFileSync(FILE_PATH, 'utf8');

// ==== 1. Fix AwardButton ====
content = content.replace(
    /const AwardButton = \(\{ onClick, texture, paintedTexture, width, height, position, onHoverChange \}\) => \{/,
    `const AwardButton = ({ onClick, texture, paintedTexture, width, height, position, onHoverChange }) => {
    const { viewport } = useThree();
    const isMobile = viewport.width < 8;`
);

content = content.replace(
    /const handlePointerOver = \(\) => \{/g,
    `const handlePointerOver = () => {
        if (isMobile) return;`
);

content = content.replace(
    /const handlePointerOut = \(\) => \{/g,
    `const handlePointerOut = () => {
        if (isMobile) return;`
);


// ==== 2. Fix AwardsMilestone ====
content = content.replace(
    /const \{ camera \} = useThree\(\);/g,
    `const { camera, viewport } = useThree();
    const isMobile = viewport.width < 8;`
);

content = content.replace(
    /const sotyPaintedTexture = useLoader\(THREE\.TextureLoader, '\/textures\/about\/SOTY_painted\.webp'\);\s*const sotdPaintedTexture = useLoader\(THREE\.TextureLoader, '\/textures\/about\/SOTD_painted\.webp'\);\s*const sotmPaintedTexture = useLoader\(THREE\.TextureLoader, '\/textures\/about\/SOTM_painted\.webp'\);\s*const buttonTexture = useLoader\(THREE\.TextureLoader, '\/textures\/about\/PRZYCISKSOTD\.webp'\);\s*const buttonPaintedTexture = useLoader\(THREE\.TextureLoader, '\/textures\/about\/PRZYCISKSOTD_painted\.webp'\);/g,
    `const sotyPaintedTexture = useLoader(THREE.TextureLoader, isMobile ? '/textures/about/SOTY.webp' : '/textures/about/SOTY_painted.webp');
    const sotdPaintedTexture = useLoader(THREE.TextureLoader, isMobile ? '/textures/about/SOTD.webp' : '/textures/about/SOTD_painted.webp');
    const sotmPaintedTexture = useLoader(THREE.TextureLoader, isMobile ? '/textures/about/SOTM.webp' : '/textures/about/SOTM_painted.webp');
    const buttonTexture = useLoader(THREE.TextureLoader, '/textures/about/PRZYCISKSOTD.webp');
    const buttonPaintedTexture = useLoader(THREE.TextureLoader, isMobile ? '/textures/about/PRZYCISKSOTD.webp' : '/textures/about/PRZYCISKSOTD_painted.webp');`
);

content = content.replace(
    /const makeCardHoverHandler = \(revealRef, paintedRef, hideDelayRef\) => \(isHovered\) => \{/,
    `const makeCardHoverHandler = (revealRef, paintedRef, hideDelayRef) => (isHovered) => {
        if (isMobile) return;`
);


// ==== 3. Fix SkillBalloon ====
// Note: SkillBalloon already has isMobile defined from viewport!
// Let's replace the texture loading in SkillBalloon
content = content.replace(
    /const texture = useLoader\(THREE\.TextureLoader, config\.texture\);\s*const paintedTexture = useLoader\(THREE\.TextureLoader, config\.paintedTexture\);/g,
    `const isMobileViewport = viewport.width < 8; // Local const for texture loading before state
    const texture = useLoader(THREE.TextureLoader, config.texture);
    const paintedTextureUrl = isMobileViewport ? config.texture : config.paintedTexture;
    const paintedTexture = useLoader(THREE.TextureLoader, paintedTextureUrl);`
);

content = content.replace(
    /const handlePointerOver = \(e\) => \{/g,
    `const handlePointerOver = (e) => {
        if (isMobile) return;`
);

content = content.replace(
    /const handlePointerOut = \(e\) => \{/g,
    `const handlePointerOut = (e) => {
        if (isMobile) return;`
);


// Rewrite the isMobile in SkillBalloon because it is defined AFTER the hook, but we used isMobileViewport above
fs.writeFileSync(FILE_PATH, content, 'utf8');
console.log('Modifications applied successfully.');
