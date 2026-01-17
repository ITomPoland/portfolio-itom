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
                        <img src="/images/map.png" alt="Portfolio Map" className="map-image" />

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
                                <img src="/images/pin-slot.png" alt="" className="slot-image" />
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
                            <img src="/images/pin.png" alt="You are here" className="pin-image" />
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
