/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { log } from './debug.js';
import { events } from './events.js';

let music;
let isMuted = true;
const MUTE_STORAGE_KEY = 'meghAudioMuted';
let audioCtx;

function loadMuteState() {
    const savedState = localStorage.getItem(MUTE_STORAGE_KEY);
    isMuted = savedState !== 'false';
    log(`Initial mute state loaded: ${isMuted}`);
}

/**
 * Creates and plays a simple sound effect using the Web Audio API.
 * @param {string} type The type of sound to play ('move', 'bump', 'win', 'lose').
 */
function playSound(type) {
    if (isMuted || !audioCtx) return;

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    gainNode.connect(audioCtx.destination);
    oscillator.connect(gainNode);

    const now = audioCtx.currentTime;
    gainNode.gain.setValueAtTime(0, now);

    switch (type) {
        case 'move':
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(600, now);
            gainNode.gain.linearRampToValueAtTime(0.1, now + 0.01);
            gainNode.gain.linearRampToValueAtTime(0, now + 0.05);
            break;
        case 'bump':
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(100, now);
            gainNode.gain.linearRampToValueAtTime(0.2, now + 0.01);
            gainNode.gain.linearRampToValueAtTime(0, now + 0.1);
            break;
        case 'win':
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(880, now); // A5
            gainNode.gain.linearRampToValueAtTime(0.2, now + 0.01);
            oscillator.frequency.linearRampToValueAtTime(1046.50, now + 0.2); // C6
            gainNode.gain.linearRampToValueAtTime(0, now + 0.2);
            break;
        case 'lose':
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(220, now); // A3
            gainNode.gain.linearRampToValueAtTime(0.2, now + 0.01);
            oscillator.frequency.linearRampToValueAtTime(110, now + 0.4); // A2
            gainNode.gain.linearRampToValueAtTime(0, now + 0.4);
            break;
    }

    oscillator.start(now);
    oscillator.stop(now + 0.5);
}

/**
 * Initializes the audio module.
 */
export function init() {
    music = document.getElementById('bg-music');
    if (music) {
        music.muted = isMuted;
    }
    
    // Subscribe to game events
    events.subscribe('player:move', () => playSound('move'));
    events.subscribe('player:wall-bump', () => playSound('bump'));
    events.subscribe('player:win', () => playSound('win'));
    events.subscribe('game:over', () => playSound('lose'));
}

/**
 * Starts playing the background music. Must be called after a user interaction.
 */
export function playMusic() {
    if (!audioCtx) {
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch(e) {
            log('Web Audio API is not supported in this browser.');
            return;
        }
    }
    
    if (music && music.paused) {
        music.play().catch(e => {
            log('Audio playback failed, likely due to browser policy.', e);
        });
    }
}

/**
 * Toggles the mute state.
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
 */
export function isAudioMuted() {
    return isMuted;
}

loadMuteState();