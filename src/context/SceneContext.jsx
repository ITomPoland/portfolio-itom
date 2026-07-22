import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { VILLE_THEME_STORAGE_KEY, getStoredVilleTheme } from '../components/canvas/ville/villeConfig';

const SceneContext = createContext(null);

/**
 * Custom React hook to access the SceneContext.
 *
 * @throws {Error} Throws an error if used outside of a SceneProvider.
 * @returns {Object} The current scene state machine and action methods.
 */
export const useScene = () => {
    const context = useContext(SceneContext);
    if (!context) {
        throw new Error('useScene must be used within a SceneProvider');
    }
    return context;
};

/**
 * SceneProvider Component.
 *
 * Root state machine managing current room state, 2D overlay data,
 * room entry/exit requests, teleportation state transitions,
 * and mini-ville navigation & theme settings.
 *
 * INVARIANT: Additive changes only. Sub-systems rely on exact function signatures.
 *
 * @param {Object} props - Component props.
 * @param {React.ReactNode} props.children - Child components to render within context.
 * @returns {React.ReactElement} Provider wrapped children.
 */
export const SceneProvider = ({ children }) => {
    const [currentRoom, setCurrentRoom] = useState(null); // null = corridor, 'about', 'portfolio', etc.
    const [hasEntered, setHasEntered] = useState(false);  // Has user clicked entrance doors?
    const [exitRequested, setExitRequested] = useState(false); // Signal to request exit from room
    const [overlayContent, setOverlayContent] = useState(null); // Content for overlay (Studio monitor etc)
    const [villeNavMode, setVilleNavMode] = useState('guide'); // 'guide' (scroll tour, default) | 'libre' (free walk)
    const [villeTheme, setVilleTheme] = useState(getStoredVilleTheme); // 'auto' (clock) | 'jour' | 'nuit'
    const [villeNearDoor, setVilleNearDoor] = useState(null); // VILLE_BUILDINGS entry when the visitor stands at an enterable door
    const [villeInfoCard, setVilleInfoCard] = useState(null); // VILLE_BUILDINGS entry whose info card is shown (guided tour)
    const [villeSelfie, setVilleSelfie] = useState(false); // drone selfie sequence in progress (button → VilleLife)

    // Teleportation states
    const [teleportTarget, setTeleportTarget] = useState(null); // Room ID to teleport to
    const [isTeleporting, setIsTeleporting] = useState(false);  // Currently in teleport transition
    const [teleportPhase, setTeleportPhase] = useState(null);   // 'closing' | 'teleporting' | 'opening' | null
    const [pendingDoorClick, setPendingDoorClick] = useState(null); // Label of door to click after teleport
    const [isFastTeleport, setIsFastTeleport] = useState(false); // Fast teleport in progress (skip animations)

    // Inspecting state removed to avoid global re-renders

    const enterRoom = useCallback((roomId) => {
        setCurrentRoom(roomId);
        setExitRequested(false); // Clear any pending exit request
        setOverlayContent(null); // Clear overlay on room change

        // Teleportation cleanup - if we just teleported in
        // Note: isFastTeleport is cleared by signalRoomReady, not here
        // Don't clear teleportPhase if it's 'opening' - let the paper animation complete
        setIsTeleporting(false);
        setPendingDoorClick(null);
        // teleportPhase is cleared by finishPaperOpen after animation
    }, []);

    const exitRoom = useCallback(() => {
        setCurrentRoom(null);
        setExitRequested(false);
        setOverlayContent(null);
    }, []);

    // Request exit - this signals to DoorSection to trigger exit animation
    const requestExit = useCallback(() => {
        setExitRequested(true);
        setOverlayContent(null);
    }, []);

    // Clear exit request - called by DoorSection after handling
    const clearExitRequest = useCallback(() => {
        setExitRequested(false);
    }, []);

    const markEntered = useCallback(() => {
        setHasEntered(true);
    }, []);

    const openOverlay = useCallback((content) => {
        setOverlayContent(content);
    }, []);

    const closeOverlay = useCallback(() => {
        setOverlayContent(null);
    }, []);

    const toggleVilleNavMode = useCallback(() => {
        setVilleNavMode((m) => (m === 'guide' ? 'libre' : 'guide'));
    }, []);

    const cycleVilleTheme = useCallback(() => {
        setVilleTheme((t) => {
            const next = t === 'auto' ? 'jour' : t === 'jour' ? 'nuit' : 'auto';
            try {
                localStorage.setItem(VILLE_THEME_STORAGE_KEY, next);
            } catch {
                // storage unavailable — theme still applies for this session
            }
            return next;
        });
    }, []);

    // Teleportation functions

    // Initiate teleport - called when user clicks room on map
    const teleportTo = useCallback((roomId) => {
        if (isTeleporting || roomId === currentRoom) return; // Prevent double teleport or same room

        setTeleportTarget(roomId);
        setIsTeleporting(true);
        setIsFastTeleport(true); // Enable fast teleport mode
        setTeleportPhase('closing'); // Paper starts closing
        setOverlayContent(null);
    }, [isTeleporting, currentRoom]);

    // Called when paper close animation completes - actually move camera
    const startTeleportTransition = useCallback(() => {
        setTeleportPhase('teleporting');
        // Camera will be moved here by listening components
    }, []);

    // Called when teleport is ready (room loaded) - start paper open animation
    // During fast teleport, this is called AFTER camera is inside room
    const openTeleportTransition = useCallback(() => {
        setTeleportPhase('opening');
    }, []);

    // Called when paper open animation completes - cleanup
    const completeTeleport = useCallback(() => {
        // During FAST teleport: paper stays closed, trigger door click immediately
        // The paper will open when signalRoomReady() is called by DoorSection
        setPendingDoorClick(teleportTarget);

        // Don't clear isTeleporting yet! Wait for enterRoom() logic to finish
        // We only clear target here (phase cleared later)
        setTeleportTarget(null);
        // Note: teleportPhase stays at 'teleporting' during fast teleport so paper remains closed
    }, [teleportTarget]);

    // Called by DoorSection when camera has finished entering the room during fast teleport
    // This opens the paper and completes the teleport sequence
    const signalRoomReady = useCallback(() => {
        if (isFastTeleport) {
            // Now open the paper
            setTeleportPhase('opening');
            setIsFastTeleport(false);
        }
    }, [isFastTeleport]);

    // Called by PaperTransition when paper open animation finishes
    // This just clears the phase - teleport logic is already done
    const finishPaperOpen = useCallback(() => {
        setTeleportPhase(null);
    }, []);

    // REMOVED clearPendingDoorClick - it's now handled in enterRoom

    // Cancel teleport (in case of error)
    const cancelTeleport = useCallback(() => {
        setTeleportTarget(null);
        setIsTeleporting(false);
        setTeleportPhase(null);
        setPendingDoorClick(null);
        setIsFastTeleport(false);
    }, []);

    const value = useMemo(() => ({
        currentRoom,
        hasEntered,
        exitRequested,
        overlayContent, // Exposed
        enterRoom,
        exitRoom,
        requestExit,
        clearExitRequest,
        markEntered,
        openOverlay,    // Exposed
        closeOverlay,   // Exposed
        villeNavMode,
        setVilleNavMode,
        toggleVilleNavMode,
        villeTheme,
        cycleVilleTheme,
        villeNearDoor,
        setVilleNearDoor,
        villeInfoCard,
        setVilleInfoCard,
        villeSelfie,
        setVilleSelfie,
        isInRoom: currentRoom !== null,
        // Teleportation
        teleportTarget,
        isTeleporting,
        teleportPhase,
        pendingDoorClick,
        isFastTeleport,
        teleportTo,
        startTeleportTransition,
        openTeleportTransition,
        completeTeleport,
        signalRoomReady,
        finishPaperOpen,
        cancelTeleport,
    }), [
        currentRoom,
        hasEntered,
        exitRequested,
        overlayContent,
        enterRoom,
        exitRoom,
        requestExit,
        clearExitRequest,
        markEntered,
        openOverlay,
        closeOverlay,
        villeNavMode,
        setVilleNavMode,
        toggleVilleNavMode,
        villeTheme,
        cycleVilleTheme,
        villeNearDoor,
        setVilleNearDoor,
        villeInfoCard,
        setVilleInfoCard,
        villeSelfie,
        setVilleSelfie,
        // Teleportation dependencies
        teleportTarget,
        isTeleporting,
        teleportPhase,
        pendingDoorClick,
        isFastTeleport,
        teleportTo,
        startTeleportTransition,
        openTeleportTransition,
        completeTeleport,
        signalRoomReady,
        finishPaperOpen,
        cancelTeleport
    ]);

    return (
        <SceneContext.Provider value={value}>
            {children}
        </SceneContext.Provider>
    );
};

export default SceneContext;
