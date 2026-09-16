import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { parseGIF, decompressFrames } from 'gifuct-js';

/**
 * GifPictureContent - Animowany obrazek GIF wewnątrz ramki.
 *
 * Parsuje GIF przez gifuct-js, pre-renderuje każdą klatkę (obsługując
 * disposal types) do offscreen canvasów i odtwarza je na CanvasTexture
 * w pętli. Komponent sam dba o aktualizację tekstury w useFrame.
 */
const GifPictureContent = ({ imagePath, width, height }) => {
    const canvasRef = useRef(null);
    const renderedFramesRef = useRef([]);
    const frameDelaysRef = useRef([]);
    const currentIndexRef = useRef(-1);
    const startTimeRef = useRef(0);
    const textureRef = useRef(null);
    const [texture, setTexture] = useState(null);

    useEffect(() => {
        let cancelled = false;
        let tex = null;

        fetch(imagePath)
            .then((res) => res.arrayBuffer())
            .then((buffer) => {
                if (cancelled) return;

                const gif = parseGIF(buffer);
                const frames = decompressFrames(gif, true);

                const canvas = document.createElement('canvas');
                canvas.width = gif.lsd.width;
                canvas.height = gif.lsd.height;
                const ctx = canvas.getContext('2d');

                // Pre-render wszystkich klatek z poprawnym compositingiem (disposal types)
                const rendered = [];
                const delays = [];
                let savedCanvas = null;

                frames.forEach((frame, i) => {
                    // Zastosuj disposal poprzedniej klatki przed rysowaniem bieżącej
                    if (i > 0) {
                        const prev = frames[i - 1];
                        if (prev.disposalType === 2) {
                            ctx.clearRect(prev.dims.left, prev.dims.top, prev.dims.width, prev.dims.height);
                        } else if (prev.disposalType === 3) {
                            ctx.clearRect(0, 0, canvas.width, canvas.height);
                            if (savedCanvas) ctx.drawImage(savedCanvas, 0, 0);
                        }
                    }

                    // Zapisz stan przed rysowaniem, gdy ta klatka ma disposalType 3
                    if (frame.disposalType === 3) {
                        savedCanvas = document.createElement('canvas');
                        savedCanvas.width = canvas.width;
                        savedCanvas.height = canvas.height;
                        savedCanvas.getContext('2d').drawImage(canvas, 0, 0);
                    }

                    const imgData = new ImageData(
                        new Uint8ClampedArray(frame.patch),
                        frame.dims.width,
                        frame.dims.height
                    );
                    ctx.putImageData(imgData, frame.dims.left, frame.dims.top);

                    // Zrzut bieżącego stanu jako gotowa klatka
                    const snap = document.createElement('canvas');
                    snap.width = canvas.width;
                    snap.height = canvas.height;
                    snap.getContext('2d').drawImage(canvas, 0, 0);
                    rendered.push(snap);
                    delays.push(frame.delay || 100);
                });

                if (cancelled) return;

                renderedFramesRef.current = rendered;
                frameDelaysRef.current = delays;
                canvasRef.current = canvas;
                startTimeRef.current = 0;
                currentIndexRef.current = -1;

                tex = new THREE.CanvasTexture(canvas);
                tex.colorSpace = THREE.SRGBColorSpace;
                tex.minFilter = THREE.LinearFilter;
                tex.magFilter = THREE.LinearFilter;
                tex.anisotropy = 4;
                tex.needsUpdate = true;
                textureRef.current = tex;
                setTexture(tex);
            })
            .catch((err) => console.error('[GifPictureContent] load failed:', imagePath, err));

        return () => {
            cancelled = true;
            if (tex) tex.dispose();
        };
    }, [imagePath]);

    useFrame((state) => {
        const tex = textureRef.current;
        const canvas = canvasRef.current;
        const rendered = renderedFramesRef.current;
        const delays = frameDelaysRef.current;
        if (!tex || !canvas || rendered.length === 0) return;

        const now = state.clock.elapsedTime * 1000;
        if (startTimeRef.current === 0) startTimeRef.current = now;
        const elapsed = now - startTimeRef.current;

        let total = 0;
        for (const d of delays) total += d;
        if (total <= 0) total = delays.length * 100;

        const loop = elapsed % total;
        let acc = 0;
        let idx = 0;
        for (let i = 0; i < delays.length; i++) {
            acc += delays[i];
            if (loop < acc) {
                idx = i;
                break;
            }
        }

        if (idx !== currentIndexRef.current) {
            currentIndexRef.current = idx;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(rendered[idx], 0, 0);
            tex.needsUpdate = true;
        }
    });

    if (!texture) return null;

    return (
        <mesh>
            <planeGeometry args={[width, height]} />
            <meshBasicMaterial
                color="#ffffff"
                map={texture}
                transparent={true}
                alphaTest={0.1}
                side={THREE.DoubleSide}
                roughness={0.9}
            />
        </mesh>
    );
};

export default GifPictureContent;
