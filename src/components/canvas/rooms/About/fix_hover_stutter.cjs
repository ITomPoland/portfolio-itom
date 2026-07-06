const fs = require('fs');

const path = require('path');
const FILE_PATH = path.join(__dirname, 'InfiniteSkyManager.jsx');
let content = fs.readFileSync(FILE_PATH, 'utf8');

// ==== 1. Fix AwardButton ====
content = content.replace(
    /if \(hideDelayRef\.current\) hideDelayRef\.current\.kill\(\);\s+if \(paintedRef\.current\) paintedRef\.current\.visible = true;/g,
    `if (hideDelayRef.current) hideDelayRef.current.kill();
        if (paintedRef.current) {
            paintedRef.current.visible = true;
            if (paintedRef.current.material) paintedRef.current.material.opacity = 1;
        }`
);

content = content.replace(
    /hideDelayRef\.current = gsap\.delayedCall\(0\.55, \(\) => \{\s+if \(paintedRef\.current\) paintedRef\.current\.visible = false;\s+\}\);/g,
    `hideDelayRef.current = gsap.delayedCall(0.55, () => {
            if (paintedRef.current && paintedRef.current.material) {
                paintedRef.current.material.opacity = 0;
            }
        });`
);

content = content.replace(
    /return \(\s+<group ref=\{meshRef\} position=\{position\}>\s+\{\/\* Painted button \(behind\) - hidden until hover \*\/\}\s+<mesh ref=\{paintedRef\} position=\{\[0, 0, -0\.001\]\} visible=\{false\}>\s+<planeGeometry args=\{\[width, height\]\} \/>\s+<meshBasicMaterial color="#e0e0e0"\s+map=\{paintedTexture\}\s+transparent\s+side=\{THREE\.DoubleSide\}\s+alphaTest=\{0\.5\}\s+depthWrite=\{false\}\s+\/>\s+<\/mesh>/g,
    `return (
        <group ref={meshRef} position={position}>
            {/* Painted button (behind) - hidden until hover */}
            <mesh ref={paintedRef} position={[0, 0, -0.001]} visible={true}>
                <planeGeometry args={[width, height]} />
                <meshBasicMaterial color="#e0e0e0"
                    map={paintedTexture}
                    transparent
                    opacity={0}
                    side={THREE.DoubleSide}
                    alphaTest={0.5}
                    depthWrite={false}
                />
            </mesh>`
);

// ==== 2. Fix makeCardHoverHandler ====
// We can't use simple replace because the handler is inside InfiniteSkyManager. So we target unique text:
content = content.replace(
    /const makeCardHoverHandler = \(revealRef, paintedRef, hideDelayRef\) => \(isHovered\) => \{\s+if \(isHovered\) \{\s+if \(revealRef\.current\) \{\s+gsap\.to\(revealRef\.current, \{\s+uProgress: 1\.0,\s+duration: 0\.8,\s+ease: 'power2\.out',\s+overwrite: true\s+\}\);\s+\}\s+if \(hideDelayRef\.current\) hideDelayRef\.current\.kill\(\);\s+if \(paintedRef\.current\) paintedRef\.current\.visible = true;\s+\} else \{\s+if \(revealRef\.current\) \{\s+gsap\.to\(revealRef\.current, \{\s+uProgress: 0\.0,\s+duration: 0\.5,\s+ease: 'power2\.out',\s+overwrite: true\s+\}\);\s+\}\s+hideDelayRef\.current = gsap\.delayedCall\(0\.55, \(\) => \{\s+if \(paintedRef\.current\) paintedRef\.current\.visible = false;\s+\}\);\s+\}\s+\};/g,
    `const makeCardHoverHandler = (revealRef, paintedRef, hideDelayRef) => (isHovered) => {
        if (isHovered) {
            if (revealRef.current) {
                gsap.to(revealRef.current, {
                    uProgress: 1.0,
                    duration: 0.8,
                    ease: 'power2.out',
                    overwrite: true
                });
            }
            if (hideDelayRef.current) hideDelayRef.current.kill();
            if (paintedRef.current) {
                paintedRef.current.visible = true;
                if (paintedRef.current.material) paintedRef.current.material.opacity = 1;
            }
        } else {
            if (revealRef.current) {
                gsap.to(revealRef.current, {
                    uProgress: 0.0,
                    duration: 0.5,
                    ease: 'power2.out',
                    overwrite: true
                });
            }
            hideDelayRef.current = gsap.delayedCall(0.55, () => {
                if (paintedRef.current && paintedRef.current.material) {
                    paintedRef.current.material.opacity = 0;
                }
            });
        }
    };`
);


// ==== 3. Fix AwardsMilestone meshes ====
content = content.replace(
    /<mesh ref=\{sotdCardPaintedRef\} position=\{\[0, 0, -0\.001\]\} visible=\{false\}>\s+<planeGeometry args=\{\[cardHeight \* sotdAspect, cardHeight\]\} \/>\s+<meshBasicMaterial color="#e0e0e0"\s+map=\{sotdPaintedTexture\}\s+transparent\s+side=\{THREE\.DoubleSide\}\s+alphaTest=\{0\.5\}\s+\/>\s+<\/mesh>/g,
    `<mesh ref={sotdCardPaintedRef} position={[0, 0, -0.001]} visible={true}>
                    <planeGeometry args={[cardHeight * sotdAspect, cardHeight]} />
                    <meshBasicMaterial color="#e0e0e0"
                        map={sotdPaintedTexture}
                        transparent
                        opacity={0}
                        side={THREE.DoubleSide}
                        alphaTest={0.5}
                    />
                </mesh>`
);

content = content.replace(
    /<mesh ref=\{sotmCardPaintedRef\} position=\{\[0, 0, -0\.001\]\} visible=\{false\}>\s+<planeGeometry args=\{\[cardHeight \* sotmAspect, cardHeight\]\} \/>\s+<meshBasicMaterial color="#e0e0e0"\s+map=\{sotmPaintedTexture\}\s+transparent\s+side=\{THREE\.DoubleSide\}\s+alphaTest=\{0\.5\}\s+\/>\s+<\/mesh>/g,
    `<mesh ref={sotmCardPaintedRef} position={[0, 0, -0.001]} visible={true}>
                    <planeGeometry args={[cardHeight * sotmAspect, cardHeight]} />
                    <meshBasicMaterial color="#e0e0e0"
                        map={sotmPaintedTexture}
                        transparent
                        opacity={0}
                        side={THREE.DoubleSide}
                        alphaTest={0.5}
                    />
                </mesh>`
);

content = content.replace(
    /<mesh ref=\{sotyCardPaintedRef\} position=\{\[0, 0, -0\.001\]\} visible=\{false\}>\s+<planeGeometry args=\{\[cardHeight \* sotyAspect, cardHeight\]\} \/>\s+<meshBasicMaterial color="#e0e0e0"\s+map=\{sotyPaintedTexture\}\s+transparent\s+side=\{THREE\.DoubleSide\}\s+alphaTest=\{0\.5\}\s+\/>\s+<\/mesh>/g,
    `<mesh ref={sotyCardPaintedRef} position={[0, 0, -0.001]} visible={true}>
                    <planeGeometry args={[cardHeight * sotyAspect, cardHeight]} />
                    <meshBasicMaterial color="#e0e0e0"
                        map={sotyPaintedTexture}
                        transparent
                        opacity={0}
                        side={THREE.DoubleSide}
                        alphaTest={0.5}
                    />
                </mesh>`
);


// ==== 4. Fix SkillBalloon handlers ====
content = content.replace(
    /if \(hideDelayRef\.current\) hideDelayRef\.current\.kill\(\);\s+if \(paintedMeshRef\.current\) paintedMeshRef\.current\.visible = true;/g,
    `if (hideDelayRef.current) hideDelayRef.current.kill();
        if (paintedMeshRef.current) paintedMeshRef.current.visible = true;
        if (paintedMatRef.current) paintedMatRef.current.opacity = 1;`
);

content = content.replace(
    /hideDelayRef\.current = gsap\.delayedCall\(0\.55, \(\) => \{\s+if \(paintedMeshRef\.current\) paintedMeshRef\.current\.visible = false;\s+\}\);/g,
    `hideDelayRef.current = gsap.delayedCall(0.55, () => {
            if (paintedMatRef.current) paintedMatRef.current.opacity = 0;
        });`
);

// Spawn reset
content = content.replace(
    /if \(balloonRevealRef\.current\) balloonRevealRef\.current\.uProgress = 0;\s+if \(paintedMeshRef\.current\) paintedMeshRef\.current\.visible = false;\s+if \(paintedMatRef\.current\) paintedMatRef\.current\.opacity = 1;/g,
    `if (balloonRevealRef.current) balloonRevealRef.current.uProgress = 0;
                if (paintedMatRef.current) paintedMatRef.current.opacity = 0;`
);

// Skill balloon mesh
content = content.replace(
    /<mesh ref=\{paintedMeshRef\} visible=\{false\}>\s+<planeGeometry args=\{\[baseHeight \* aspect, baseHeight\]\} \/>\s+<meshBasicMaterial color="#e0e0e0"\s+ref=\{paintedMatRef\}\s+map=\{paintedTexture\}\s+transparent\s+side=\{THREE\.DoubleSide\}\s+alphaTest=\{0\.5\}\s+depthWrite=\{false\}\s+\/>\s+<\/mesh>/g,
    `<mesh ref={paintedMeshRef} visible={true}>
                    <planeGeometry args={[baseHeight * aspect, baseHeight]} />
                    <meshBasicMaterial color="#e0e0e0"
                        ref={paintedMatRef}
                        map={paintedTexture}
                        transparent
                        opacity={0}
                        side={THREE.DoubleSide}
                        alphaTest={0.5}
                        depthWrite={false}
                    />
                </mesh>`
);


fs.writeFileSync(FILE_PATH, content, 'utf8');
console.log('Modifications applied successfully.');
