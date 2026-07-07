import React from 'react';
import { useAchievements, ACHIEVEMENTS } from '../../context/AchievementsContext';
import '../../styles/AchievementsPanel.scss';

const AchievementsPanel = ({ isOpen, onClose }) => {
    const { completed } = useAchievements();

    return (
        <div className={`achievements-panel ${isOpen ? 'open' : ''}`} inert={!isOpen ? true : undefined}>
            <div className="achievements-card">
                <div className="achievements-header">
                    <h3>SUCCÈS</h3>
                    <button
                        className="close-btn"
                        onClick={onClose}
                        aria-label="Fermer les succès"
                    >
                        <svg viewBox="0 0 24 24">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="achievements-list">
                    {Object.values(ACHIEVEMENTS).map((achievement) => {
                        const isUnlocked = completed.includes(achievement.id);
                        return (
                            <div key={achievement.id} className={`achievement-item ${isUnlocked ? 'unlocked' : 'locked'}`}>
                                <div className="achievement-icon">
                                    {isUnlocked ? (
                                        <svg viewBox="0 0 24 24" className="icon-unlocked">
                                            <path d="M12 15l-3-3 1.4-1.4 1.6 1.6 4.6-4.6L18 9" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                            <circle cx="12" cy="12" r="10" fill="none" stroke="#1a1a1a" strokeWidth="2" />
                                        </svg>
                                    ) : (
                                        <svg viewBox="0 0 24 24" className="icon-locked">
                                            <rect x="7" y="11" width="10" height="8" rx="2" fill="none" stroke="#666" strokeWidth="2" />
                                            <path d="M9 11V8a3 3 0 0 1 6 0v3" fill="none" stroke="#666" strokeWidth="2" />
                                        </svg>
                                    )}
                                </div>
                                <div className="achievement-text">
                                    <div className="achievement-title">{achievement.title}</div>
                                    <div className="achievement-label">{achievement.label}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="achievements-footer">
                    <span>{completed.length} / {Object.keys(ACHIEVEMENTS).length} EXPLORÉS</span>
                </div>
            </div>
        </div>
    );
};

export default AchievementsPanel;
