/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { getStats } from './state.js';
import { log, error, startPerf, endPerf } from './debug.js';
import * as audio from './audio.js';

// --- DOM Element References ---
export const canvas = document.getElementById('mazeCanvas');
export const ctx = canvas.getContext('2d');
export const winMessage = document.getElementById('winMessage');
export const passwordModal = document.getElementById('passwordModal');
export const passwordInput = document.getElementById('passwordInput');
export const passwordSubmit = document.getElementById('passwordSubmit');
export const statsModal = document.getElementById('statsModal');
export const confirmModal = document.getElementById('confirmModal');
export const aboutModal = document.getElementById('aboutModal');
export const optionsModal = document.getElementById('optionsModal');


const gameStartOverlay = document.getElementById('game-start-overlay');
const gameStartText = document.getElementById('game-start-text');

// Buttons
export const dailyModeBtn = document.getElementById('dailyModeBtn');
export const endlessModeBtn = document.getElementById('endlessModeBtn');
// Button collections for shared functionality
export const getNewMazeButtons = () => [document.getElementById('newMazeBtn'), document.getElementById('newMazeBtnMobile')];
export const getStatsButtons = () => [document.getElementById('statsBtn'), document.getElementById('statsBtnMobile')];
export const getAboutButtons = () => [document.getElementById('aboutBtn'), document.getElementById('aboutBtnMobile')];


// --- ACCESSIBLE MODAL HANDLING ---
let previouslyFocusedElement;
const focusableElementsSelector = 'button, [href], input, [tabindex]:not([tabindex="-1"])';

function trapFocus(e, modal) {
    if (e.key !== 'Tab') return;
    const focusableElements = Array.from(modal.querySelectorAll(focusableElementsSelector));
    if (focusableElements.length === 0) return;
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) { // Shift + Tab
        if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
        }
    } else { // Tab
        if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
        }
    }
}

const handleModalKeydown = (e) => {
    const modal = e.currentTarget;
    if (e.key === 'Escape') closeModal(modal);
    trapFocus(e, modal);
};

export function closeModal(modal) {
    if (!modal || modal.classList.contains('hidden')) return;
    log(`Closing modal: #${modal.id}`);
    modal.classList.add('hidden');
    modal.removeEventListener('keydown', handleModalKeydown);
    if (previouslyFocusedElement) {
        previouslyFocusedElement.focus();
    }
    window.dispatchEvent(new CustomEvent('modal:close', { detail: { modalId: modal.id } }));
}

export function openModal(modal) {
    if (!modal) return;
    log(`Opening modal: #${modal.id}`);
    previouslyFocusedElement = document.activeElement;
    modal.classList.remove('hidden');

    const focusableElements = modal.querySelectorAll(focusableElementsSelector);
    if (focusableElements.length > 0) {
        focusableElements[0].focus();
    }
    
    modal.addEventListener('keydown', handleModalKeydown);
    window.dispatchEvent(new CustomEvent('modal:open', { detail: { modalId: modal.id } }));
}


// --- THEME ENGINE ---
const THEMES = {
    arcade: { // Endless Mode: "Arcade" - Competitive Dark Theme
        '--background-color': '#0D0221',
        '--main-title-color': '#F9009A',
        '--text-color': '#43DDE6',
        '--button-border-color': '#F9009A',
        '--button-text-color': '#F9009A',
        '--button-hover-bg-color': '#F9009A',
        '--button-hover-text-color': '#0D0221',
        '--active-btn-bg-color': '#43DDE6',
        '--active-btn-text-color': '#0D0221',
        '--panel-shadow-color': 'rgba(249, 0, 154, 0.2)',
        '--panel-border-color': '#43DDE6',
        '--panel-bg-color': 'rgba(67, 221, 230, 0.05)',
        '--message-box-title-color': '#43DDE6',
        '--message-box-title-shadow': '0 0 10px #43DDE6',
        '--password-input-bg': '#0D0221',
        '--password-input-border': '#A626D9',
        '--password-input-focus-shadow': 'rgba(249, 65, 68, 0.7)',
        '--password-input-focus-border': '#F94144',
        '--stats-label-color': '#43DDE6',
        '--stats-value-color': '#FFFFFF',
        '--graph-bar-bg': '#A626D9',
        '--wall-color': '#A626D9',
        '--player-color': '#F94144',
        '--goal-color': '#43DDE6',
        '--trail-color': 'rgba(249, 65, 68, 0.7)',
        '--trail-inactive-color': 'rgba(249, 65, 68, 0.2)',
        '--dpad-bg-color': 'rgba(166, 38, 217, 0.1)',
        '--dpad-border-color': '#A626D9',
        '--dpad-active-bg-color': '#F9009A',
        '--dpad-text-color': '#43DDE6',
        '--dpad-active-border-color': '#F9009A',
        '--background-image': 'none',
        // Typography
        '--font-family-body': "'Roboto Mono', monospace",
        '--font-family-title': "'Roboto Mono', monospace",
        '--font-family-button': "'Roboto Mono', monospace",
        '--font-family-stats-label': "'Roboto Mono', monospace",
        '--font-family-stats-value': "'Roboto Mono', monospace",
        '--font-weight-title': '700',
        '--font-weight-button': '700',
        '--font-weight-stats-label': '500',
        '--font-weight-stats-value': '700',
        '--font-size-button': '0.9rem',
        '--main-title-letter-spacing': 'normal',
    },
    paperwhite: { // Daily Mode: "Paperwhite" - Light Theme
        '--background-color': '#F8F5F2',
        '--main-title-color': '#332E2A',
        '--text-color': '#5A524C',
        '--button-border-color': '#D3C9C0',
        '--button-text-color': '#332E2A',
        '--button-hover-bg-color': '#332E2A',
        '--button-hover-text-color': '#F8F5F2',
        '--active-btn-bg-color': '#332E2A',
        '--active-btn-text-color': '#F8F5F2',
        '--panel-shadow-color': 'rgba(0, 0, 0, 0.05)',
        '--panel-border-color': '#D3C9C0',
        '--panel-bg-color': 'rgba(255, 255, 255, 0.5)',
        '--message-box-title-color': '#332E2A',
        '--message-box-title-shadow': 'none',
        '--password-input-bg': '#FFFFFF',
        '--password-input-border': '#D3C9C0',
        '--password-input-focus-shadow': 'rgba(59, 130, 246, 0.5)',
        '--password-input-focus-border': '#3B82F6',
        '--stats-label-color': '#5A524C',
        '--stats-value-color': '#332E2A',
        '--graph-bar-bg': '#E5DDD5',
        '--wall-color': '#D3C9C0',
        '--player-color': '#3B82F6',
        '--goal-color': '#10B981',
        '--trail-color': 'rgba(59, 130, 246, 0.7)',
        '--trail-inactive-color': 'rgba(59, 130, 246, 0.2)',
        '--dpad-bg-color': 'rgba(255, 255, 255, 0.2)',
        '--dpad-border-color': '#D3C9C0',
        '--dpad-active-bg-color': 'rgba(244, 114, 182, 0.15)',
        '--dpad-text-color': '#5A524C',
        '--dpad-active-border-color': 'rgba(244, 114, 182, 0.5)',
        '--background-image': 'none',
        // Typography
        '--font-family-body': "'Cormorant Garamond', serif",
        '--font-family-title': "'Cormorant Garamond', serif",
        '--font-family-button': "'Montserrat', sans-serif",
        '--font-family-stats-label': "'Montserrat', sans-serif",
        '--font-family-stats-value': "'Cormorant Garamond', serif",
        '--font-weight-title': '700',
        '--font-weight-button': '600',
        '--font-weight-stats-label': '600',
        '--font-weight-stats-value': '700',
        '--font-size-button': '0.875rem',
        '--main-title-letter-spacing': '-0.02em',
    },
};

export function applyTheme(themeName, onFinish) {
    if (!THEMES[themeName]) {
        error(`Theme "${themeName}" not found.`);
        return;
    }
    log(`Applying theme: ${themeName}`);
    startPerf('applyTheme');
    const theme = THEMES[themeName];
    for (const [key, value] of Object.entries(theme)) {
        document.documentElement.style.setProperty(key, value);
    }
    
    // Set color-scheme for native UI elements like scrollbars
    const colorScheme = themeName === 'paperwhite' ? 'light' : 'dark';
    document.documentElement.style.setProperty('color-scheme', colorScheme);
    
    if (typeof onFinish === 'function') {
        // Redrawing the maze after theme application can be slow. Deferring it
        // ensures the UI updates first. Calling with an arrow function `() => onFinish()`
        // prevents requestAnimationFrame from passing a timestamp argument to `init`,
        // which fixes the bug where changing themes would reset the game state.
        requestAnimationFrame(() => onFinish());
    }
    endPerf('applyTheme');
}


// --- UI Utility Functions ---
export function formatTime(ms) {
    if (ms === Infinity || ms === null || isNaN(ms)) return "--:--";
    const totalSeconds = Math.abs(ms) / 100;
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
    const sign = ms < 0 ? "-" : "";
    return `${sign}${minutes}:${seconds}`;
}

export function updateTimer(ms) {
    const timerEl = document.getElementById('timer');
    const timerElMobile = document.getElementById('timer-mobile');
    let formattedTime;
    
    if (ms > 0) {
        const totalSeconds = ms / 1000;
        const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
        const tenths = Math.floor((ms % 1000) / 100).toString();
        formattedTime = `${minutes}:${seconds}.${tenths}`;
    } else {
        formattedTime = '00:00.0';
    }

    if (timerEl) timerEl.textContent = formattedTime;
    if (timerElMobile) timerElMobile.textContent = formattedTime;
}

export function updateScoreAttemptsDisplay(gameMode, attempts, score) {
    // Desktop elements
    const scoreAttemptsContainer = document.getElementById('score-attempts-container');
    const scoreAttemptsLabel = document.getElementById('score-attempts-label');
    const scoreAttemptsValue = document.getElementById('score-attempts-value');
    const comebackMessageEl = document.getElementById('comebackMessage');
    
    // Mobile elements
    const scoreAttemptsContainerMobile = document.getElementById('score-attempts-container-mobile');
    const scoreAttemptsLabelMobile = document.getElementById('score-attempts-label-mobile');
    const scoreAttemptsValueMobile = document.getElementById('score-attempts-value-mobile');

    if (gameMode === 'daily') {
        if (scoreAttemptsContainer) {
            scoreAttemptsContainer.classList.remove('hidden');
            scoreAttemptsLabel.textContent = "ATTEMPTS";
            scoreAttemptsValue.textContent = attempts;
        }
        if(comebackMessageEl) {
            comebackMessageEl.classList.toggle('hidden', attempts > 0);
        }
        if (scoreAttemptsContainerMobile) {
            scoreAttemptsLabelMobile.textContent = "ATTEMPTS";
            scoreAttemptsValueMobile.textContent = attempts;
        }
    } else { // endless
        if (scoreAttemptsContainer) {
            if(comebackMessageEl) comebackMessageEl.classList.add('hidden');
            scoreAttemptsContainer.classList.remove('hidden');
            scoreAttemptsLabel.textContent = "SCORE";
            scoreAttemptsValue.textContent = score;
        }
        if (scoreAttemptsContainerMobile) {
            scoreAttemptsLabelMobile.textContent = "SCORE";
            scoreAttemptsValueMobile.textContent = score;
        }
    }
}

export function setActiveMode(mode) {
    dailyModeBtn.classList.toggle('active-mode', mode === 'daily');
    endlessModeBtn.classList.toggle('active-mode', mode === 'endless');
    
    const dailyModeBtnMobile = document.getElementById('dailyModeBtnMobile');
    const endlessModeBtnMobile = document.getElementById('endlessModeBtnMobile');
    if (dailyModeBtnMobile) dailyModeBtnMobile.classList.toggle('active-mode', mode === 'daily');
    if (endlessModeBtnMobile) endlessModeBtnMobile.classList.toggle('active-mode', mode === 'endless');
}

export function showStatsModal(mode) {
    const stats = getStats(mode);
    log('Showing stats modal', { mode, stats });

    document.getElementById('stat-puzzles-solved').textContent = stats.puzzlesSolved || 0;

    if (mode === 'daily') {
        document.getElementById('stat-current-streak').textContent = stats.currentStreak || 0;
        document.getElementById('stat-max-streak').textContent = stats.maxStreak || 0;
        document.getElementById('stat-avg-time').textContent = stats.totalTime > 0 ? formatTime(stats.totalTime / stats.puzzlesSolved) : '--:--';
        
        document.getElementById('stat-label-current-streak').parentElement.classList.remove('hidden');
        document.getElementById('stat-label-max-streak').textContent = 'Max Streak';
        document.getElementById('stat-label-avg-time').parentElement.classList.remove('hidden');
    
    } else { // endless
        document.getElementById('stat-label-max-streak').textContent = 'High Score';
        document.getElementById('stat-max-streak').textContent = stats.maxStreak || 0;
        
        document.getElementById('stat-label-current-streak').parentElement.classList.add('hidden');
        document.getElementById('stat-label-avg-time').parentElement.classList.add('hidden');
    }

    const graph = document.getElementById('stats-graph');
    graph.innerHTML = '';
    
    if (mode === 'daily' && stats.recentTimes && stats.recentTimes.length > 0) {
        const maxTime = Math.max(...stats.recentTimes, 1); // Avoid division by zero
        stats.recentTimes.forEach((time, index) => {
            const bar = document.createElement('div');
            bar.className = 'graph-bar';
            bar.style.height = `${(time / maxTime) * 100}%`;
            bar.setAttribute('aria-label', `Solve ${index + 1}: ${formatTime(time)}`);
            graph.appendChild(bar);
        });
    }
    
    closeModal(optionsModal); // Close options if open
    openModal(statsModal);
}

export function copyToClipboard(text) {
    return navigator.clipboard.writeText(text).then(() => {
        log('Copied to clipboard:', text);
    }).catch(err => {
        error('Failed to copy text: ', err);
    });
}

export function showPressToStartMessage() {
    log('UI: Showing "Press to Start" message.');
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    gameStartText.textContent = isTouchDevice ? "PRESS D-PAD TO START" : "PRESS 'F' TO START";
    gameStartText.className = 'text-4xl md:text-5xl font-bold main-title text-center px-4';
    gameStartText.style.animation = 'pulse-white 2s infinite ease-in-out';
    gameStartOverlay.classList.add('visible');
}


export function startGameCountdown(onGoCallback) {
    log('UI: Starting game countdown.');
    gameStartText.style.animation = 'none'; // Clear pulsing animation from start message
    gameStartText.textContent = '';
    gameStartOverlay.classList.add('visible');
    
    let count = 3;

    const sequence = () => {
        // Clear previous animation classes
        gameStartText.className = 'text-6xl md:text-8xl font-bold main-title';

        // Force a reflow. This is a common trick to ensure the browser processes
        // the class removal before the class is re-added, which correctly
        // restarts the CSS animation for the next number in the sequence.
        void gameStartText.offsetWidth;

        if (count > 0) {
            gameStartText.textContent = count;
            gameStartText.classList.add('countdown');
            count--;
            setTimeout(sequence, 900); // 800ms animation + 100ms pause
        } else {
            gameStartText.textContent = 'GO!';
            gameStartText.classList.add('go');
            
            if (typeof onGoCallback === 'function') {
                onGoCallback();
            }

            // Hide the overlay after the 'GO!' animation finishes
            setTimeout(() => {
                gameStartOverlay.classList.remove('visible');
            }, 800);
        }
    };
    
    setTimeout(sequence, 100); // Small initial delay
}


/**
 * Shows a "LEVEL CLEAR!" message for endless mode transitions.
 * @param {function} onComplete - Callback to run after the message fades.
 */
export function flashEndlessLevelClear(onComplete) {
    log('UI: Flashing Endless Level Clear.');
    // The win sound is now played in the core game logic (handleGameEnd)
    // to ensure it plays for both daily and endless modes consistently.
    gameStartText.textContent = 'LEVEL CLEAR!';
    gameStartOverlay.classList.add('visible');
    
    gameStartText.className = 'text-6xl md:text-8xl font-bold main-title';
    void gameStartText.offsetWidth; // Force reflow
    gameStartText.classList.add('level-clear');

    setTimeout(() => {
        gameStartOverlay.classList.remove('visible');
        if (typeof onComplete === 'function') {
            onComplete();
        }
    }, 1500); // Wait for animation to mostly finish
}

/**
 * Shows a quick "GO!" message to start the next endless level.
 * @param {function} onGoCallback - Callback to run as "GO!" appears.
 */
export function startFastCountdown(onGoCallback) {
    log('UI: Starting fast countdown for endless mode.');
    gameStartText.textContent = '';
    gameStartOverlay.classList.add('visible');
    
    // Skip 3,2,1 and just show GO!
    gameStartText.textContent = 'GO!';
    gameStartText.className = 'text-6xl md:text-8xl font-bold main-title';
    void gameStartText.offsetWidth; // Force reflow
    gameStartText.classList.add('go');
    
    if (typeof onGoCallback === 'function') {
        onGoCallback();
    }

    // Hide the overlay after the 'GO!' animation finishes
    setTimeout(() => {
        gameStartOverlay.classList.remove('visible');
    }, 800);
}

/**
 * Shows a one-time onboarding hint for new players.
 */
export function showOnboardingHint() {
    const hintKey = 'megh_has_visited';
    if (localStorage.getItem(hintKey)) {
        return; // Don't show if they've visited before
    }

    log('First visit detected. Showing onboarding hint.');
    const hintEl = document.getElementById('onboarding-hint');
    if (!hintEl) return;

    // Show the hint
    setTimeout(() => {
        hintEl.classList.add('visible');
    }, 500); // Small delay to let the maze render first

    // Hide it after a few seconds
    setTimeout(() => {
        hintEl.classList.remove('visible');
    }, 4000);

    localStorage.setItem(hintKey, 'true');
}

// --- Sound Icon Management ---
const soundOnIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`;
const soundOffIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>`;

function updateSoundIcon() {
    const isMuted = audio.isAudioMuted();
    const soundToggleBtns = document.querySelectorAll('.js-sound-toggle');
    const icon = isMuted ? soundOffIcon : soundOnIcon;
    const label = isMuted ? 'Enable sound' : 'Disable sound';

    soundToggleBtns.forEach(btn => {
      btn.innerHTML = icon;
      btn.setAttribute('aria-label', label);
    });
}


// --- Main UI Initialization ---
export function initUI() {
    log('Initializing UI...');
    
    // Mobile Options Menu
    const openOptionsBtn = document.getElementById('openOptionsBtn');
    openOptionsBtn.addEventListener('click', () => openModal(optionsModal));

    // Handle multiple close buttons for modals
    [
        { btn: 'closeStatsBtn', modal: statsModal },
        { btn: 'passwordCancel', modal: passwordModal },
        { btn: 'closeAboutBtn', modal: aboutModal },
        { btn: 'closeOptionsBtn', modal: optionsModal }
    ].forEach(({ btn, modal }) => {
        document.getElementById(btn).addEventListener('click', () => closeModal(modal));
    });

    // Handle open buttons (desktop and mobile)
    getAboutButtons().forEach(btn => btn.addEventListener('click', () => {
        closeModal(optionsModal);
        openModal(aboutModal);
    }));


    // Sound Toggle Handler
    const soundToggleBtns = document.querySelectorAll('.js-sound-toggle');
    const soundToggleHandler = async () => {
        audio.toggleMute();
        updateSoundIcon();
    };
    soundToggleBtns.forEach(btn => {
        btn.addEventListener('click', soundToggleHandler);
    });
    
    // Set initial icon state
    updateSoundIcon();

    // Password input clear error on focus
    passwordInput.addEventListener('focus', () => passwordInput.classList.remove('error'));
    
    // Close modal on backdrop click
    [winMessage, passwordModal, statsModal, confirmModal, aboutModal, optionsModal].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal(modal);
        });
    });

    // Apply the default theme.
    applyTheme('paperwhite');
}