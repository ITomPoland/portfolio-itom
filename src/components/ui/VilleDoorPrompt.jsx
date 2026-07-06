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
        <div style={wrapStyle}>
            <button
                type="button"
                onClick={() => teleportTo(villeNearDoor.roomId)}
                style={btnStyle}
                aria-label={`Entrer dans ${villeNearDoor.label}`}
            >
                <span style={keyStyle}>⏎</span> Entrer — {villeNearDoor.label}
            </button>
        </div>
    );
}

const wrapStyle = {
    position: 'fixed',
    left: '50%',
    // sits above the VilleNavToggle + hint block
    bottom: 'calc(max(1rem, env(safe-area-inset-bottom)) + 5.5rem)',
    transform: 'translateX(-50%)',
    zIndex: 61,
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
