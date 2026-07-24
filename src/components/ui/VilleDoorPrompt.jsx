import { useEffect } from 'react';
import { useScene } from '../../context/SceneContext';

/**
 * VilleDoorPrompt — video-game style door entry. When the visitor walks up to an
 * enterable building door (proximity computed by MiniVille → villeNearDoor), shows a
 * centred "Entrer" prompt; Entrée/E on keyboard or a tap triggers the SAME teleport
 * flow as clicking the door arrow (teleportTo keeps room-entry ownership).
 * Miora Brief 2 style: night-glass pill, mint (#9FE0BB) halo pulse, Sora type.
 * Per the brief, the Contact kiosk invites to « Écrire » instead of « Entrer ».
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

    const verb = villeNearDoor.id === 'contact' ? 'Écrire' : 'Entrer';

    return (
        <div style={wrapStyle} aria-live="polite">
            {/* Local keyframes for the mint halo pulse (Miora approach feedback) */}
            <style>{`
                @keyframes ville-door-prompt-glow {
                    0%, 100% { box-shadow: 0 0 14px rgba(159, 224, 187, 0.35), 0 0 2px rgba(159, 224, 187, 0.5); }
                    50% { box-shadow: 0 0 26px rgba(159, 224, 187, 0.6), 0 0 4px rgba(159, 224, 187, 0.8); }
                }
            `}</style>
            <button
                type="button"
                onClick={() => teleportTo(villeNearDoor.roomId)}
                style={btnStyle}
                aria-label={`${verb} — ${villeNearDoor.label}`}
            >
                <span style={keyStyle}>⏎</span>
                <span style={labelStyle}>{verb} — {villeNearDoor.label}</span>
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
    border: '1px solid rgba(159, 224, 187, 0.75)',
    background: 'rgba(13, 18, 32, 0.78)', // Miora night-sky glass (#0D1220)
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    color: '#F7F4EE',
    font: '700 1rem/1 Sora, system-ui, sans-serif',
    letterSpacing: '0.02em',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    maxWidth: '100%',
    animation: 'ville-door-prompt-glow 2s ease-in-out infinite',
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
    border: '1px solid rgba(159, 224, 187, 0.55)',
    background: 'rgba(159, 224, 187, 0.14)',
    color: '#9FE0BB',
    fontSize: '0.95rem',
};
