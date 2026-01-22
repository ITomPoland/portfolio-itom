import * as THREE from 'three';

/**
 * Creates a torn paper geometry with irregular edges
 * 
 * @param {number} width - Paper width
 * @param {number} height - Paper height  
 * @param {number} segmentsX - Horizontal segments (more = smoother tears)
 * @param {number} segmentsY - Vertical segments
 * @param {number} tearIntensity - How jagged the edges are (0-1)
 * @returns {THREE.BufferGeometry}
 */
export function createTornPaperGeometry(
    width = 1.2,
    height = 1.6,
    segmentsX = 20,
    segmentsY = 26,
    tearIntensity = 0.04
) {
    // Start with a plane
    const geometry = new THREE.PlaneGeometry(width, height, segmentsX, segmentsY);
    const positions = geometry.attributes.position;

    const halfWidth = width / 2;
    const halfHeight = height / 2;

    // Seed for consistent randomness
    const seed = 12345;
    const seededRandom = (i) => {
        const x = Math.sin(seed + i * 9999) * 10000;
        return x - Math.floor(x);
    };

    for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);

        // Check if vertex is on an edge
        const onLeftEdge = Math.abs(x + halfWidth) < 0.01;
        const onRightEdge = Math.abs(x - halfWidth) < 0.01;
        const onTopEdge = Math.abs(y - halfHeight) < 0.01;
        const onBottomEdge = Math.abs(y + halfHeight) < 0.01;

        if (onLeftEdge || onRightEdge || onTopEdge || onBottomEdge) {
            // Apply tear displacement
            const tearX = (seededRandom(i) - 0.5) * tearIntensity;
            const tearY = (seededRandom(i + 1000) - 0.5) * tearIntensity;

            // More intense tearing on left edge (notebook tear effect)
            const leftMultiplier = onLeftEdge ? 2.5 : 1;

            positions.setX(i, x + tearX * leftMultiplier);
            positions.setY(i, y + tearY * leftMultiplier);

            // Slight Z displacement for 3D effect
            const tearZ = seededRandom(i + 2000) * 0.01;
            positions.setZ(i, tearZ);
        }

        // Add subtle overall paper warp
        const warpZ = Math.sin(x * 3) * Math.cos(y * 2) * 0.015;
        positions.setZ(i, positions.getZ(i) + warpZ);
    }

    geometry.computeVertexNormals();
    geometry.attributes.position.needsUpdate = true;

    return geometry;
}

/**
 * Creates simple line positions for ruled paper effect
 * Returns array of line Y positions
 */
export function getRuledLinePositions(height, lineCount = 8, topMargin = 0.15, bottomMargin = 0.2) {
    const usableHeight = height - topMargin - bottomMargin;
    const spacing = usableHeight / (lineCount + 1);
    const startY = (height / 2) - topMargin - spacing;

    const lines = [];
    for (let i = 0; i < lineCount; i++) {
        lines.push(startY - i * spacing);
    }
    return lines;
}

export default createTornPaperGeometry;
