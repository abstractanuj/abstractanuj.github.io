/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { log } from './debug.js';

let music;
let isMuted = true;
const MUTE_STORAGE_KEY = 'meghAudioMuted';

function loadMuteState() {
    const savedState = localStorage.getItem(MUTE_STORAGE_KEY);
    isMuted = savedState !== 'false'; // default to true (muted) if not set or is 'true'
    log(`Initial mute state loaded: ${isMuted}`);
}

/**
 * Initializes the audio module with the music element from the DOM.
 * @param {HTMLAudioElement} audioElement The <audio> element.
 */
export function init(audioElement) {
    music = audioElement;
    if (music) {
        music.muted = isMuted;
    }
}

/**
 * Starts playing the background music.
 * Must be called after a user interaction.
 */
export function playMusic() {
    if (music && music.paused) {
        music.play().catch(e => {
            log('Audio playback failed, likely due to browser policy.', e);
        });
    }
}

/**
 * Toggles the mute state of the background music.
 */
export function toggleMute() {
    isMuted = !isMuted;
    if (music) {
        music.muted = isMuted;
    }
    localStorage.setItem(MUTE_STORAGE_KEY, isMuted);
    log(`Toggled mute state to: ${isMuted}`);
}

/**
 * Returns the current mute state.
 * @returns {boolean} True if muted, false otherwise.
 */
export function isAudioMuted() {
    return isMuted;
}

// Load initial state when the module is imported
loadMuteState();