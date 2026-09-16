import React from 'react';
import { useAchievements, ACHIEVEMENTS } from '../../context/AchievementsContext';
import { useAudio } from '../../context/AudioManager';
import { toggleMute as toggleBgmMute, getIsMuted as getBgmMuted, setMusicVolume } from '../../utils/audioManager';
import '../../styles/AchievementPopup.scss';

const AchievementPopup = () => {
    const { activePopup } = useAchievements();
    const { isMuted, toggleMute, setGlobalVolume } = useAudio();

    if (!activePopup) return null;

    const data = ACHIEVEMENTS[activePopup.id];
    if (!data) return null;

    const isCompleted = activePopup.status === 'completed';
    const isHiding = activePopup.status === 'hiding';

    // Specjalna logika dla corridor_enter (pytanie o dźwięk)
    const isSoundPrompt = activePopup.id === 'corridor_enter';

    return (
        <div
            className={`achievement-popup ${isCompleted ? 'completed' : ''} ${isHiding ? 'hiding' : ''} ${isSoundPrompt ? 'interactive' : ''}`}
            style={isSoundPrompt ? { pointerEvents: 'auto' } : {}}
        >
            {/* SVG Border Overlay */}
            <svg
                className="popup-border"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
            >
                <path
                    d="M 0 0 L 100 0 L 100 0 L 98 10 L 100 20 L 97 35 L 100 50 L 98 65 L 100 80 L 97 90 L 100 100 L 90 97 L 80 100 L 70 96 L 60 100 L 50 97 L 40 100 L 30 96 L 20 100 L 10 97 L 0 100 L 0 100 L 2 90 L 0 80 L 3 65 L 0 50 L 2 35 L 0 20 L 3 10 L 0 0 Z"
                    fill="none"
                    stroke="#1a1a1a"
                    strokeWidth="0.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                />
            </svg>
            <div className="popup-content">
                {!isSoundPrompt && (
                    <div className={`checkbox ${isCompleted ? 'checked' : ''}`}>
                        {isCompleted && (
                            <svg viewBox="0 0 24 24" className="checkmark">
                                <path d="M5 13l4 4L19 7" fill="none" stroke="#1a1a1a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        )}
                    </div>
                )}
                <div className="text-content" style={isSoundPrompt ? { alignItems: 'center', textAlign: 'center' } : {}}>
                    <span className="title">{data.title}</span>

                    {!isSoundPrompt ? (
                        <span className="description">{data.label}</span>
                    ) : (
                        <span className="description">
                            点击一扇门即可进入。当前音频
                            <button
                                className={`inline-sound-toggle ${!isMuted ? 'on' : 'off'}`}
                                onClick={(e) => {
                                    e.stopPropagation();

                                    const willMute = !isMuted;

                                    // 1. Oprogramowujemy flagi MUTE (dla silnika i utilsa)
                                    if (isMuted !== willMute) toggleMute();
                                    if (getBgmMuted() !== willMute) toggleBgmMute();

                                    // 2. Wymuszamy fizyczne zjechanie pasków głośności, 
                                    // żeby menu się zsynchronizowało z ustawieniami z wejścia
                                    if (willMute) {
                                        setGlobalVolume(0);
                                        setMusicVolume(0);
                                    } else {
                                        setGlobalVolume(1.0); // 100% SFX
                                        setMusicVolume(0.3);  // 30% BGM
                                    }
                                }}
                            >
                                {!isMuted ? " [🔊 开]" : " [🔇 关]"}
                            </button>
                        </span>
                    )}
                </div>

            </div>
        </div>
    );
};

export default AchievementPopup;
