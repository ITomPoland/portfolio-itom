const fs = require('fs');
const path = require('path');
const FILE_PATH = path.join(__dirname, 'InfiniteSkyManager.jsx');
let content = fs.readFileSync(FILE_PATH, 'utf8');

content = content.replace(
    /const sotyPaintedTexture = useLoader\(THREE\.TextureLoader, '\/textures\/about\/SOTY_painted\.webp'\);\s+const sotdPaintedTexture = useLoader\(THREE\.TextureLoader, '\/textures\/about\/SOTD_painted\.webp'\);\s+const sotmPaintedTexture = useLoader\(THREE\.TextureLoader, '\/textures\/about\/SOTM_painted\.webp'\);\s+const buttonTexture = useLoader\(THREE\.TextureLoader, '\/textures\/about\/button\.webp'\);\s+const buttonPaintedTexture = useLoader\(THREE\.TextureLoader, '\/textures\/about\/button_painted\.webp'\);/,
    `const sotyPaintedTexture = useLoader(THREE.TextureLoader, isMobile ? '/textures/about/SOTY.webp' : '/textures/about/SOTY_painted.webp');
    const sotdPaintedTexture = useLoader(THREE.TextureLoader, isMobile ? '/textures/about/SOTD.webp' : '/textures/about/SOTD_painted.webp');
    const sotmPaintedTexture = useLoader(THREE.TextureLoader, isMobile ? '/textures/about/SOTM.webp' : '/textures/about/SOTM_painted.webp');
    const buttonTexture = useLoader(THREE.TextureLoader, '/textures/about/button.webp');
    const buttonPaintedTexture = useLoader(THREE.TextureLoader, isMobile ? '/textures/about/button.webp' : '/textures/about/button_painted.webp');`
);

fs.writeFileSync(FILE_PATH, content, 'utf8');
console.log('Modifications applied successfully.');
