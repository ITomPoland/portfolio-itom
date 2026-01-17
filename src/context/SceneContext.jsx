import { createContext, useContext, useState, useCallback, useMemo } from 'react';

const SceneContext = createContext(null);

export const useScene = () => {
    const context = useContext(SceneContext);
    if (!context) {
        throw new Error('useScene must be used within a SceneProvider');
    }
    return context;
};

export const SceneProvider = ({ children }) => {
    const [currentRoom, setCurrentRoom] = useState(null); // null = corridor, 'about', 'portfolio', etc.
    const [hasEntered, setHasEntered] = useState(false);  // Has user clicked entrance doors?
    const [exitRequested, setExitRequested] = useState(false); // Signal to request exit from room
    const [overlayContent, setOverlayContent] = useState(null); // Content for overlay (Studio monitor etc)

    // Teleportation states
    const [teleportTarget, setTeleportTarget] = useState(null); // Room ID to teleport to
    const [isTeleporting, setIsTeleporting] = useState(false);  // Currently in teleport transition
    const [teleportPhase, setTeleportPhase] = useState(null);   // 'closing' | 'teleporting' | 'opening' | null
    const [pendingDoorClick, setPendingDoorClick] = useState(null); // Label of door to click after teleport

    const enterRoom = useCallback((roomId) => {
        setCurrentRoom(roomId);
        setExitRequested(false); // Clear any pending exit request
        setOverlayContent(null); // Clear overlay on room change

        // Teleportation cleanup - if we just teleported in
        setIsTeleporting(false);
        setPendingDoorClick(null);
        setTeleportPhase(null);
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

    // Teleportation functions

    // Initiate teleport - called when user clicks room on map
    const teleportTo = useCallback((roomId) => {
        if (isTeleporting || roomId === currentRoom) return; // Prevent double teleport or same room

        setTeleportTarget(roomId);
        setIsTeleporting(true);
        setTeleportPhase('closing'); // Paper starts closing
        setOverlayContent(null);
    }, [isTeleporting, currentRoom]);

    // Called when paper close animation completes - actually move camera
    const startTeleportTransition = useCallback(() => {
        setTeleportPhase('teleporting');
        // Camera will be moved here by listening components
    }, []);

    // Called when teleport is ready (room loaded) - start paper open animation
    const openTeleportTransition = useCallback(() => {
        setTeleportPhase('opening');
    }, []);

    // Called when paper open animation completes - cleanup
    const completeTeleport = useCallback(() => {
        // Trigger door click for the target room
        setPendingDoorClick(teleportTarget);

        // Don't clear isTeleporting yet! Wait for enterRoom() logic to finish
        // We only clear target and phase here
        setTeleportTarget(null);
        setTeleportPhase(null);
    }, [teleportTarget]);

    // REMOVED clearPendingDoorClick - it's now handled in enterRoom

    // Cancel teleport (in case of error)
    const cancelTeleport = useCallback(() => {
        setTeleportTarget(null);
        setIsTeleporting(false);
        setTeleportPhase(null);
        setPendingDoorClick(null);
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
        isInRoom: currentRoom !== null,
        // Teleportation
        teleportTarget,
        isTeleporting,
        teleportPhase,
        pendingDoorClick,
        teleportTo,
        startTeleportTransition,
        openTeleportTransition,
        completeTeleport,
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
        // Teleportation dependencies
        teleportTarget,
        isTeleporting,
        teleportPhase,
        pendingDoorClick,
        teleportTo,
        startTeleportTransition,
        openTeleportTransition,
        completeTeleport,
        cancelTeleport
    ]);

    return (
        <SceneContext.Provider value={value}>
            {children}
        </SceneContext.Provider>
    );
};

export default SceneContext;
