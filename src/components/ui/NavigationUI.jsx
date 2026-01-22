import { useState, useEffect } from 'react';
import { useScene } from '../../context/SceneContext';
import { useAudio } from '../../context/AudioManager';
import '../../styles/NavigationUI.scss';

// Room data for the map - positions are percentages on the map image
// These positions correspond to the visual elements on the map
const ROOMS = [
    { id: 'about', label: 'About', x: 43, y: 38 },      // Paper airplane (left side)
    { id: 'gallery', label: 'Gallery', x: 43, y: 72 },  // City buildings (bottom left)
    { id: 'contact', label: 'Contact', x: 57, y: 25 },  // Pier/dock (top right)
    { id: 'studio', label: 'Studio', x: 57, y: 55 },    // Monitors stack (right side)
];

// Pin starting position - the dashed circle at the bottom of the tower
const PIN_START_POSITION = { x: 50.5, y: 97 };

const NavigationUI = () => {
    const { currentRoom, isInRoom, requestExit, hasEntered, teleportTo, isTeleporting } = useScene();
    const { isMuted, toggleMute } = useAudio();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showCorridorHint, setShowCorridorHint] = useState(false);
    const [hoveredRoom, setHoveredRoom] = useState(null); // Track which pin slot is hovered
    const [isExiting, setIsExiting] = useState(false); // Track when back button is clicked

    // Show corridor hint when entering, auto-hide after 4 seconds
    useEffect(() => {
        if (hasEntered) {
            setShowCorridorHint(true);
            const timer = setTimeout(() => setShowCorridorHint(false), 4000);
            return () => clearTimeout(timer);
        }
    }, [hasEntered]);

    // Close menu when entering a room or starting teleport
    useEffect(() => {
        if (isInRoom || isTeleporting) {
            setIsMenuOpen(false);
            setIsExiting(false);
        }
    }, [isInRoom, isTeleporting]);

    // Reset exiting state when not in room anymore
    useEffect(() => {
        if (!isInRoom) {
            setIsExiting(false);
        }
    }, [isInRoom]);

    const handleRoomClick = (roomId) => {
        // Don't teleport to the same room or if already teleporting
        if (roomId === currentRoom || isTeleporting) return;

        // Close map first, then start teleport
        setIsMenuOpen(false);
        teleportTo(roomId);
    };

    const handleBackClick = () => {
        setIsExiting(true); // Immediately start exit animation
        // Request exit - DoorSection will handle the animation
        requestExit();
    };

    return (
        <div className="navigation-ui">
            {/* Entrance Hint - Before entering */}
            {!hasEntered && (
                <div className="entrance-hint">
                    <span>👆 Click doors to enter</span>
                </div>
            )}

            {/* Back Button - Only visible in rooms, hides up when clicked */}
            {hasEntered && isInRoom && (
                <button
                    className={`nav-btn back-btn ${isExiting ? 'exiting' : ''}`}
                    onClick={handleBackClick}
                    aria-label="Back to corridor"
                >
                    <svg viewBox="0 0 24 24" className="icon-back">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                </button>
            )}

            {/* Right side controls - Only visible after entering */}
            {hasEntered && (
                <div className={`nav-controls ${isMenuOpen ? 'menu-open' : ''}`}>
                    {/* Hamburger Menu Button */}
                    <button
                        className={`nav-btn hamburger-btn ${isMenuOpen ? 'open' : ''}`}
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label="Toggle menu"
                        aria-expanded={isMenuOpen}
                    >
                        <div className="hamburger-icon">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </button>

                    {/* Audio Toggle Button */}
                    <button
                        className="nav-btn audio-btn"
                        onClick={toggleMute}
                        aria-label={isMuted ? "Unmute" : "Mute"}
                    >
                        {isMuted ? (
                            <svg viewBox="0 0 24 24" className="icon-audio">
                                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                                <line x1="23" y1="9" x2="17" y2="15" />
                                <line x1="17" y1="9" x2="23" y2="15" />
                            </svg>
                        ) : (
                            <svg viewBox="0 0 24 24" className="icon-audio">
                                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                                <path d="M15 9a5 5 0 0 1 0 6" />
                                <path d="M18 5a9 9 0 0 1 0 14" />
                            </svg>
                        )}
                    </button>
                </div>
            )}

            {/* Map Panel - Drops from top when open */}
            {hasEntered && (
                <div className={`map-panel ${isMenuOpen ? 'open' : ''}`}>
                    {/* SVG Border Overlay */}
                    <svg
                        className="map-border-overlay"
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            pointerEvents: 'none',
                            zIndex: 10
                        }}
                    >
                        <path
                            d="M 0 0 L 100 0 L 100 0 L 99 3 L 100 6 L 98 10 L 100 14 L 99 18 L 100 22 L 98 26 L 100 30 L 99 35 L 100 40 L 98 45 L 100 50 L 99 55 L 100 60 L 98 65 L 100 70 L 99 75 L 100 80 L 98 85 L 100 90 L 99 95 L 100 100 L 96 99 L 92 100 L 88 98 L 84 100 L 80 99 L 76 100 L 72 98 L 68 100 L 64 99 L 60 100 L 56 98 L 52 100 L 48 99 L 44 100 L 40 98 L 36 100 L 32 99 L 28 100 L 24 98 L 20 100 L 16 99 L 12 100 L 8 98 L 4 100 L 0 99 L 0.5 99.5 L 1 95 L 0 90 L 2 85 L 0 80 L 1 75 L 0 70 L 2 65 L 0 60 L 1 55 L 0 50 L 2 45 L 0 40 L 1 35 L 0 30 L 2 26 L 0 22 L 1 18 L 0 14 L 2 10 L 0 6 L 1 3 L 0 0 Z"
                            fill="none"
                            stroke="#1a1a1a"
                            strokeWidth="0.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            vectorEffect="non-scaling-stroke"
                        />
                    </svg>

                    <div className="map-content-clipped">
                        <div className="map-header">
                            <h3>MAP</h3>
                            <button
                                className="close-btn"
                                onClick={() => setIsMenuOpen(false)}
                                aria-label="Close map"
                            >
                                <svg viewBox="0 0 24 24">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="map-container">
                            {/* Map background image */}
                            <img src="/images/map.webp" alt="Portfolio Map" className="map-image" />

                            {/* Pin slot markers - 4 locations */}
                            {ROOMS.map((room) => (
                                <button
                                    key={room.id}
                                    className={`pin-slot ${currentRoom === room.id ? 'active' : ''} ${hoveredRoom === room.id ? 'hovered' : ''}`}
                                    style={{ left: `${room.x}%`, top: `${room.y}%` }}
                                    onClick={() => handleRoomClick(room.id)}
                                    onMouseEnter={() => setHoveredRoom(room.id)}
                                    onMouseLeave={() => setHoveredRoom(null)}
                                    title={room.label}
                                >
                                    <img src="/images/pin-slot.webp" alt="" className="slot-image" />
                                </button>
                            ))}

                            {/* The pin marker - moves to hovered slot, or current room, or start position */}
                            <div
                                className="pin-marker"
                                style={{
                                    left: `${hoveredRoom
                                        ? ROOMS.find(r => r.id === hoveredRoom)?.x || PIN_START_POSITION.x
                                        : currentRoom && isInRoom
                                            ? ROOMS.find(r => r.id === currentRoom)?.x || PIN_START_POSITION.x
                                            : PIN_START_POSITION.x
                                        }%`,
                                    top: `${hoveredRoom
                                        ? ROOMS.find(r => r.id === hoveredRoom)?.y || PIN_START_POSITION.y
                                        : currentRoom && isInRoom
                                            ? ROOMS.find(r => r.id === currentRoom)?.y || PIN_START_POSITION.y
                                            : PIN_START_POSITION.y
                                        }%`
                                }}
                            >
                                <img src="/images/pin.webp" alt="You are here" className="pin-image" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Overlay to close menu */}
            {isMenuOpen && (
                <div
                    className="menu-overlay"
                    onClick={() => setIsMenuOpen(false)}
                />
            )}

            {/* Corridor Hint - Shows after entering */}
            {showCorridorHint && !isInRoom && (
                <div className="corridor-hint">
                    <span>🖱️ Scroll to explore</span>
                </div>
            )}
        </div>
    );
};

export default NavigationUI;
