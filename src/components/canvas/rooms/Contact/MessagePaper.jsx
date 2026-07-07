/* eslint-disable react/no-unknown-property */
import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, useTexture, Html, useCursor } from '@react-three/drei';
import * as THREE from 'three';

const PAPER_WIDTH = 1.51; // Legacy ratio 1197/1340
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
                <meshBasicMaterial color="#e0e0e0" colorWrite={false} depthWrite={false} />
            </mesh>

            <Text
                renderOrder={1} // Ensure text renders on top of paper
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
                <meshBasicMaterial color="#e0e0e0"
                    map={texture}
                    transparent
                    alphaTest={0.1}
                />
            </mesh>
            {text && (
                <Text
                    renderOrder={1}
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

// Web3Forms API key — TODO: créer la clé Hakkilo XR (web3forms.com) et la fournir via .env
// (VITE_WEB3FORMS_KEY). L'ancienne clé en dur appartenait à l'auteur du template : les messages
// du formulaire partaient dans SA boîte mail.
const WEB3FORMS_KEY = import.meta.env.VITE_WEB3FORMS_KEY || '';

const MessagePaper = ({ position = [0, 0.05, 2], onSend }) => {
    const groupRef = useRef();
    const paperRef = useRef();
    const backPaperRef = useRef(); // Back side of paper (white)
    const hiddenInputRef = useRef();
    const emailInputRef = useRef();
    const subjectInputRef = useRef();
    // Honeypot anti-spam : champ jamais rempli par un humain (hors écran, non focusable).
    // Les bots qui remplissent automatiquement les inputs DOM le remplissent aussi.
    const botcheckRef = useRef();

    // Form State
    const [message, setMessage] = useState('');
    const [email, setEmail] = useState('');
    const [subject, setSubject] = useState('');
    const [activeField, setActiveField] = useState(null);
    const [cursorVisible, setCursorVisible] = useState(true);

    // Validation & Submit State
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error'

    // Email validation helper
    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    // Form validation
    const validateForm = () => {
        const newErrors = {};
        if (!email.trim()) newErrors.email = 'E-mail requis';
        else if (!isValidEmail(email)) newErrors.email = 'Format d’e-mail invalide';
        if (!subject.trim()) newErrors.subject = 'Sujet requis';
        if (!message.trim()) newErrors.message = 'Message requis';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Load textures
    const paperTexture = useTexture('/textures/contact/paper_form.webp');
    const buttonTexture = useTexture('/textures/contact/send_button.webp');

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

    // Handle send button click - Submit to Web3Forms
    const handleButtonClick = useCallback(async () => {
        // Garde anti double-envoi : ignore les clics pendant qu'une soumission est en vol
        if (isSubmitting) return;

        // Reset previous status
        setSubmitStatus(null);

        if (!validateForm()) {
            return;
        }

        // Honeypot rempli = bot : on simule un succès sans rien envoyer
        if (botcheckRef.current?.checked || botcheckRef.current?.value) {
            setSubmitStatus('success');
            return;
        }

        if (!WEB3FORMS_KEY) {
            // No key configured yet — fail visibly instead of posting to a third party
            setSubmitStatus('error');
            return;
        }

        setIsSubmitting(true);
        setErrors({});

        try {
            const response = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    access_key: WEB3FORMS_KEY,
                    botcheck: false,
                    from_name: 'Hakkilo XR — Contact',
                    email: email.trim(),
                    // Le sujet part dans l'en-tête du mail : on retire tout saut de ligne
                    subject: subject.replace(/[\r\n]+/g, ' ').trim(),
                    message: message.trim()
                })
            });

            const result = await response.json();

            if (result.success) {
                setSubmitStatus('success');
                onSend?.({ message, email, subject });
                // console.log('✅ Message sent successfully!');

                // Clear form after success
                setMessage('');
                setEmail('');
                setSubject('');
            } else {
                throw new Error(result.message || 'Failed to send');
            }
        } catch (error) {
            // console.error('❌ Send failed:', error);
            setSubmitStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    }, [message, email, subject, onSend, validateForm, isSubmitting]);

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

    // Store original vertex positions for fold animation
    // Paper animation (flutter)
    useFrame((state, delta) => {
        if (!paperRef.current) return;

        const time = state.clock.getElapsedTime();

        // Flutter animation
        paperRef.current.rotation.z = Math.sin(time * 0.5) * 0.005;
    });

    return (
        <group ref={groupRef} position={position}>
            {/* Hidden HTML inputs */}
            <Html position={[0, 0, 0]} style={{ position: 'fixed', left: '-9999px', top: '-9999px', opacity: 0, pointerEvents: 'none' }}>
                <textarea ref={hiddenInputRef} value={message} onChange={handleMessageInput} onBlur={handleBlur} aria-label="Message" style={{ pointerEvents: 'auto' }} />
                <input ref={emailInputRef} type="email" value={email} onChange={handleEmailInput} onBlur={handleBlur} aria-label="E-mail" style={{ pointerEvents: 'auto' }} />
                <input ref={subjectInputRef} type="text" value={subject} onChange={handleSubjectInput} onBlur={handleBlur} aria-label="Sujet" style={{ pointerEvents: 'auto' }} />
                {/* Honeypot : invisible, hors tabulation, ignoré des lecteurs d'écran */}
                <input ref={botcheckRef} type="checkbox" name="botcheck" tabIndex={-1} autoComplete="off" aria-hidden="true" />
            </Html>

            {/* Main Paper Mesh - FRONT (with texture) */}
            <mesh ref={paperRef} rotation={[-Math.PI / 2, 0, 0]} onClick={handlePaperClick}>
                <planeGeometry args={[PAPER_WIDTH, PAPER_HEIGHT, 20, 20]} />
                <meshBasicMaterial color="#e0e0e0"
                    map={paperTexture}
                    transparent
                    alphaTest={0.5}
                    side={THREE.FrontSide}
                    roughness={0.9}
                />
            </mesh>

            {/* Paper BACK (white) */}
            <mesh ref={backPaperRef} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[PAPER_WIDTH, PAPER_HEIGHT, 20, 20]} />
                <meshBasicMaterial
                    color="#f5f5f0"
                    side={THREE.BackSide}
                    roughness={0.9}
                />
            </mesh>

            {/* === INTERACTIVE FIELDS === */}
            <>
                <InteractiveTextField
                    isActive={activeField === 'email'}
                    value={email}
                    placeholder="e-mail…"
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
                    placeholder="sujet…"
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
                    placeholder="message…"
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
                    text={isSubmitting ? 'ENVOI…' : 'ENVOYER'}
                    fontPath={FONT_PATH}
                />

                {/* === VALIDATION ERRORS === */}
                {Object.keys(errors).length > 0 && (
                    <Text
                        position={[0, 0.01, 0.55]}
                        rotation={[-Math.PI / 2, 0, 0]}
                        fontSize={0.035}
                        color="#cc3333"
                        font={FONT_PATH}
                        anchorX="center"
                        anchorY="middle"
                    >
                        {errors.email || errors.subject || errors.message || 'Veuillez remplir tous les champs'}
                    </Text>
                )}

                {/* === SUCCESS MESSAGE === */}
                {submitStatus === 'success' && (
                    <Text
                        position={[0, 0.02, 0.55]}
                        rotation={[-Math.PI / 2, 0, 0]}
                        fontSize={0.045}
                        color="#22aa44"
                        font={FONT_PATH}
                        anchorX="center"
                        anchorY="middle"
                    >
                        Message envoyé ! ✓
                    </Text>
                )}

                {/* === ERROR MESSAGE === */}
                {submitStatus === 'error' && (
                    <Text
                        position={[0, 0.02, 0.55]}
                        rotation={[-Math.PI / 2, 0, 0]}
                        fontSize={0.04}
                        color="#cc3333"
                        font={FONT_PATH}
                        anchorX="center"
                        anchorY="middle"
                    >
                        Échec de l’envoi. Réessayez.
                    </Text>
                )}
            </>
        </group>
    );
};

export default MessagePaper;
