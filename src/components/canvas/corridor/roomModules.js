// A room's module (including any model preloads) is evaluated only on intent.
// Native import caching also reuses successful hover/click prefetches.
const roomLoaders = {
    gallery: () => import('../rooms/Gallery/GalleryRoom'),
    studio: () => import('../rooms/Studio/StudioRoom'),
    about: () => import('../rooms/About/AboutRoom'),
    contact: () => import('../rooms/Contact/ContactRoom'),
};

export function loadRoom(roomId) {
    return roomLoaders[roomId]?.();
}

export function preloadRoom(roomId) {
    // A failed speculative fetch must not poison React.lazy's later retry.
    loadRoom(roomId)?.catch(() => {});
}
