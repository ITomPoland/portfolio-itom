import { useState, useEffect } from 'react';
import { projects as localProjects } from '../data/projects';
import { studioContent as localStudioContent } from '../data/studioContent';
import { awards as localAwards } from '../data/awards';

// Globalny cache dla danych lokalnych
const cache = {
    projects: null,
    content: null,
    awards: null,
    loading: false,
    loaded: false,
    error: null,
};

let loadPromise = null;
const listeners = new Set();

function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

function notifyUpdate() {
    listeners.forEach(l => l());
}

// Data is local. Consumers load their own images when the room is mounted.
// Do not fetch certificates or upload gallery textures just to read metadata.
export function loadSanityData() {
    if (loadPromise) {
        return loadPromise;
    }

    cache.loading = true;

    try {
        // Dane lokalne wypełniamy synchronicznie — bez żadnych zapytań sieciowych
        cache.projects = localProjects;
        cache.content = localStudioContent;
        cache.awards = localAwards;

        cache.loaded = true;
        cache.loading = false;
    } catch (error) {
        console.error('Error preloading local data:', error);
        cache.error = error;
        cache.loading = false;
        // Oznaczamy jako załadowane w razie błędu, żeby aplikacja nie wisiała w nieskończoność na preloaderze
        cache.loaded = true;
    }

    notifyUpdate();
    loadPromise = Promise.resolve(cache);
    return loadPromise;
}

export function isSanityDataLoaded() {
    return cache.loaded;
}

export function useGalleryProjects() {
    const [projects, setProjects] = useState(cache.projects);

    useEffect(() => {
        loadSanityData();

        if (cache.loaded) {
            setProjects(cache.projects);
            return;
        }

        const handleUpdate = () => {
            setProjects(cache.projects);
        };

        return subscribe(handleUpdate);
    }, []);

    return projects;
}

export function useStudioContent() {
    const [content, setContent] = useState(cache.content);

    useEffect(() => {
        loadSanityData();

        if (cache.loaded) {
            setContent(cache.content);
            return;
        }

        const handleUpdate = () => {
            setContent(cache.content);
        };

        return subscribe(handleUpdate);
    }, []);

    return content;
}

export function useAwards() {
    const [awardsData, setAwardsData] = useState(cache.awards);

    useEffect(() => {
        loadSanityData();

        if (cache.loaded) {
            setAwardsData(cache.awards);
            return;
        }

        const handleUpdate = () => {
            setAwardsData(cache.awards);
        };

        return subscribe(handleUpdate);
    }, []);

    return awardsData;
}

// Automatyczne odpalenie pobierania przy załadowaniu modułu JS
loadSanityData();
