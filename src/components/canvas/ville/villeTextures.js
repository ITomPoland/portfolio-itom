import * as THREE from 'three';

/**
 * Helper to generate a procedural canvas texture.
 * Implements drawing on a 2D canvas context and wrapping/colorSpace configurations.
 */
function canvasTex(w, h, draw, repeat = [1, 1], anisotropy = 4, wrap = THREE.RepeatWrapping) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = wrap;
    t.repeat.set(repeat[0], repeat[1]);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = anisotropy;
    return t;
}

/**
 * Noise helper to draw procedural grain/dirt onto a canvas context.
 */
function noise(ctx, w, h, base, amp, n = 2600) {
    if (base !== 'rgba(0,0,0,0)') {
        ctx.fillStyle = base;
        ctx.fillRect(0, 0, w, h);
    }
    for (let i = 0; i < n; i++) {
        const g = (Math.random() - .5) * amp;
        ctx.fillStyle = 'rgba(' + (g > 0 ? '255,255,255' : '0,0,0') + ',' + Math.abs(g) + ')';
        ctx.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2);
    }
}

/**
 * Factory for creating all city-related procedural textures.
 * Memoized or invoked inside R3F components.
 */
export function makeVilleTextures() {
    // 1. Earth/ground texture (desaturated laterite with wear/vegetation hints)
    const texTerre = canvasTex(512, 512, (x, w, h) => {
        x.fillStyle = '#8f8274';
        x.fillRect(0, 0, w, h);
        for (let i = 0; i < 900; i++) {
            x.fillStyle = 'rgba(' + (Math.random() > .5 ? '120,105,88' : '158,146,128') + ',' + (0.08 + Math.random() * .14) + ')';
            x.beginPath();
            x.ellipse(Math.random() * w, Math.random() * h, 6 + Math.random() * 30, 4 + Math.random() * 18, Math.random() * 3, 0, 7);
            x.fill();
        }
        x.fillStyle = 'rgba(94,104,74,.16)';
        for (let i = 0; i < 40; i++) {
            x.beginPath();
            x.ellipse(Math.random() * w, Math.random() * h, 12 + Math.random() * 34, 8 + Math.random() * 20, Math.random() * 3, 0, 7);
            x.fill();
        }
        noise(x, w, h, 'rgba(0,0,0,0)', .07, 5200);
    }, [16, 16], 4);

    // 2. Road asphalt (dark stone texture with cracks)
    const texAsphalt = canvasTex(512, 512, (x, w, h) => {
        x.fillStyle = '#3f3e3c';
        x.fillRect(0, 0, w, h);
        noise(x, w, h, 'rgba(0,0,0,0)', .10, 9000);
        x.fillStyle = 'rgba(0,0,0,.16)';
        for (let i = 0; i < 26; i++) {
            x.beginPath();
            x.ellipse(Math.random() * w, Math.random() * h, 14 + Math.random() * 44, 8 + Math.random() * 22, Math.random() * 3, 0, 7);
            x.fill();
        }
        x.strokeStyle = 'rgba(20,20,20,.4)';
        x.lineWidth = 1.5;
        for (let i = 0; i < 7; i++) {
            x.beginPath();
            let px0 = Math.random() * w, py0 = Math.random() * h;
            x.moveTo(px0, py0);
            for (let s = 0; s < 5; s++) {
                px0 += (Math.random() - .5) * 70;
                py0 += (Math.random() - .5) * 70;
                x.lineTo(px0, py0);
            }
            x.stroke();
        }
    }, [8, 8], 4);

    // 3. Pavement/cobblestone texture (structured tiles with bevel shading)
    const texPaves = canvasTex(512, 512, (x, w, h) => {
        x.fillStyle = '#b7ab97';
        x.fillRect(0, 0, w, h);
        const cs = 64;
        for (let r = 0; r < 8; r++) {
            for (let c0 = 0; c0 < 8; c0++) {
                const v = 0.88 + Math.random() * .2;
                x.fillStyle = 'rgba(' + Math.round(172 * v) + ',' + Math.round(160 * v) + ',' + Math.round(140 * v) + ',1)';
                x.fillRect(c0 * cs + 2, r * cs + 2, cs - 4, cs - 4);
                x.fillStyle = 'rgba(0,0,0,.1)';
                x.fillRect(c0 * cs + 2, r * cs + cs - 7, cs - 4, 5);
            }
        }
        noise(x, w, h, 'rgba(0,0,0,0)', .05, 3000);
    }, [12, 12], 4);

    // 4. Raw concrete texture (rough gray noise)
    const texBeton = canvasTex(256, 256, (x, w, h) => {
        noise(x, w, h, '#a9a49c', .07, 3600);
    }, [2, 2], 4);

    // 5. Procedural brick texture builder
    function brickTex(repeat) {
        const w = 512, h = 512, bw = 64, bh = 26, mortier = '#b5aca0';
        return canvasTex(w, h, (x) => {
            x.fillStyle = mortier;
            x.fillRect(0, 0, w, h);
            let row = 0;
            for (let y = 0; y < h; y += bh + 4) {
                const off = (row % 2) * (bw / 2 + 2);
                for (let bx = -bw; bx < w + bw; bx += bw + 4) {
                    const hue = 14 + Math.random() * 10, sat = 38 + Math.random() * 16, lum = 30 + Math.random() * 14;
                    x.fillStyle = 'hsl(' + hue + ',' + sat + '%,' + lum + '%)';
                    x.beginPath();
                    x.roundRect(bx + off, y, bw, bh, 2);
                    x.fill();
                    x.fillStyle = 'rgba(255,255,255,.07)';
                    x.fillRect(bx + off, y, bw, 3);
                    x.fillStyle = 'rgba(0,0,0,.18)';
                    x.fillRect(bx + off, y + bh - 3, bw, 3);
                    if (Math.random() < .18) {
                        x.fillStyle = 'rgba(0,0,0,.12)';
                        x.beginPath();
                        x.ellipse(bx + off + Math.random() * bw, y + Math.random() * bh, 5, 3, 0, 0, 7);
                        x.fill();
                    }
                }
                row++;
            }
            noise(x, w, h, 'rgba(0,0,0,0)', .06, 4200);
        }, repeat, 4);
    }
    const texBrique = brickTex([2.5, 1.6]);

    // 6. Wood planks texture (warm brown with grain curves)
    const texBois = canvasTex(256, 256, (x, w, h) => {
        x.fillStyle = '#b08d5f';
        x.fillRect(0, 0, w, h);
        x.strokeStyle = 'rgba(110,76,42,.4)';
        for (let i = 0; i < 20; i++) {
            x.lineWidth = 1 + Math.random() * 2;
            x.beginPath();
            x.moveTo(0, i * 13 + Math.random() * 6);
            x.bezierCurveTo(w * .3, i * 13 + 8, w * .7, i * 13 - 8, w, i * 13 + Math.random() * 6);
            x.stroke();
        }
        noise(x, w, h, 'rgba(0,0,0,0)', .05, 1800);
    }, [2, 2], 4);

    // 7. Decorative frieze pattern (alternating triangle layout)
    const texFrise = canvasTex(512, 64, (x, w, h) => {
        x.fillStyle = '#121014';
        x.fillRect(0, 0, w, h);
        const cols = ['#E09F3E', '#C1502E', '#F7F4EE'];
        for (let i = 0; i < 16; i++) {
            x.fillStyle = cols[i % 3];
            x.beginPath();
            if (i % 2) {
                x.moveTo(i * 32, h - 8);
                x.lineTo(i * 32 + 16, 8);
                x.lineTo(i * 32 + 32, h - 8);
            } else {
                x.moveTo(i * 32, 8);
                x.lineTo(i * 32 + 16, h - 8);
                x.lineTo(i * 32 + 32, 8);
            }
            x.closePath();
            x.fill();
        }
    }, [6, 1], 4);

    // 8. Pale marble (interior walls/ceilings)
    const texMarbre = canvasTex(512, 512, (x, w, h) => {
        x.fillStyle = '#EDEAE2';
        x.fillRect(0, 0, w, h);
        x.strokeStyle = 'rgba(150,145,130,.22)';
        for (let i = 0; i < 14; i++) {
            x.lineWidth = .6 + Math.random() * 1.6;
            x.beginPath();
            let vx = Math.random() * w, vy = 0;
            x.moveTo(vx, vy);
            for (let s = 0; s < 6; s++) {
                vx += (Math.random() - .5) * 140;
                vy += h / 6;
                x.lineTo(vx, vy);
            }
            x.stroke();
        }
        noise(x, w, h, 'rgba(0,0,0,0)', .035, 3000);
    }, [2.4, 2.4], 4);

    // 9. Light parquet (wood floor segments with grout lines)
    const texParquetClair = canvasTex(256, 256, (x, w, h) => {
        x.fillStyle = '#D8C7A8';
        x.fillRect(0, 0, w, h);
        const bw = 32;
        for (let c0 = 0; c0 < w / bw; c0++) {
            const v = 0.9 + Math.random() * .16;
            x.fillStyle = 'rgba(' + Math.round(216 * v) + ',' + Math.round(196 * v) + ',' + Math.round(160 * v) + ',1)';
            x.fillRect(c0 * bw, 0, bw - 2, h);
            x.strokeStyle = 'rgba(120,95,60,.25)';
            x.lineWidth = 1;
            for (let i = 0; i < 4; i++) {
                x.beginPath();
                x.moveTo(c0 * bw + 2, i * h / 4 + 2);
                x.lineTo(c0 * bw + bw - 4, i * h / 4 + 2 + Math.random() * 3);
                x.stroke();
            }
        }
        noise(x, w, h, 'rgba(0,0,0,0)', .04, 1600);
    }, [5, 5], 4);

    // 10. Grass texture (for vegetation billboards, clamped edges, transparency handled by material)
    const texGrass = canvasTex(64, 64, (x, w, h) => {
        x.clearRect(0, 0, w, h);
        for (let i = 0; i < 26; i++) {
            const gx = 4 + Math.random() * (w - 8);
            x.strokeStyle = 'hsl(' + (78 + Math.random() * 30) + ',' + (34 + Math.random() * 20) + '%,' + (26 + Math.random() * 14) + '%)';
            x.lineWidth = 1.6;
            x.beginPath();
            x.moveTo(gx, h);
            x.quadraticCurveTo(gx + (Math.random() - .5) * 10, h * .5, gx + (Math.random() - .5) * 16, 6 + Math.random() * 16);
            x.stroke();
        }
    }, [1, 1], 4, THREE.ClampToEdgeWrapping);

    // 11. Skyline background (day/night window lights, low-res silhouettes)
    const skylineDay = canvasTex(128, 256, (x, w, h) => {
        x.fillStyle = '#6b7280';
        x.fillRect(0, 0, w, h);
        x.fillStyle = '#4b5563';
        for (let r = 2; r < 30; r++) {
            for (let c0 = 0; c0 < 6; c0++) {
                if ((r * 5 + c0 * 3) % 4) {
                    x.fillRect(c0 * 20 + 6, r * 8 + 2, 10, 4);
                }
            }
        }
    }, [1, 1], 2);

    const skylineNightE = canvasTex(128, 256, (x, w, h) => {
        x.fillStyle = '#000';
        x.fillRect(0, 0, w, h);
        x.fillStyle = '#ffd9a0';
        for (let r = 2; r < 30; r++) {
            for (let c0 = 0; c0 < 6; c0++) {
                if ((r * 7 + c0 * 5) % 5 < 2) {
                    x.fillRect(c0 * 20 + 6, r * 8 + 2, 10, 4);
                }
            }
        }
    }, [1, 1], 2);
    // Keep emissiveMap in linear color space as in three.js standards
    skylineNightE.colorSpace = THREE.NoColorSpace;

    const texSkyline = { map: skylineDay, emissiveMap: skylineNightE };

    // 12. Façade building windows generator
    function facade(baseColor, frameColor, opts = {}) {
        const { cols = 5, rows = 4, w = 512, h = 512, litRatio = .55 } = opts;
        const draw = (lit) => canvasTex(w, h, (x) => {
            if (lit) {
                x.fillStyle = '#000';
                x.fillRect(0, 0, w, h);
            } else {
                noise(x, w, h, baseColor, .06, 2200);
            }
            const mw = w / cols, mh = h / rows;
            for (let r = 0; r < rows; r++) {
                for (let c0 = 0; c0 < cols; c0++) {
                    const px = c0 * mw + mw * .22, py = r * mh + mh * .2, pw = mw * .56, ph = mh * .56;
                    const isLit = ((r * 7 + c0 * 13) % 10) / 10 < litRatio;
                    if (lit) {
                        if (isLit) {
                            x.fillStyle = '#ffd9a0';
                            x.fillRect(px, py, pw, ph);
                        }
                    } else {
                        x.fillStyle = frameColor;
                        x.fillRect(px - 4, py - 4, pw + 8, ph + 8);
                        const g = x.createLinearGradient(px, py, px + pw, py + ph);
                        g.addColorStop(0, '#2c3a52');
                        g.addColorStop(.5, '#54749c');
                        g.addColorStop(1, '#22293a');
                        x.fillStyle = g;
                        x.fillRect(px, py, pw, ph);
                        x.fillStyle = frameColor;
                        x.fillRect(px + pw / 2 - 2, py, 4, ph);
                    }
                }
            }
        }, [1, 1], 4);

        const map = draw(false);
        const emissiveMap = draw(true);
        emissiveMap.colorSpace = THREE.NoColorSpace;

        return { map, emissiveMap };
    }

    return {
        texTerre,
        texAsphalt,
        texPaves,
        texBeton,
        texBrique,
        texBois,
        texFrise,
        texMarbre,
        texParquetClair,
        texGrass,
        texSkyline,
        facade
    };
}
