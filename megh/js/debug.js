/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// --- Centralized Debugging Module ---

const perfTimers = {};
let overlayEl;

/**
 * Checks if debug mode is enabled via URL parameter (?debug=true).
 * @type {boolean}
 */
export const DEBUG_MODE = new URLSearchParams(window.location.search).get('debug') === 'true';

/**
 * Initializes the debug module. Should be called once on DOMContentLoaded.
 */
export function init() {
    if (DEBUG_MODE) {
        document.body.classList.add('debug-mode');
        overlayEl = document.getElementById('debug-overlay');
        console.log('%c[DEBUG MODE ENABLED]', 'color: #00ff00; font-weight: bold;');
    }
}

/**
 * Logs a message to the console if in debug mode.
 * @param {...any} args - The arguments to log.
 */
export function log(...args) {
    if (DEBUG_MODE) {
        console.log('[LOG]', ...args);
    }
}

/**
 * Logs a warning to the console if in debug mode.
 * @param {...any} args - The arguments to log as a warning.
 */
export function warn(...args) {
    if (DEBUG_MODE) {
        console.warn('[WARN]', ...args);
    }
}

/**
 * Logs an error to the console if in debug mode.
 * @param {...any} args - The arguments to log as an error.
 */
export function error(...args) {
    if (DEBUG_MODE) {
        console.error('[ERROR]', ...args);
    }
}

/**
 * Starts a performance timer.
 * @param {string} name - The name of the timer.
 */
export function startPerf(name) {
    if (DEBUG_MODE) {
        perfTimers[name] = performance.now();
    }
}

/**
 * Ends a performance timer and logs the duration.
 * @param {string} name - The name of the timer to end.
 */
export function endPerf(name) {
    if (DEBUG_MODE && perfTimers[name]) {
        const duration = performance.now() - perfTimers[name];
        log(`Performance [${name}]: ${duration.toFixed(2)}ms`);
        delete perfTimers[name];
    }
}

/**
 * Updates the on-screen debug overlay with the current game state.
 * @param {object} state - An object containing the current game state to display.
 */
export function updateOverlay(state) {
    if (DEBUG_MODE && overlayEl) {
        const stateString = `
GAME STATE
----------
Mode:     ${state.mode}
Seed:     ${state.seed}
Time:     ${state.timer}
Running:  ${state.timerRunning}
Player:   ${state.pos}
Path:     ${state.pathLength}
Optimal:  ${state.optimal}
Attempts: ${state.mode === 'daily' ? state.attempts : 'N/A'}
Score:    ${state.mode === 'endless' ? state.score : 'N/A'}
        `.trim();
        overlayEl.textContent = stateString;
    }
}
