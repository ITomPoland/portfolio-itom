// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// jsdom doesn't implement media playback, so we swap in a fake Audio that tracks
// play/pause calls and mirrors the synchronous `paused` behaviour of the real element.
let audioInstances;
class FakeAudio {
    constructor(src) {
        this.src = src;
        this.paused = true;
        this.muted = false;
        this.volume = 1;
        this.loop = false;
        this.preload = '';
        this.playCalls = 0;
        this.pauseCalls = 0;
        this.loadCalls = 0;
        audioInstances.push(this);
    }
    load() { this.loadCalls += 1; }
    play() {
        this.playCalls += 1;
        this.paused = false;
        return Promise.resolve();
    }
    pause() {
        this.pauseCalls += 1;
        this.paused = true;
    }
}

async function loadAudioManager() {
    vi.resetModules();
    return import('../audioManager.js');
}

beforeEach(() => {
    audioInstances = [];
    vi.stubGlobal('Audio', FakeAudio);
    window.localStorage.clear();
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('audioManager — initAudio', () => {
    it('is idempotent (one Audio instance across repeated calls)', async () => {
        const { initAudio } = await loadAudioManager();
        initAudio();
        initAudio();
        expect(audioInstances).toHaveLength(1);
    });

    it('restores the muted state from localStorage', async () => {
        window.localStorage.setItem('audio_muted', 'true');
        const { initAudio, getIsMuted } = await loadAudioManager();
        initAudio();
        expect(getIsMuted()).toBe(true);
        expect(audioInstances[0].muted).toBe(true);
    });
});

describe('audioManager — play/pause', () => {
    it('playBackgroundMusic does not call play() again if already playing', async () => {
        const { playBackgroundMusic } = await loadAudioManager();
        playBackgroundMusic();
        const inst = audioInstances[0];
        expect(inst.playCalls).toBe(1);
        playBackgroundMusic();
        expect(inst.playCalls).toBe(1);
    });

    it('pauseBackgroundMusic does not call pause() if already paused', async () => {
        const { initAudio, pauseBackgroundMusic } = await loadAudioManager();
        initAudio();
        const inst = audioInstances[0];
        pauseBackgroundMusic();
        expect(inst.pauseCalls).toBe(0);
    });

    it('pauseBackgroundMusic pauses once while playing, and is a no-op afterwards', async () => {
        const { playBackgroundMusic, pauseBackgroundMusic } = await loadAudioManager();
        playBackgroundMusic();
        const inst = audioInstances[0];
        pauseBackgroundMusic();
        expect(inst.pauseCalls).toBe(1);
        pauseBackgroundMusic();
        expect(inst.pauseCalls).toBe(1);
    });
});

describe('audioManager — mute & volume', () => {
    it('toggleMute flips state and mirrors it onto the audio element', async () => {
        const { initAudio, toggleMute, getIsMuted } = await loadAudioManager();
        initAudio();
        expect(toggleMute()).toBe(true);
        expect(getIsMuted()).toBe(true);
        expect(audioInstances[0].muted).toBe(true);

        expect(toggleMute()).toBe(false);
        expect(getIsMuted()).toBe(false);
        expect(audioInstances[0].muted).toBe(false);
    });

    it('setMusicVolume clamps to [0, 1]', async () => {
        const { initAudio, setMusicVolume } = await loadAudioManager();
        initAudio();
        const inst = audioInstances[0];

        setMusicVolume(-5);
        expect(inst.volume).toBe(0);

        setMusicVolume(2);
        expect(inst.volume).toBe(1);
    });

    it('setMusicVolume auto-unmutes when raised above 0', async () => {
        const { initAudio, toggleMute, setMusicVolume, getIsMuted } = await loadAudioManager();
        initAudio();
        toggleMute();
        expect(getIsMuted()).toBe(true);

        setMusicVolume(0.5);
        expect(getIsMuted()).toBe(false);
        expect(audioInstances[0].muted).toBe(false);
    });

    it('setMusicVolume dispatches a musicVolumeChanged event', async () => {
        const { initAudio, setMusicVolume } = await loadAudioManager();
        initAudio();

        const handler = vi.fn();
        window.addEventListener('musicVolumeChanged', handler);
        setMusicVolume(0.7);
        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler.mock.calls[0][0].detail).toBe(0.7);
        window.removeEventListener('musicVolumeChanged', handler);
    });
});
