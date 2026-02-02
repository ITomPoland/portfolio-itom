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
                <meshBasicMaterial
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

// Web3Forms API Key
const WEB3FORMS_KEY = '2ceaee50-a31e-4936-98fc-ca9648b21cdd';

const MessagePaper = ({ position = [0, 0.05, 2], onSend, onFoldComplete }) => {
    const groupRef = useRef();
    const paperRef = useRef();
    const backPaperRef = useRef(); // Back side of paper (white)
    const hiddenInputRef = useRef();
    const emailInputRef = useRef();
    const subjectInputRef = useRef();

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

    // Fold Animation State
    const [isFolding, setIsFolding] = useState(false);
    const foldProgress = useRef(0); // 0 = flat, 1 = fully folded

    // Roll Animation State (after fold) - sideways fold 1
    const [isRolling, setIsRolling] = useState(false);
    const rollProgress = useRef(0); // 0 = flat, 1 = fully folded sideways

    // Third fold state - another sideways fold
    const [isThirdFold, setIsThirdFold] = useState(false);
    const thirdFoldProgress = useRef(0);

    // Track if fold completion callback was triggered
    const foldCompleteTriggered = useRef(false);

    // Paper movement to bottle animation
    const [isMovingToBottle, setIsMovingToBottle] = useState(false);
    const moveProgress = useRef(0);

    // Email validation helper
    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    // Form validation
    const validateForm = () => {
        const newErrors = {};
        if (!email.trim()) newErrors.email = 'Email required';
        else if (!isValidEmail(email)) newErrors.email = 'Invalid email format';
        if (!subject.trim()) newErrors.subject = 'Subject required';
        if (!message.trim()) newErrors.message = 'Message required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

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

    // Handle send button click - Submit to Web3Forms
    // ⚠️ TESTING MODE: API disabled, just triggers animation
    const handleButtonClick = useCallback(async () => {
        // Reset previous status
        setSubmitStatus(null);

        // Skip validation for testing
        // if (!validateForm()) {
        //     return;
        // }

        setIsSubmitting(true);
        setErrors({});

        // TESTING: Skip API call, simulate success after short delay
        setTimeout(() => {
            setIsSubmitting(false);
            setSubmitStatus('success');
            console.log('🧪 TEST MODE: Simulating success (API disabled)');

            // Start fold animation after success
            setTimeout(() => {
                setIsFolding(true);
                foldProgress.current = 0;
            }, 500);
        }, 300);

        /* REAL API - uncomment when animations are done:
        try {
            const response = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    access_key: WEB3FORMS_KEY,
                    from_name: 'Portfolio Contact',
                    email: email,
                    subject: subject,
                    message: message
                })
            });

            const result = await response.json();

            if (result.success) {
                setSubmitStatus('success');
                onSend?.({ message, email, subject });
                console.log('✅ Message sent successfully!');

                // Start fold animation after success
                setTimeout(() => {
                    setIsFolding(true);
                    foldProgress.current = 0;
                }, 500);
            } else {
                throw new Error(result.message || 'Failed to send');
            }
        } catch (error) {
            console.error('❌ Send failed:', error);
            setSubmitStatus('error');
        } finally {
            setIsSubmitting(false);
        }
        */
    }, [message, email, subject, onSend, validateForm]);

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
    const originalPositions = useRef(null);
    const positionsAfterFold1 = useRef(null); // After vertical fold
    const positionsAfterFold2 = useRef(null); // After first horizontal fold

    // Paper animation (flutter + fold)
    useFrame((state, delta) => {
        if (!paperRef.current) return;

        const time = state.clock.getElapsedTime();

        // Flutter animation (only when not folding)
        if (!isFolding) {
            paperRef.current.rotation.z = Math.sin(time * 0.5) * 0.005;
        }

        // Fold animation
        if (isFolding) {
            const geometry = paperRef.current.geometry;
            const positions = geometry.attributes.position;
            const halfHeight = PAPER_HEIGHT / 2;

            // Store original positions on first frame of folding
            if (!originalPositions.current) {
                originalPositions.current = new Float32Array(positions.array);
            }

            // Increase fold progress
            if (foldProgress.current < 1) {
                foldProgress.current = Math.min(1, foldProgress.current + delta * 0.8);
            }

            // For each vertex, calculate position from ORIGINAL
            for (let i = 0; i < positions.count; i++) {
                const origY = originalPositions.current[i * 3 + 1]; // Y is at index 1
                const origZ = originalPositions.current[i * 3 + 2]; // Z is at index 2

                // Only fold the top half (positive Y in local space)
                if (origY > 0.01) { // Small threshold to avoid center vertices
                    // Normalized distance from center (0 to 1)
                    const normalizedDist = origY / halfHeight;

                    // Rotation angle (0 to PI for full fold)
                    const angle = foldProgress.current * Math.PI;

                    // Rotate this vertex around X axis at Y=0
                    // New Y = originalY * cos(angle)
                    const newY = origY * Math.cos(angle);

                    // Z calculation:
                    // - During fold: arc upward (sin gives nice curve)
                    // - After fold: stay ABOVE bottom part (add constant lift based on progress)
                    const arcLift = Math.sin(angle) * 0.4; // Arc during animation
                    const finalLift = foldProgress.current * 0.02; // Stays above when done
                    const newZ = origZ + arcLift + finalLift;

                    positions.setY(i, newY);
                    positions.setZ(i, newZ);
                }
            }

            positions.needsUpdate = true;
            geometry.computeVertexNormals();

            // Sync back paper with front paper
            if (backPaperRef.current) {
                const backGeom = backPaperRef.current.geometry;
                const backPos = backGeom.attributes.position;

                // Copy positions from front to back
                for (let i = 0; i < positions.count; i++) {
                    backPos.setX(i, positions.getX(i));
                    backPos.setY(i, positions.getY(i));
                    backPos.setZ(i, positions.getZ(i));
                }

                backPos.needsUpdate = true;
                backGeom.computeVertexNormals();
            }

            // Transition to roll after fold is complete
            if (foldProgress.current >= 1 && !isRolling) {
                // Save positions after fold 1
                if (!positionsAfterFold1.current) {
                    positionsAfterFold1.current = new Float32Array(positions.array);
                }
                setTimeout(() => {
                    setIsRolling(true);
                    rollProgress.current = 0;
                }, 300); // Small delay before rolling
            }
        }

        // ACCORDION FOLD animation (after vertical fold is complete)
        // Smooth fan-fold with proper segment rotation
        if (isRolling && foldProgress.current >= 1) {
            const geometry = paperRef.current.geometry;
            const positions = geometry.attributes.position;

            // Smooth easing for natural motion
            if (rollProgress.current < 1) {
                rollProgress.current = Math.min(1, rollProgress.current + delta * 0.4);
            }

            // Eased progress for smoother animation
            const t = rollProgress.current;
            const eased = t < 0.5
                ? 2 * t * t  // ease in
                : 1 - Math.pow(-2 * t + 2, 2) / 2; // ease out

            // Accordion parameters
            const numFolds = 5; // Number of fan segments
            const segmentWidth = PAPER_WIDTH / numFolds;
            const maxFoldAngle = Math.PI * 0.85; // How much each fold bends (almost 180°)

            for (let i = 0; i < positions.count; i++) {
                const origX = originalPositions.current[i * 3];
                const origZ = originalPositions.current[i * 3 + 2];

                // Normalize X from 0 to 1
                const normalizedX = (origX + PAPER_WIDTH / 2) / PAPER_WIDTH;

                // Which segment is this vertex in (0, 1, 2, 3)
                const segmentIndex = Math.min(numFolds - 1, Math.floor(normalizedX * numFolds));

                // Position within segment (0 to 1)
                const segmentPos = (normalizedX * numFolds) % 1;

                // Calculate cumulative position after folding
                // Each segment folds alternating direction
                let newX = -PAPER_WIDTH / 2; // Start from left edge
                let newZ = 0.03; // Base height

                // Add contribution from each complete segment before this one
                for (let s = 0; s < segmentIndex; s++) {
                    const isEven = s % 2 === 0;
                    const foldDir = isEven ? 1 : -1;
                    const angle = eased * maxFoldAngle;

                    // Each segment contributes to X and Z based on its fold
                    newX += segmentWidth * Math.cos(angle * foldDir * (s + 1) * 0.3);
                    newZ += 0.015 * eased; // Stack height for each layer
                }

                // Add contribution from current segment (partial)
                const isEvenSeg = segmentIndex % 2 === 0;
                const currentAngle = eased * maxFoldAngle;

                // Position along segment
                const segmentContrib = segmentPos * segmentWidth;

                // Fold direction alternates
                if (isEvenSeg) {
                    // Even segments: fold surface curves upward
                    const bendAmount = Math.sin(segmentPos * Math.PI) * eased * 0.08;
                    newX += segmentContrib * (1 - eased * 0.7);
                    newZ += bendAmount + segmentIndex * 0.012 * eased;
                } else {
                    // Odd segments: fold surface curves downward slightly  
                    const bendAmount = Math.sin(segmentPos * Math.PI) * eased * 0.06;
                    newX += segmentContrib * (1 - eased * 0.7);
                    newZ += bendAmount + segmentIndex * 0.012 * eased + 0.02 * eased;
                }

                // Final compression toward center
                const compressionFactor = 1 - eased * 0.75;
                const centerOffset = (normalizedX - 0.5) * PAPER_WIDTH * compressionFactor;

                // Blend between accordion shape and centered position
                const blendFactor = eased * eased; // More compression at end
                const finalX = newX * (1 - blendFactor * 0.5) + centerOffset * blendFactor * 0.5;

                // Final Z with layering
                const layerZ = 0.03 + (segmentIndex * 0.01) * eased;
                const foldZ = Math.sin(segmentPos * Math.PI) * 0.03 * (1 - eased * 0.8);
                const finalZ = layerZ + foldZ + 0.02;

                positions.setX(i, finalX);
                positions.setZ(i, finalZ);
            }

            positions.needsUpdate = true;
            geometry.computeVertexNormals();

            // Trigger callback when accordion fold is complete
            if (rollProgress.current >= 1 && !foldCompleteTriggered.current) {
                foldCompleteTriggered.current = true;
                onFoldComplete?.();

                // Start paper movement after cap has time to open
                setTimeout(() => {
                    setIsMovingToBottle(true);
                    moveProgress.current = 0;
                }, 1500); // Wait for cap animation
            }
        }

        // Paper movement to bottle animation
        if (isMovingToBottle && groupRef.current) {
            // Increase progress
            if (moveProgress.current < 1) {
                moveProgress.current = Math.min(1, moveProgress.current + delta * 0.5);
            }

            // Easing
            const t = moveProgress.current;
            const eased = t < 0.5
                ? 2 * t * t
                : 1 - Math.pow(-2 * t + 2, 2) / 2;

            // Move toward bottle position
            // Paper starts at [0, 0.07, 2], bottle is at [0.8, 0.12, 2.5]
            // First move forward (Z), then sideways (X) to bottle
            const targetX = 1.1;
            const targetZ = 1.2;
            const liftY = 0.3; // Lift up while moving

            // Arc movement
            groupRef.current.position.x = eased * targetX;
            groupRef.current.position.z = position[2] + eased * (targetZ - position[2]);
            groupRef.current.position.y = position[1] + Math.sin(eased * Math.PI) * liftY;
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

            {/* Main Paper Mesh - FRONT (with texture before fold, white after) */}
            <mesh ref={paperRef} rotation={[-Math.PI / 2, 0, 0]} onClick={handlePaperClick}>
                <planeGeometry args={[PAPER_WIDTH, PAPER_HEIGHT, 20, 20]} />
                {!isRolling ? (
                    <meshStandardMaterial
                        map={paperTexture}
                        transparent
                        alphaTest={0.5}
                        side={THREE.FrontSide}
                        roughness={0.9}
                    />
                ) : (
                    <meshStandardMaterial
                        color="#f8f8f5"
                        side={THREE.DoubleSide}
                        roughness={0.9}
                    />
                )}
            </mesh>

            {/* Paper BACK (white) - only visible before rolling */}
            {!isRolling && (
                <mesh ref={backPaperRef} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[PAPER_WIDTH, PAPER_HEIGHT, 20, 20]} />
                    <meshStandardMaterial
                        color="#f5f5f0"
                        side={THREE.BackSide}
                        roughness={0.9}
                    />
                </mesh>
            )}

            {/* === INTERACTIVE FIELDS === */}
            {/* Hide text fields and button when folding animation is active */}
            {!isFolding && (
                <>
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
                        text={isSubmitting ? 'SENDING...' : 'SEND'}
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
                            {errors.email || errors.subject || errors.message || 'Please fill all fields'}
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
                            Message sent! ✓
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
                            Failed to send. Try again.
                        </Text>
                    )}
                </>
            )}
        </group>
    );
};

export default MessagePaper;
