/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import * as Tone from 'https://cdn.skypack.dev/tone';
import { log } from './debug.js';

let audioInitialized = false;
let contextStarted = false; // To track if Tone.start() has been called
let isMuted = true;
let pianoSynth, moveSynth, backtrackSynth, wallBumpSynth, gameOverSynth;

const MUTE_STORAGE_KEY = 'meghAudioMuted';

// --- Musical Scales for Dynamic Sound ---
const moveScale = ['C5', 'D5', 'E5', 'G5', 'A5', 'C6'];
const backtrackScale = ['A4', 'G4', 'E4', 'D4', 'C4', 'A3'];


function loadMuteState() {
    const savedState = localStorage.getItem(MUTE_STORAGE_KEY);
    isMuted = savedState !== 'false'; // default to true (muted) if not set or is 'true'
    log(`Initial mute state loaded: ${isMuted}`);
}

// Centralized function to apply the app's mute state to the Tone.js engine
function applyMuteStateToTone() {
    if (audioInitialized) {
        Tone.Master.mute = isMuted;
    }
}

/**
 * Ensures the audio context is started, which is required by browsers
 * to be initiated by a user gesture.
 */
export async function ensureAudioContextStarted() {
    if (contextStarted) return;
    try {
        await Tone.start();
        contextStarted = true;
        log('Audio context started by user gesture.');
    } catch (e) {
        console.error("Could not start audio context", e);
    }
}


// Called on the first unmute action to set up Tone.js
export async function initAudio() {
    // Ensure the context is running before we create synths
    await ensureAudioContextStarted();
    if (audioInitialized) return;
    try {
        // A polyphonic synth for chords and arpeggios with a warm electric piano sound.
        pianoSynth = new Tone.PolySynth(Tone.FMSynth, {
            harmonicity: 1, modulationIndex: 5, oscillator: { type: 'sine' },
            envelope: { attack: 0.02, decay: 0.2, sustain: 0.2, release: 0.5 },
            modulation: { type: 'square' },
            modulationEnvelope: { attack: 0.01, decay: 0.5, sustain: 0, release: 0.5 }
        }).toDestination();
        pianoSynth.volume.value = -12;

        // A quick, pleasant synth for the move sound, creating a "pop".
        moveSynth = new Tone.Synth({
            oscillator: { type: 'triangle' },
            envelope: { attack: 0.005, decay: 0.1, sustain: 0.05, release: 0.1 }
        }).toDestination();
        moveSynth.volume.value = -18;

        backtrackSynth = new Tone.FMSynth({
            harmonicity: 1, modulationIndex: 0.5, oscillator: { type: 'triangle' },
            envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.1 },
            modulation: { type: 'sine' },
            modulationEnvelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.1 }
        }).toDestination();
        backtrackSynth.volume.value = -20;

        wallBumpSynth = new Tone.MembraneSynth({
            pitchDecay: 0.01, octaves: 2,
            envelope: { attack: 0.001, decay: 0.2, sustain: 0.01, release: 0.1 }
        }).toDestination();
        wallBumpSynth.volume.value = -10;
        
        // A synth for the game over sound, with a bit of reverb for atmosphere.
        const reverb = new Tone.Reverb(1.5).toDestination();
        gameOverSynth = new Tone.FMSynth({
            harmonicity: 0.8,
            modulationIndex: 1.2,
            oscillator: { type: 'sine' },
            envelope: { attack: 0.01, decay: 0.5, sustain: 0.1, release: 1 },
            modulation: { type: 'triangle' },
            modulationEnvelope: { attack: 0.02, decay: 0.3, sustain: 0, release: 0.8 }
        }).connect(reverb);
        gameOverSynth.volume.value = -15;

        audioInitialized = true;
        applyMuteStateToTone(); // Apply the current mute state now that Tone is ready
        log('Audio synths initialized successfully.');
    } catch (e) {
        console.error("Could not initialize audio synths", e);
    }
}

// Called by the UI to toggle sound on/off
export async function toggleMute() {
    isMuted = !isMuted;
    localStorage.setItem(MUTE_STORAGE_KEY, isMuted);
    log(`Toggled mute state to: ${isMuted}`);

    if (!isMuted && !audioInitialized) {
        // This is the first time the user is unmuting. Initialize audio.
        await initAudio();
    } else {
        // If audio is already initialized, just apply the new mute state.
        applyMuteStateToTone();
    }
}

export function isAudioMuted() {
    return isMuted;
}

// Plays a triumphant C-Major arpeggio.
export function playSuccessSound() {
    if (isMuted || !audioInitialized) return;
    const now = Tone.now();
    const arpeggio = ['C4', 'E4', 'G4', 'C5'];
    arpeggio.forEach((note, i) => {
        pianoSynth.triggerAttackRelease(note, '8n', now + i * 0.1);
    });
}

// Plays a motivating C-Major chord at the start.
export function playStartSound() {
    if (isMuted || !audioInitialized) return;
    pianoSynth.triggerAttackRelease(['C4', 'E4', 'G4'], '4n', Tone.now());
}

/**
 * Plays a pitched click sound for player movement.
 * The pitch ascends as the path gets longer.
 * @param {number} pathLength The current length of the player's path.
 */
export function playMoveSound(pathLength = 1) {
    if (isMuted || !audioInitialized) return;
    // pathLength - 1 because the path array starts with one entry (length 1).
    const note = moveScale[Math.max(0, pathLength - 1) % moveScale.length];
    moveSynth.triggerAttackRelease(note, '16n', Tone.now());
}

/**
 * Plays a pitched "undo" sound for backtracking.
 * The pitch descends as the path gets shorter.
 * @param {number} pathLength The new, shorter length of the player's path.
 */
export function playBacktrackSound(pathLength = 1) {
    if (isMuted || !audioInitialized) return;
    const note = backtrackScale[Math.max(0, pathLength - 1) % backtrackScale.length];
    backtrackSynth.triggerAttackRelease(note, '16n', Tone.now());
}

// Plays a low "thud" for hitting a wall.
export function playWallBumpSound() {
    if (isMuted || !audioInitialized) return;
    wallBumpSynth.triggerAttackRelease('C2', '8n', Tone.now());
}

// Plays a descending arpeggio for game over.
export function playGameOverSound() {
    if (isMuted || !audioInitialized) return;
    const now = Tone.now();
    const arpeggio = ['G4', 'Eb4', 'C4', 'G3'];
    arpeggio.forEach((note, i) => {
        gameOverSynth.triggerAttackRelease(note, '4n', now + i * 0.2);
    });
}

// Load initial state when the module is imported
loadMuteState();