import { useState, useEffect } from 'react';
import { useScene } from '../../context/SceneContext';
import { useAudio } from '../../context/AudioManager';
import '../../styles/NavigationUI.scss';

// Room data for the map
const ROOMS = [
    { id: 'entrance', label: 'Entrance', x: 50, y: 15 },
    { id: 'about', label: 'About', x: 25, y: 45 },
    { id: 'portfolio', label: 'Portfolio', x: 75, y: 45 },
    { id: 'gallery', label: 'Gallery', x: 25, y: 75 },
    { id: 'contact', label: 'Contact', x: 75, y: 75 },
];

const NavigationUI = () => {
    const { currentRoom, isInRoom, requestExit, hasEntered } = useScene();
    const { isMuted, toggleMute } = useAudio();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showCorridorHint, setShowCorridorHint] = useState(false);

    // Show corridor hint when entering, auto-hide after 4 seconds
    useEffect(() => {
        if (hasEntered) {
            setShowCorridorHint(true);
            const timer = setTimeout(() => setShowCorridorHint(false), 4000);
            return () => clearTimeout(timer);
        }
    }, [hasEntered]);

    // Close menu when entering a room
    useEffect(() => {
        if (isInRoom) {
            setIsMenuOpen(false);
        }
    }, [isInRoom]);

    const handleRoomClick = (roomId) => {
        // TODO: Implement teleportation logic
        console.log('Teleport to:', roomId);
        setIsMenuOpen(false);
    };

    const handleBackClick = () => {
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

            {/* Back Button - Only visible in rooms */}
            {hasEntered && isInRoom && (
                <button
                    className="nav-btn back-btn"
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
                <div className="nav-controls">
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

            {/* Map Panel - Only visible after entering */}
            {hasEntered && (
                <div className={`map-panel ${isMenuOpen ? 'open' : ''}`}>
                    <div className="map-header">
                        <h3>MAP</h3>
                    </div>
                    <div className="map-container">
                        {/* Connection lines */}
                        <svg className="map-connections" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <path d="M50 15 L50 45" />
                            <path d="M25 45 L75 45" />
                            <path d="M25 45 L25 75" />
                            <path d="M75 45 L75 75" />
                        </svg>

                        {/* Room nodes */}
                        {ROOMS.map((room) => (
                            <button
                                key={room.id}
                                className={`map-room ${currentRoom === room.id ? 'current' : ''} ${room.id === 'entrance' && !isInRoom ? 'current' : ''}`}
                                style={{ left: `${room.x}%`, top: `${room.y}%` }}
                                onClick={() => handleRoomClick(room.id)}
                            >
                                <span className="room-dot"></span>
                                <span className="room-label">{room.label}</span>
                            </button>
                        ))}
                    </div>
                    <div className="map-legend">
                        <span className="legend-dot"></span>
                        <span>You are here</span>
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
