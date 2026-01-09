import { createContext, useContext, useState, useCallback } from 'react';

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

    const enterRoom = useCallback((roomId) => {
        setCurrentRoom(roomId);
        setExitRequested(false); // Clear any pending exit request
    }, []);

    const exitRoom = useCallback(() => {
        setCurrentRoom(null);
        setExitRequested(false);
    }, []);

    // Request exit - this signals to DoorSection to trigger exit animation
    const requestExit = useCallback(() => {
        setExitRequested(true);
    }, []);

    // Clear exit request - called by DoorSection after handling
    const clearExitRequest = useCallback(() => {
        setExitRequested(false);
    }, []);

    const markEntered = useCallback(() => {
        setHasEntered(true);
    }, []);

    const value = {
        currentRoom,
        hasEntered,
        exitRequested,
        enterRoom,
        exitRoom,
        requestExit,
        clearExitRequest,
        markEntered,
        isInRoom: currentRoom !== null,
    };

    return (
        <SceneContext.Provider value={value}>
            {children}
        </SceneContext.Provider>
    );
};

export default SceneContext;
