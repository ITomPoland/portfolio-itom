import { useEffect } from 'react';
import { useScene } from '../../context/SceneContext';

/**
 * VilleDoorPrompt — video-game style door entry. When the visitor walks up to an
 * enterable building door (proximity computed by MiniVille → villeNearDoor), shows a
 * centred "Entrer" prompt; Entrée/E on keyboard or a tap triggers the SAME teleport
 * flow as clicking the door arrow (teleportTo keeps room-entry ownership).
 * Minimal glass style — restyle belongs to Claude Design.
 */
export default function VilleDoorPrompt() {
    const { villeNearDoor, teleportTo, isTeleporting, isInRoom } = useScene();
    const active = !!villeNearDoor && !isTeleporting && !isInRoom;

    useEffect(() => {
        if (!active) return undefined;
        const onKey = (e) => {
            if (e.repeat) return;
            if (e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'KeyE') {
                e.preventDefault();
                teleportTo(villeNearDoor.roomId);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [active, villeNearDoor, teleportTo]);

    if (!active) return null;

    return (
        <div style={wrapStyle} aria-live="polite">
            <button
                type="button"
                onClick={() => teleportTo(villeNearDoor.roomId)}
                style={btnStyle}
                aria-label={`Entrer dans ${villeNearDoor.label}`}
            >
                <span style={keyStyle}>⏎</span>
                <span style={labelStyle}>Entrer — {villeNearDoor.label}</span>
            </button>
        </div>
    );
}

const wrapStyle = {
    position: 'fixed',
    left: '50%',
    // clears BOTH the bottom-centre VilleNavToggle block and the bottom-right
    // VilleThemeToggle row (+5.5rem) so nothing collides on 320px-wide screens
    bottom: 'calc(max(1rem, env(safe-area-inset-bottom)) + 9rem)',
    transform: 'translateX(-50%)',
    zIndex: 61,
    maxWidth: '92vw',
    pointerEvents: 'none',
};

const btnStyle = {
    pointerEvents: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: '0.55rem',
    minHeight: '48px',
    padding: '0.7rem 1.3rem',
    borderRadius: '999px',
    border: '1px solid rgba(159, 224, 187, 0.55)',
    background: 'rgba(18, 16, 20, 0.72)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    color: '#F7F4EE',
    font: '700 1rem/1 Sora, system-ui, sans-serif',
    letterSpacing: '0.01em',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    maxWidth: '100%',
};

const labelStyle = {
    // long building labels ellipsize instead of pushing past 320px-wide screens
    overflow: 'hidden',
    textOverflow: 'ellipsis',
};

const keyStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '1.6rem',
    height: '1.6rem',
    padding: '0 0.3rem',
    borderRadius: '6px',
    border: '1px solid rgba(247, 244, 238, 0.4)',
    background: 'rgba(247, 244, 238, 0.12)',
    fontSize: '0.95rem',
};
