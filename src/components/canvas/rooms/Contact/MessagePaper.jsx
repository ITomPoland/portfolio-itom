/* eslint-disable react/no-unknown-property */
import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, useTexture, Html, useCursor } from '@react-three/drei';
import * as THREE from 'three';

const PAPER_WIDTH = 1.4;
const PAPER_HEIGHT = 1.7;
const FONT_PATH = '/fonts/CabinSketch-Regular.ttf';

// Helper: Interactive Text Field with Smooth Animation and Invisible Hitbox
const InteractiveTextField = ({
    isActive,
    value,
    placeholder,
    cursor,

    // Layout props
    position,
    baseRotation,
    hitboxPosition,
    hitboxSize,

    // Style props
    fontSize,
    maxWidth,
    anchorX = 'left',
    anchorY = 'middle',
    fontPath,
    textAlign,
    lineHeight,

    // Interaction
    onClick
}) => {
    const textRef = useRef();
    const [hovered, setHovered] = useState(false);
    useCursor(hovered);

    // Animation targets
    // Smooth lift (Y) and wobble (Z rotation) on hover
    const targetY = hovered ? position[1] + 0.007 : position[1];
    const targetRotZ = hovered ? baseRotation[2] + 0.015 : baseRotation[2];

    useFrame((state, delta) => {
        // Smooth interpolation for "buttery" feel
        const t = delta * 12; // Speed factor
        if (textRef.current) {
            textRef.current.position.y = THREE.MathUtils.lerp(textRef.current.position.y, targetY, t);
            textRef.current.rotation.z = THREE.MathUtils.lerp(textRef.current.rotation.z, targetRotZ, t);
        }
    });

    return (
        <group
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
            onClick={(e) => {
                e.stopPropagation();
                onClick && onClick();
            }}
        >
            {/* Invisible Hitbox - colorWrite=false prevents grey artifacts while keeping raycast */}
            <mesh position={hitboxPosition} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={hitboxSize} />
                <meshBasicMaterial colorWrite={false} depthWrite={false} />
            </mesh>

            <Text
                ref={textRef}
                position={position}
                rotation={baseRotation}
                fontSize={fontSize}
                color={hovered ? '#111111' : '#333333'} // Snap color, smooth motion
                font={fontPath}
                anchorX={anchorX}
                anchorY={anchorY}
                maxWidth={maxWidth}
                textAlign={textAlign}
                lineHeight={lineHeight}
            >
                {isActive ? (value + cursor) : (value || placeholder)}
            </Text>
        </group>
    );
};

// Helper: Smooth Animated Button
// Helper: Smooth Animated Button
const SmoothButton = ({ texture, onClick, position, size, text, fontPath }) => {
    const groupRef = useRef();
    const [hovered, setHovered] = useState(false);
    useCursor(hovered);

    // Animation targets - match InteractiveTextField style
    const targetY = hovered ? position[1] + 0.007 : position[1];
    const targetRotZ = hovered ? 0.015 : 0;

    useFrame((state, delta) => {
        const t = delta * 12;
        if (groupRef.current) {
            // Lerp Y Position
            groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, t);
            // Lerp Z Rotation (tilt)
            groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, targetRotZ, t);
            // Reset scale in case it was modified previously
            groupRef.current.scale.set(1, 1, 1);
        }
    });

    return (
        <group
            ref={groupRef}
            position={position}
            onClick={(e) => {
                e.stopPropagation();
                onClick && onClick();
            }}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
        >
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={size} />
                <meshBasicMaterial
                    map={texture}
                    transparent
                    alphaTest={0.1}
                />
            </mesh>
            {text && (
                <Text
                    position={[0, 0.005, 0]}
                    rotation={[-Math.PI / 2, 0, 0]}
                    fontSize={0.06}
                    color="#333333"
                    font={fontPath}
                    anchorX="center"
                    anchorY="middle"
                >
                    {text}
                </Text>
            )}
        </group>
    );
};

const MessagePaper = ({ position = [0, 0.05, 2], onSend }) => {
    const groupRef = useRef();
    const paperRef = useRef();
    const hiddenInputRef = useRef();
    const emailInputRef = useRef();
    const subjectInputRef = useRef();

    // State
    const [message, setMessage] = useState('');
    const [email, setEmail] = useState('');
    const [subject, setSubject] = useState('');
    const [activeField, setActiveField] = useState(null);
    const [cursorVisible, setCursorVisible] = useState(true);

    // Load textures
    const paperTexture = useTexture('/textures/contact/paper_form.png');
    const buttonTexture = useTexture('/textures/contact/send_button.png');

    // Configure textures
    useEffect(() => {
        if (paperTexture) paperTexture.colorSpace = THREE.SRGBColorSpace;
        if (buttonTexture) buttonTexture.colorSpace = THREE.SRGBColorSpace;
    }, [paperTexture, buttonTexture]);

    // Cursor blink effect
    useEffect(() => {
        if (!activeField) {
            setCursorVisible(false);
            return;
        }
        const interval = setInterval(() => setCursorVisible(prev => !prev), 530);
        return () => clearInterval(interval);
    }, [activeField]);

    // General paper click handler (background click)
    const handlePaperClick = useCallback((e) => {
        e.stopPropagation();
        if (!e.uv) return;
        const uvY = e.uv.y;

        // Fallback selection logic based on UV if hitboxes are missed
        if (uvY > 0.82) {
            setActiveField('email');
            setTimeout(() => emailInputRef.current?.focus(), 10);
        } else if (uvY > 0.68) {
            setActiveField('subject');
            setTimeout(() => subjectInputRef.current?.focus(), 10);
        } else if (uvY > 0.18) {
            setActiveField('message');
            setTimeout(() => hiddenInputRef.current?.focus(), 10);
        }
    }, []);

    // Handle send button click
    const handleButtonClick = useCallback(() => {
        if (message.trim() || email.trim()) {
            onSend?.({ message, email, subject });
            console.log('📤 Message sent:', { message, email, subject });
            setMessage('');
            setEmail('');
            setSubject('');
            setActiveField(null);
        }
    }, [message, email, subject, onSend]);

    // Input handlers
    const handleMessageInput = useCallback((e) => {
        if (e.target.value.length <= 300) setMessage(e.target.value);
    }, []);
    const handleEmailInput = useCallback((e) => {
        if (e.target.value.length <= 50) setEmail(e.target.value);
    }, []);
    const handleSubjectInput = useCallback((e) => {
        if (e.target.value.length <= 50) setSubject(e.target.value);
    }, []);

    const handleBlur = useCallback(() => {
        setTimeout(() => {
            const active = document.activeElement;
            if (active !== hiddenInputRef.current &&
                active !== emailInputRef.current &&
                active !== subjectInputRef.current) {
                setActiveField(null);
            }
        }, 100);
    }, []);

    // Format message (word wrap)
    const formattedMessage = useMemo(() => {
        const maxCharsPerLine = 28;
        const maxLines = 10;
        const lines = [];
        const words = message.split(' ');
        let currentLine = '';

        const breakLongWord = (word) => {
            const chunks = [];
            while (word.length > maxCharsPerLine) {
                chunks.push(word.slice(0, maxCharsPerLine));
                word = word.slice(maxCharsPerLine);
            }
            if (word) chunks.push(word);
            return chunks;
        };

        words.forEach(word => {
            if (word.length > maxCharsPerLine) {
                if (currentLine) { lines.push(currentLine); currentLine = ''; }
                const brokenWord = breakLongWord(word);
                brokenWord.forEach((chunk, i) => {
                    if (i < brokenWord.length - 1) lines.push(chunk);
                    else currentLine = chunk;
                });
            } else if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
                currentLine = (currentLine + ' ' + word).trim();
            } else {
                if (currentLine) lines.push(currentLine);
                currentLine = word;
            }
        });
        if (currentLine) lines.push(currentLine);
        return lines.slice(0, maxLines).join('\n');
    }, [message]);

    // Paper flutter animation
    useFrame((state) => {
        if (paperRef.current) {
            const time = state.clock.getElapsedTime();
            paperRef.current.rotation.z = Math.sin(time * 0.5) * 0.005;
        }
    });

    return (
        <group ref={groupRef} position={position}>
            {/* Hidden HTML inputs */}
            <Html position={[0, 0, 0]} style={{ position: 'fixed', left: '-9999px', top: '-9999px', opacity: 0, pointerEvents: 'none' }}>
                <textarea ref={hiddenInputRef} value={message} onChange={handleMessageInput} onBlur={handleBlur} aria-label="Message" style={{ pointerEvents: 'auto' }} />
                <input ref={emailInputRef} type="email" value={email} onChange={handleEmailInput} onBlur={handleBlur} aria-label="Email" style={{ pointerEvents: 'auto' }} />
                <input ref={subjectInputRef} type="text" value={subject} onChange={handleSubjectInput} onBlur={handleBlur} aria-label="Subject" style={{ pointerEvents: 'auto' }} />
            </Html>

            {/* Main Paper Mesh */}
            <mesh ref={paperRef} rotation={[-Math.PI / 2, 0, 0]} onClick={handlePaperClick}>
                <planeGeometry args={[PAPER_WIDTH, PAPER_HEIGHT]} />
                <meshStandardMaterial map={paperTexture} transparent side={THREE.DoubleSide} roughness={0.9} />
            </mesh>

            {/* === INTERACTIVE FIELDS === */}

            {/* Email Field */}
            <InteractiveTextField
                isActive={activeField === 'email'}
                value={email}
                placeholder="email..."
                cursor={cursorVisible ? '|' : ' '}
                onClick={() => { setActiveField('email'); setTimeout(() => emailInputRef.current?.focus(), 10); }}
                // Layout
                position={[-0.5, 0.008, -0.61]}
                baseRotation={[-Math.PI / 2, 0, 0.02]}
                hitboxPosition={[0, 0.005, -0.61]}
                hitboxSize={[PAPER_WIDTH * 0.85, 0.08]}
                // Style
                fontSize={0.05}
                maxWidth={PAPER_WIDTH * 0.8}
                fontPath={FONT_PATH}
            />

            {/* Subject Field */}
            <InteractiveTextField
                isActive={activeField === 'subject'}
                value={subject}
                placeholder="subject..."
                cursor={cursorVisible ? '|' : ' '}
                onClick={() => { setActiveField('subject'); setTimeout(() => subjectInputRef.current?.focus(), 10); }}
                // Layout
                position={[-0.5, 0.008, -0.46]}
                baseRotation={[-Math.PI / 2, 0, 0.02]}
                hitboxPosition={[0, 0.005, -0.46]}
                hitboxSize={[PAPER_WIDTH * 0.85, 0.08]}
                // Style
                fontSize={0.05}
                maxWidth={PAPER_WIDTH * 0.8}
                fontPath={FONT_PATH}
            />

            {/* Message Field */}
            <InteractiveTextField
                isActive={activeField === 'message'}
                value={formattedMessage}
                placeholder="message..."
                cursor={cursorVisible ? '|' : ' '}
                onClick={() => { setActiveField('message'); setTimeout(() => hiddenInputRef.current?.focus(), 10); }}
                // Layout
                position={[-0.46, 0.008, -0.3]}
                baseRotation={[-Math.PI / 2, 0, 0.02]}
                hitboxPosition={[0, 0.005, 0.1]}
                hitboxSize={[PAPER_WIDTH * 0.85, 0.55]}
                // Style
                fontSize={0.045}
                maxWidth={PAPER_WIDTH * 0.75}
                fontPath={FONT_PATH}
                anchorY="top"
                textAlign="left"
                lineHeight={1.35}
            />

            {/* === SEND BUTTON === */}
            <SmoothButton
                texture={buttonTexture}
                onClick={handleButtonClick}
                position={[0, 0.005, 0.68]}
                size={[0.5, 0.13]}
                text="SEND"
                fontPath={FONT_PATH}
            />
        </group>
    );
};

export default MessagePaper;
