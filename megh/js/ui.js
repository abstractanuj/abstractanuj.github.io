/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { getStats } from './state.js';
import { log, error, startPerf, endPerf } from './debug.js';
import * as audio from './audio.js';
import { events } from './events.js';

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

    if (e.shiftKey) {
        if (document.activeElement === firstElement) { lastElement.focus(); e.preventDefault(); }
    } else {
        if (document.activeElement === lastElement) { firstElement.focus(); e.preventDefault(); }
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
    if (previouslyFocusedElement) previouslyFocusedElement.focus();
    window.dispatchEvent(new CustomEvent('modal:close', { detail: { modalId: modal.id } }));
}

export function openModal(modal) {
    if (!modal) return;
    log(`Opening modal: #${modal.id}`);
    previouslyFocusedElement = document.activeElement;
    modal.classList.remove('hidden');
    const focusable = modal.querySelectorAll(focusableElementsSelector);
    if (focusable.length > 0) focusable[0].focus();
    modal.addEventListener('keydown', handleModalKeydown);
    window.dispatchEvent(new CustomEvent('modal:open', { detail: { modalId: modal.id } }));
}

export function showConfirmModal(title, text) {
    document.getElementById('confirmModalTitle').textContent = title;
    document.getElementById('confirmModalText').textContent = text;
    openModal(confirmModal);
}

// --- THEME ENGINE ---
const THEMES = {
    arcade: {
        '--background-color': '#0D0221', '--main-title-color': '#F9009A', '--text-color': '#43DDE6',
        '--button-border-color': '#F9009A', '--button-text-color': '#F9009A', '--button-hover-bg-color': '#F9009A',
        '--button-hover-text-color': '#0D0221', '--active-btn-bg-color': '#43DDE6', '--active-btn-text-color': '#0D0221',
        '--panel-shadow-color': 'rgba(249, 0, 154, 0.2)', '--panel-border-color': '#43DDE6', '--panel-bg-color': 'rgba(13, 2, 33, 0.95)',
        '--message-box-title-color': '#43DDE6', '--message-box-title-shadow': '0 0 10px #43DDE6', '--password-input-bg': '#0D0221',
        '--password-input-border': '#A626D9', '--password-input-focus-shadow': 'rgba(249, 65, 68, 0.7)', '--password-input-focus-border': '#F94144',
        '--stats-label-color': '#43DDE6', '--stats-value-color': '#FFFFFF', '--graph-bar-bg': '#A626D9',
        '--wall-color': '#A626D9', '--player-color': '#F94144', '--goal-color': '#43DDE6',
        '--trail-color': 'rgba(249, 65, 68, 0.7)', '--trail-inactive-color': 'rgba(249, 65, 68, 0.2)',
        '--background-image': 'none', '--font-family-body': "'Roboto Mono', monospace", '--font-family-title': "'Roboto Mono', monospace",
        '--font-family-button': "'Roboto Mono', monospace", '--font-family-stats-label': "'Roboto Mono', monospace", '--font-family-stats-value': "'Roboto Mono', monospace",
        '--font-weight-title': '700', '--font-weight-button': '700', '--font-weight-stats-label': '500', '--font-weight-stats-value': '700',
        '--font-size-button': '0.9rem', '--main-title-letter-spacing': 'normal',
        '--highlight-color': '#F9009A', '--grid-line-color': 'transparent',
    },
    zen: {
        '--background-color': '#FFFBF2',
        '--grid-line-color': 'rgba(217, 116, 90, 0.1)',
        '--main-title-color': '#5C4B44',
        '--text-color': '#75655F',
        '--highlight-color': '#FF5E33',
        '--button-border-color': 'rgba(217, 116, 90, 0.4)',
        '--button-text-color': '#D9745A',
        '--button-hover-bg-color': 'rgba(255, 94, 51, 0.05)',
        '--button-hover-text-color': '#FF5E33',
        '--active-btn-bg-color': '#FF5E33',
        '--active-btn-text-color': '#FFFBF2',
        '--panel-shadow-color': 'rgba(92, 75, 68, 0.1)',
        '--panel-border-color': 'rgba(217, 116, 90, 0.15)',
        '--panel-bg-color': 'rgba(255, 251, 242, 0.9)',
        '--message-box-title-color': '#5C4B44',
        '--message-box-title-shadow': 'none',
        '--password-input-bg': '#FFFBF2',
        '--password-input-border': 'rgba(217, 116, 90, 0.4)',
        '--password-input-focus-shadow': 'rgba(255, 94, 51, 0.3)',
        '--password-input-focus-border': '#FF8C66',
        '--stats-label-color': '#75655F',
        '--stats-value-color': '#5C4B44',
        '--graph-bar-bg': '#FFD6C9',
        '--wall-color': 'rgba(92, 75, 68, 0.25)',
        '--player-color': '#FF5E33',
        '--goal-color': '#FF8C66',
        '--trail-color': 'rgba(255, 94, 51, 0.7)',
        '--trail-inactive-color': 'rgba(255, 94, 51, 0.2)',
        '--background-image': 'linear-gradient(to right, var(--grid-line-color) 1px, transparent 1px), linear-gradient(to bottom, var(--grid-line-color) 1px, transparent 1px)',
        '--font-family-body': "'Montserrat', sans-serif",
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
    if (!THEMES[themeName]) { error(`Theme "${themeName}" not found.`); return; }
    log(`Applying theme: ${themeName}`);
    const theme = THEMES[themeName];
    for (const [key, value] of Object.entries(theme)) {
        document.documentElement.style.setProperty(key, value);
    }
    document.documentElement.style.setProperty('color-scheme', themeName === 'zen' ? 'light' : 'dark');
    if (typeof onFinish === 'function') requestAnimationFrame(() => onFinish());
}


// --- UI Utility Functions ---
export function formatTime(ms) {
    if (ms === Infinity || ms === null || isNaN(ms)) return "--:--";
    const totalSeconds = Math.abs(ms) / 1000;
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
    return `${ms < 0 ? "-" : ""}${minutes}:${seconds}`;
}

export function updateTimer(ms) {
    const timerEl = document.getElementById('timer');
    const timerElMobile = document.getElementById('timer-mobile');
    let formattedTime = (ms > 0)
        ? `${Math.floor(ms / 60000).toString().padStart(2, '0')}:${Math.floor((ms % 60000) / 1000).toString().padStart(2, '0')}.${Math.floor((ms % 1000) / 100)}`
        : '00:00.0';
    if (timerEl) timerEl.textContent = formattedTime;
    if (timerElMobile) timerElMobile.textContent = formattedTime;
}

export function updateScoreAttemptsDisplay(gameMode, attempts, score) {
    const ids = ['', '-mobile'];
    ids.forEach(id => {
        const label = document.getElementById(`score-attempts-label${id}`);
        const value = document.getElementById(`score-attempts-value${id}`);
        if(label && value) {
            if (gameMode === 'daily') {
                label.textContent = "ATTEMPTS"; value.textContent = attempts;
            } else {
                label.textContent = "SCORE"; value.textContent = score;
            }
        }
    });
    const comebackMessageEl = document.getElementById('comebackMessage');
    if(comebackMessageEl) {
         comebackMessageEl.classList.toggle('hidden', gameMode !== 'daily' || attempts > 0);
    }
}

export function setActiveMode(mode) {
    ['', 'Mobile'].forEach(suffix => {
        document.getElementById(`dailyModeBtn${suffix}`).classList.toggle('active-mode', mode === 'daily');
        document.getElementById(`endlessModeBtn${suffix}`).classList.toggle('active-mode', mode === 'endless');
    });
}

export function showStatsModal(mode) {
    const stats = getStats(mode);
    log('Showing stats modal', { mode, stats });

    document.getElementById('stat-puzzles-solved').textContent = stats.puzzlesSolved || 0;
    const isDaily = mode === 'daily';
    document.getElementById('stat-current-streak').textContent = isDaily ? stats.currentStreak || 0 : 'N/A';
    document.getElementById('stat-max-streak').textContent = stats.maxStreak || 0;
    document.getElementById('stat-avg-time').textContent = (isDaily && stats.totalTime > 0) ? formatTime(stats.totalTime / stats.puzzlesSolved) : '--:--';
    document.getElementById('stat-label-max-streak').textContent = isDaily ? 'Max Streak' : 'High Score';

    const graph = document.getElementById('stats-graph');
    graph.innerHTML = '';
    if (isDaily && stats.recentTimes && stats.recentTimes.length > 0) {
        const maxTime = Math.max(...stats.recentTimes, 1);
        stats.recentTimes.forEach((time, i) => {
            const bar = document.createElement('div');
            bar.className = 'graph-bar';
            bar.style.height = `${(time / maxTime) * 100}%`;
            bar.setAttribute('aria-label', `Solve ${i + 1}: ${formatTime(time)}`);
            graph.appendChild(bar);
        });
    }
    openModal(statsModal);
}

export function copyToClipboard(text) {
    return navigator.clipboard.writeText(text).catch(err => error('Failed to copy text: ', err));
}

export function showPressToStartMessage() {
    log('UI: Showing "Press to Start" message.');
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    gameStartText.textContent = isTouchDevice ? "SWIPE TO START" : "PRESS 'F' OR SPACE TO START";
    gameStartText.className = 'text-4xl md:text-5xl font-bold main-title text-center px-4';
    gameStartText.style.animation = 'pulse-white 2s infinite ease-in-out';
    gameStartOverlay.classList.add('visible');
}

export function startGameCountdown(onGoCallback) {
    log('UI: Starting game countdown.');
    gameStartText.style.animation = 'none';
    gameStartText.textContent = '';
    gameStartOverlay.classList.add('visible');
    let count = 3;
    const sequence = () => {
        gameStartText.className = 'text-6xl md:text-8xl font-bold main-title';
        void gameStartText.offsetWidth; // Reflow
        if (count > 0) {
            gameStartText.textContent = count--;
            gameStartText.classList.add('countdown');
            setTimeout(sequence, 900);
        } else {
            gameStartText.textContent = 'GO!';
            gameStartText.classList.add('go');
            if (typeof onGoCallback === 'function') onGoCallback();
            setTimeout(() => gameStartOverlay.classList.remove('visible'), 800);
        }
    };
    setTimeout(sequence, 100);
}

export function flashEndlessLevelClear(onComplete) {
    gameStartText.textContent = 'LEVEL CLEAR!';
    gameStartOverlay.classList.add('visible');
    gameStartText.className = 'text-6xl md:text-8xl font-bold main-title';
    void gameStartText.offsetWidth;
    gameStartText.classList.add('level-clear');
    setTimeout(() => {
        gameStartOverlay.classList.remove('visible');
        if (typeof onComplete === 'function') onComplete();
    }, 1500);
}

export function startFastCountdown(onGoCallback) {
    gameStartText.textContent = 'GO!';
    gameStartOverlay.classList.add('visible');
    gameStartText.className = 'text-6xl md:text-8xl font-bold main-title';
    void gameStartText.offsetWidth;
    gameStartText.classList.add('go');
    if (typeof onGoCallback === 'function') onGoCallback();
    setTimeout(() => gameStartOverlay.classList.remove('visible'), 800);
}

export function showOnboardingTutorial(maze, player) {
    const tutorialEl = document.getElementById('onboarding-tutorial');
    const spotlightEl = document.getElementById('onboarding-spotlight');
    const textEl = document.getElementById('onboarding-text');
    const nextBtn = document.getElementById('onboarding-next-btn');
    
    let currentStep = 0;
    
    const steps = [
        {
            text: "This is you. Use WASD, Arrow Keys, or Swipe to move.",
            target: player,
            isPlayer: true
        },
        {
            text: "Your goal is to reach the pulsing square at the end.",
            target: maze.grid[maze.endY][maze.endX]
        }
    ];

    function showStep(stepIndex) {
        const step = steps[stepIndex];
        const targetSize = step.isPlayer ? player.size * 2 : maze.cellSize * 1.5;
        const targetX = (step.target.x * maze.cellSize) + (maze.cellSize / 2);
        const targetY = (step.target.y * maze.cellSize) + (maze.cellSize / 2);
        
        spotlightEl.style.width = `${targetSize}px`;
        spotlightEl.style.height = `${targetSize}px`;
        spotlightEl.style.left = `${targetX - targetSize / 2}px`;
        spotlightEl.style.top = `${targetY - targetSize / 2}px`;
        
        textEl.textContent = step.text;
        
        tutorialEl.classList.add('step-visible');
        if (stepIndex === steps.length - 1) {
            nextBtn.textContent = "Start Game!";
        }
    }

    nextBtn.onclick = () => {
        currentStep++;
        tutorialEl.classList.remove('step-visible');
        if (currentStep < steps.length) {
            setTimeout(() => showStep(currentStep), 500);
        } else {
            tutorialEl.classList.remove('visible');
            events.publish('ui:onboardingComplete');
        }
    };

    tutorialEl.classList.add('visible');
    setTimeout(() => showStep(0), 100);
}

const createButton = (text, eventToPublish, id) => {
    const button = document.createElement('button');
    button.className = 'themed-button font-bold py-3 px-6 rounded-lg text-xl w-full sm:w-auto';
    button.textContent = text;
    if (id) button.id = id;
    button.addEventListener('click', (e) => events.publish(eventToPublish, e));
    return button;
};

export function showWinModal(data) {
    const { isOptimal, currentScore, currentTime, attemptsLeft, bestScore, optimalPathLength } = data;
    const winTitle = document.getElementById('winTitle');
    const statsText = document.getElementById('statsText');
    const buttonContainer = document.getElementById('buttonContainer');
    buttonContainer.innerHTML = '';
    
    const timeString = formatTime(currentTime);
    if (isOptimal) {
        winTitle.textContent = "OPTIMAL PATH!";
        statsText.textContent = `You found the most efficient route in ${currentScore} steps! Time: ${timeString}`;
        buttonContainer.appendChild(createButton('Share', 'ui:share', 'shareButton'));
    } else if (attemptsLeft > 0) {
        winTitle.textContent = "PATH COMPLETE";
        statsText.textContent = `Your path: ${currentScore} steps. Time: ${timeString}. You have ${attemptsLeft} attempts left.`;
        buttonContainer.appendChild(createButton('Try Again', 'ui:restartDailyAttempt'));
    } else {
        winTitle.textContent = "ATTEMPTS FINISHED";
        statsText.textContent = `Your best score today was ${bestScore === Infinity ? 'N/A' : bestScore} steps. The optimal path is ${optimalPathLength} steps.`;
        buttonContainer.appendChild(createButton('Show Path', 'ui:showOptimalPath'));
        buttonContainer.appendChild(createButton('Share Score', 'ui:share', 'shareButton'));
    }
    openModal(winMessage);
}

export function showGameOverModal(mazesSolved) {
    document.getElementById('winTitle').textContent = "GAME OVER";
    document.getElementById('statsText').textContent = `You solved ${mazesSolved} mazes!`;
    const btnContainer = document.getElementById('buttonContainer');
    btnContainer.innerHTML = '';
    btnContainer.appendChild(createButton('Try Again', 'ui:restartEndless'));
    openModal(winMessage);
}

export function showTimeUpModal(attemptsLeft, optimalPathLength) {
    document.getElementById('winTitle').textContent = "TIME'S UP";
    const statsText = document.getElementById('statsText');
    const btnContainer = document.getElementById('buttonContainer');
    btnContainer.innerHTML = '';
    if (attemptsLeft > 0) {
        statsText.textContent = `You ran out of time. You have ${attemptsLeft} attempts left.`;
        btnContainer.appendChild(createButton('Try Again', 'ui:restartDailyAttempt'));
    } else {
        statsText.textContent = `No attempts left. The optimal path is ${optimalPathLength} steps.`;
        btnContainer.appendChild(createButton('Show Path', 'ui:showOptimalPath'));
    }
    openModal(winMessage);
}

// --- Sound Icon Management ---
const soundOnIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`;
const soundOffIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>`;

function updateSoundIcon() {
    const icon = audio.isAudioMuted() ? soundOffIcon : soundOnIcon;
    document.querySelectorAll('.js-sound-toggle').forEach(btn => btn.innerHTML = icon);
}

// --- Main UI Initialization ---
export function initUI() {
    log('Initializing UI...');
    
    // Setup event listeners
    document.getElementById('openOptionsBtn').addEventListener('click', () => openModal(optionsModal));
    ['closeStatsBtn', 'passwordCancel', 'closeAboutBtn', 'closeOptionsBtn'].forEach(id => {
        document.getElementById(id).addEventListener('click', (e) => closeModal(e.target.closest('.modal')));
    });
    getAboutButtons().forEach(btn => btn.addEventListener('click', () => { closeModal(optionsModal); openModal(aboutModal); }));
    getStatsButtons().forEach(btn => {
        btn.addEventListener('click', () => { closeModal(optionsModal); showStatsModal('daily'); });
    });
    document.querySelectorAll('.js-sound-toggle').forEach(btn => btn.addEventListener('click', () => {
        audio.toggleMute();
        updateSoundIcon();
    }));
    passwordInput.addEventListener('focus', () => passwordInput.classList.remove('error'));
    [winMessage, passwordModal, statsModal, confirmModal, aboutModal, optionsModal].forEach(modal => {
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(modal); });
    });
    
    updateSoundIcon();
    applyTheme('zen');
}