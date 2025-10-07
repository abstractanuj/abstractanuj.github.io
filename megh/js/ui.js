

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
export const instructions = document.getElementById('instructions');
export const passwordModal = document.getElementById('passwordModal');
export const passwordInput = document.getElementById('passwordInput');
export const passwordSubmit = document.getElementById('passwordSubmit');
export const statsModal = document.getElementById('statsModal');
export const themeModal = document.getElementById('themeModal');
export const confirmModal = document.getElementById('confirmModal');
export const aboutModal = document.getElementById('aboutModal');
export const optionsModal = document.getElementById('optionsModal');


const timerEl = document.getElementById('timer');
const comebackMessageEl = document.getElementById('comebackMessage');
const scoreAttemptsContainer = document.getElementById('score-attempts-container');
const scoreAttemptsLabel = document.getElementById('score-attempts-label');
const scoreAttemptsValue = document.getElementById('score-attempts-value');
const gameStartOverlay = document.getElementById('game-start-overlay');
const gameStartText = document.getElementById('game-start-text');

// Buttons
export const dailyModeBtn = document.getElementById('dailyModeBtn');
export const endlessModeBtn = document.getElementById('endlessModeBtn');
export const soundToggleBtn = document.getElementById('sound-toggle-btn');
// Button collections for shared functionality
export const getNewMazeButtons = () => [document.getElementById('newMazeBtn'), document.getElementById('newMazeBtnMobile')];
export const getStatsButtons = () => [document.getElementById('statsBtn'), document.getElementById('statsBtnMobile')];
export const getThemeButtons = () => [document.getElementById('themeBtn'), document.getElementById('themeBtnMobile')];
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
    serenity: {
        '--background-color': '#F0F2EF',
        '--vignette-color': 'rgba(0, 0, 0, 0.2)',
        '--main-title-color': '#4A5759',
        '--text-color': '#4A5759',
        '--button-border-color': '#4A5759',
        '--button-text-color': '#4A5759',
        '--button-hover-bg-color': '#4A5759',
        '--button-hover-text-color': '#F0F2EF',
        '--active-btn-bg-color': '#4A5759',
        '--active-btn-text-color': '#F0F2EF',
        '--panel-shadow-color': 'rgba(74, 87, 89, 0.1)',
        '--panel-border-color': '#D3DCDD',
        '--panel-bg-color': 'rgba(252, 253, 251, 0.92)',
        '--message-box-title-color': '#B0C4B1',
        '--message-box-title-shadow': 'none',
        '--password-input-bg': '#E5E9E8',
        '--password-input-border': '#D3DCDD',
        '--password-input-focus-shadow': 'rgba(176, 196, 177, 0.7)',
        '--password-input-focus-border': '#B0C4B1',
        '--stats-label-color': '#4A5759',
        '--stats-value-color': '#4A5759',
        '--graph-bar-bg': '#B0C4B1',
        '--wall-color': '#4A5759',
        '--player-color': '#8FA38F',
        '--goal-color': '#D8AE7E',
        '--trail-color': 'rgba(143, 163, 143, 0.8)',
        '--trail-inactive-color': 'rgba(143, 163, 143, 0.2)',
        '--trail-color-end': 'rgba(216, 174, 126, 0.1)',
        '--dpad-bg-color': 'rgba(255, 255, 255, 0.15)',
        '--dpad-border-color': 'rgba(255, 255, 255, 0.25)',
        '--dpad-active-bg-color': 'rgba(255, 255, 255, 0.3)',
        '--background-image': 'none',
        '--font-family-body': "'Montserrat', sans-serif",
        '--font-family-title': "'Cormorant Garamond', serif",
        '--font-family-button': "'Montserrat', sans-serif",
        '--font-family-stats-label': "'Cormorant Garamond', serif",
        '--font-family-stats-value': "'Montserrat', sans-serif",
        '--font-weight-title': '700',
        '--font-weight-button': '600',
        '--font-weight-stats-label': '700',
        '--font-size-button': '1rem',
        '--font-size-stats-label': '1.3rem',
        '--main-title-shadow': 'none',
    },
    volt: {
        '--background-color': '#10111A',
        '--vignette-color': 'rgba(16, 17, 26, 0.95)',
        '--main-title-color': '#FFF200',
        '--text-color': '#F8F9FA',
        '--button-border-color': '#FFF200',
        '--button-text-color': '#FFF200',
        '--button-hover-bg-color': '#FFF200',
        '--button-hover-text-color': '#10111A',
        '--active-btn-bg-color': '#FFF200',
        '--active-btn-text-color': '#10111A',
        '--panel-shadow-color': 'rgba(255, 242, 0, 0.2)',
        '--panel-border-color': '#2E3192',
        '--panel-bg-color': 'rgba(16, 17, 26, 0.92)',
        '--message-box-title-color': '#EC008C',
        '--message-box-title-shadow': 'none',
        '--password-input-bg': '#1A1C2A',
        '--password-input-border': '#2E3192',
        '--password-input-focus-shadow': 'rgba(236, 0, 140, 0.7)',
        '--password-input-focus-border': '#EC008C',
        '--stats-label-color': '#F8F9FA',
        '--stats-value-color': '#FFF200',
        '--graph-bar-bg': '#2E3192',
        '--wall-color': '#2E3192',
        '--player-color': '#EC008C',
        '--goal-color': '#FFF200',
        '--trail-color': 'rgba(236, 0, 140, 0.8)',
        '--trail-inactive-color': 'rgba(236, 0, 140, 0.2)',
        '--trail-color-end': 'rgba(46, 49, 146, 0.1)',
        '--dpad-bg-color': 'rgba(255, 255, 255, 0.1)',
        '--dpad-border-color': 'rgba(255, 255, 255, 0.15)',
        '--dpad-active-bg-color': 'rgba(255, 255, 255, 0.25)',
        '--background-image': 'none',
        '--font-family-body': "'Roboto Mono', monospace",
        '--font-family-title': "'Roboto Mono', monospace",
        '--font-family-button': "'Roboto Mono', monospace",
        '--font-family-stats-label': "'Roboto Mono', monospace",
        '--font-family-stats-value': "'Roboto Mono', monospace",
        '--font-weight-title': '700',
        '--font-weight-button': '700',
        '--font-weight-stats-label': '400',
        '--font-size-button': '1rem',
        '--font-size-stats-label': '1.1rem',
        '--main-title-shadow': 'none',
    },
    solstice: {
        '--background-color': '#2B1C33',
        '--vignette-color': 'rgba(20, 10, 25, 0.9)',
        '--main-title-color': '#FBB03B',
        '--text-color': '#FDECBF',
        '--button-border-color': '#FBB03B',
        '--button-text-color': '#FDECBF',
        '--button-hover-bg-color': '#FBB03B',
        '--button-hover-text-color': '#2B1C33',
        '--active-btn-bg-color': '#FBB03B',
        '--active-btn-text-color': '#2B1C33',
        '--panel-shadow-color': 'rgba(0, 0, 0, 0.3)',
        '--panel-border-color': '#873D48',
        '--panel-bg-color': 'rgba(43, 28, 51, 0.92)',
        '--message-box-title-color': '#FBB03B',
        '--message-box-title-shadow': 'none',
        '--password-input-bg': '#412C4E',
        '--password-input-border': '#873D48',
        '--password-input-focus-shadow': 'rgba(232, 112, 66, 0.7)',
        '--password-input-focus-border': '#E87042',
        '--stats-label-color': '#FDECBF',
        '--stats-value-color': '#FFFFFF',
        '--graph-bar-bg': '#873D48',
        '--wall-color': '#873D48',
        '--player-color': '#E87042',
        '--goal-color': '#FBB03B',
        '--trail-color': 'rgba(232, 112, 66, 0.8)',
        '--trail-inactive-color': 'rgba(232, 112, 66, 0.2)',
        '--trail-color-end': 'rgba(251, 176, 59, 0.1)',
        '--dpad-bg-color': 'rgba(255, 255, 255, 0.1)',
        '--dpad-border-color': 'rgba(255, 255, 255, 0.15)',
        '--dpad-active-bg-color': 'rgba(255, 255, 255, 0.25)',
        '--background-image': 'none',
        '--font-family-body': "'Montserrat', sans-serif",
        '--font-family-title': "'Cormorant Garamond', serif",
        '--font-family-button': "'Montserrat', sans-serif",
        '--font-family-stats-label': "'Cormorant Garamond', serif",
        '--font-family-stats-value': "'Montserrat', sans-serif",
        '--font-weight-title': '700',
        '--font-weight-button': '600',
        '--font-weight-stats-label': '700',
        '--font-size-button': '1rem',
        '--font-size-stats-label': '1.3rem',
        '--main-title-shadow': 'none',
    },
    nautical: {
        '--background-color': '#F8F9FA',
        '--vignette-color': 'rgba(0, 0, 0, 0.2)',
        '--main-title-color': '#001A41',
        '--text-color': '#001A41',
        '--button-border-color': '#001A41',
        '--button-text-color': '#001A41',
        '--button-hover-bg-color': '#001A41',
        '--button-hover-text-color': '#F8F9FA',
        '--active-btn-bg-color': '#001A41',
        '--active-btn-text-color': '#F8F9FA',
        '--panel-shadow-color': 'rgba(0, 26, 65, 0.1)',
        '--panel-border-color': '#E1E5EB',
        '--panel-bg-color': 'rgba(255, 255, 255, 0.92)',
        '--message-box-title-color': '#D4A259',
        '--message-box-title-shadow': 'none',
        '--password-input-bg': '#FFFFFF',
        '--password-input-border': '#E1E5EB',
        '--password-input-focus-shadow': 'rgba(212, 162, 89, 0.7)',
        '--password-input-focus-border': '#D4A259',
        '--stats-label-color': '#001A41',
        '--stats-value-color': '#001A41',
        '--graph-bar-bg': '#001A41',
        '--wall-color': '#001A41',
        '--player-color': '#C21A25',
        '--goal-color': '#D4A259',
        '--trail-color': 'rgba(194, 26, 37, 0.8)',
        '--trail-inactive-color': 'rgba(194, 26, 37, 0.2)',
        '--trail-color-end': 'rgba(0, 26, 65, 0.1)',
        '--dpad-bg-color': 'rgba(255, 255, 255, 0.15)',
        '--dpad-border-color': 'rgba(255, 255, 255, 0.25)',
        '--dpad-active-bg-color': 'rgba(255, 255, 255, 0.3)',
        '--background-image': 'none',
        '--font-family-body': "'Montserrat', sans-serif",
        '--font-family-title': "'Montserrat', sans-serif",
        '--font-family-button': "'Montserrat', sans-serif",
        '--font-family-stats-label': "'Montserrat', sans-serif",
        '--font-family-stats-value': "'Montserrat', sans-serif",
        '--font-weight-title': '700',
        '--font-weight-button': '600',
        '--font-weight-stats-label': '600',
        '--font-size-button': '1rem',
        '--font-size-stats-label': '1.1rem',
        '--main-title-shadow': 'none',
    },
    monochrome: {
        '--background-color': '#FFFFFF',
        '--vignette-color': 'rgba(0, 0, 0, 0.2)',
        '--main-title-color': '#121212',
        '--text-color': '#121212',
        '--button-border-color': '#121212',
        '--button-text-color': '#121212',
        '--button-hover-bg-color': '#121212',
        '--button-hover-text-color': '#FFFFFF',
        '--active-btn-bg-color': '#121212',
        '--active-btn-text-color': '#FFFFFF',
        '--panel-shadow-color': 'rgba(18, 18, 18, 0.1)',
        '--panel-border-color': '#D9D9D9',
        '--panel-bg-color': 'rgba(245, 245, 245, 0.92)',
        '--message-box-title-color': '#A9A9A9',
        '--message-box-title-shadow': 'none',
        '--password-input-bg': '#F5F5F5',
        '--password-input-border': '#D9D9D9',
        '--password-input-focus-shadow': 'rgba(18, 18, 18, 0.5)',
        '--password-input-focus-border': '#121212',
        '--stats-label-color': '#A9A9A9',
        '--stats-value-color': '#121212',
        '--graph-bar-bg': '#A9A9A9',
        '--wall-color': '#121212',
        '--player-color': '#A9A9A9',
        '--goal-color': '#121212',
        '--trail-color': 'rgba(169, 169, 169, 0.8)',
        '--trail-inactive-color': 'rgba(169, 169, 169, 0.2)',
        '--trail-color-end': 'rgba(18, 18, 18, 0.1)',
        '--dpad-bg-color': 'rgba(255, 255, 255, 0.15)',
        '--dpad-border-color': 'rgba(0, 0, 0, 0.15)',
        '--dpad-active-bg-color': 'rgba(255, 255, 255, 0.3)',
        '--background-image': 'none',
        '--font-family-body': "'Montserrat', sans-serif",
        '--font-family-title': "'Montserrat', sans-serif",
        '--font-family-button': "'Montserrat', sans-serif",
        '--font-family-stats-label': "'Montserrat', sans-serif",
        '--font-family-stats-value': "'Montserrat', sans-serif",
        '--font-weight-title': '700',
        '--font-weight-button': '600',
        '--font-weight-stats-label': '600',
        '--font-size-button': '1rem',
        '--font-size-stats-label': '1.1rem',
        '--main-title-shadow': 'none',
    },
    sakura: {
        '--background-color': '#FFF8F8',
        '--vignette-color': 'rgba(0, 0, 0, 0.2)',
        '--main-title-color': '#5A4D4C',
        '--text-color': '#5A4D4C',
        '--button-border-color': '#5A4D4C',
        '--button-text-color': '#5A4D4C',
        '--button-hover-bg-color': '#5A4D4C',
        '--button-hover-text-color': '#FFF8F8',
        '--active-btn-bg-color': '#5A4D4C',
        '--active-btn-text-color': '#FFF8F8',
        '--panel-shadow-color': 'rgba(90, 77, 76, 0.1)',
        '--panel-border-color': '#E5D8D7',
        '--panel-bg-color': 'rgba(255, 255, 255, 0.92)',
        '--message-box-title-color': '#E58C96',
        '--message-box-title-shadow': 'none',
        '--password-input-bg': '#F9F2F2',
        '--password-input-border': '#E5D8D7',
        '--password-input-focus-shadow': 'rgba(229, 140, 150, 0.7)',
        '--password-input-focus-border': '#E58C96',
        '--stats-label-color': '#8C7370',
        '--stats-value-color': '#5A4D4C',
        '--graph-bar-bg': '#E58C96',
        '--wall-color': '#8C7370',
        '--player-color': '#E58C96',
        '--goal-color': '#F0C392',
        '--trail-color': 'rgba(229, 140, 150, 0.8)',
        '--trail-inactive-color': 'rgba(229, 140, 150, 0.2)',
        '--trail-color-end': 'rgba(240, 195, 146, 0.1)',
        '--dpad-bg-color': 'rgba(255, 255, 255, 0.15)',
        '--dpad-border-color': 'rgba(255, 255, 255, 0.25)',
        '--dpad-active-bg-color': 'rgba(255, 255, 255, 0.3)',
        '--background-image': 'none',
        '--font-family-body': "'Montserrat', sans-serif",
        '--font-family-title': "'Cormorant Garamond', serif",
        '--font-family-button': "'Montserrat', sans-serif",
        '--font-family-stats-label': "'Cormorant Garamond', serif",
        '--font-family-stats-value': "'Montserrat', sans-serif",
        '--font-weight-title': '700',
        '--font-weight-button': '600',
        '--font-weight-stats-label': '700',
        '--font-size-button': '1rem',
        '--font-size-stats-label': '1.3rem',
        '--main-title-shadow': 'none',
    },
    evergreen: {
        '--background-color': '#EAE7DC',
        '--vignette-color': 'rgba(0, 0, 0, 0.2)',
        '--main-title-color': '#3C412E',
        '--text-color': '#3C412E',
        '--button-border-color': '#3C412E',
        '--button-text-color': '#3C412E',
        '--button-hover-bg-color': '#3C412E',
        '--button-hover-text-color': '#EAE7DC',
        '--active-btn-bg-color': '#3C412E',
        '--active-btn-text-color': '#EAE7DC',
        '--panel-shadow-color': 'rgba(60, 65, 46, 0.1)',
        '--panel-border-color': '#D8D1C1',
        '--panel-bg-color': 'rgba(242, 240, 233, 0.92)',
        '--message-box-title-color': '#E59500',
        '--message-box-title-shadow': 'none',
        '--password-input-bg': '#E0DACB',
        '--password-input-border': '#D8D1C1',
        '--password-input-focus-shadow': 'rgba(229, 149, 0, 0.7)',
        '--password-input-focus-border': '#E59500',
        '--stats-label-color': '#582F0E',
        '--stats-value-color': '#3C412E',
        '--graph-bar-bg': '#582F0E',
        '--wall-color': '#582F0E',
        '--player-color': '#80B462',
        '--goal-color': '#E59500',
        '--trail-color': 'rgba(128, 180, 98, 0.8)',
        '--trail-inactive-color': 'rgba(128, 180, 98, 0.2)',
        '--trail-color-end': 'rgba(229, 149, 0, 0.1)',
        '--dpad-bg-color': 'rgba(255, 255, 255, 0.15)',
        '--dpad-border-color': 'rgba(255, 255, 255, 0.25)',
        '--dpad-active-bg-color': 'rgba(255, 255, 255, 0.3)',
        '--background-image': 'none',
        '--font-family-body': "'Montserrat', sans-serif",
        '--font-family-title': "'Montserrat', sans-serif",
        '--font-family-button': "'Montserrat', sans-serif",
        '--font-family-stats-label': "'Montserrat', sans-serif",
        '--font-family-stats-value': "'Montserrat', sans-serif",
        '--font-weight-title': '700',
        '--font-weight-button': '600',
        '--font-weight-stats-label': '600',
        '--font-size-button': '1rem',
        '--font-size-stats-label': '1.1rem',
        '--main-title-shadow': 'none',
    },
    blueprint: {
        '--background-color': '#0A192F',
        '--vignette-color': 'rgba(2, 12, 27, 0.9)',
        '--main-title-color': '#FF6700',
        '--text-color': '#CCD6F6',
        '--button-border-color': '#64FFDA',
        '--button-text-color': '#64FFDA',
        '--button-hover-bg-color': 'rgba(100, 255, 218, 0.1)',
        '--button-hover-text-color': '#64FFDA',
        '--active-btn-bg-color': '#64FFDA',
        '--active-btn-text-color': '#0A192F',
        '--panel-shadow-color': 'rgba(2, 12, 27, 0.7)',
        '--panel-border-color': '#172A45',
        '--panel-bg-color': 'rgba(23, 42, 69, 0.92)',
        '--message-box-title-color': '#64FFDA',
        '--message-box-title-shadow': 'none',
        '--password-input-bg': '#0A192F',
        '--password-input-border': '#172A45',
        '--password-input-focus-shadow': 'rgba(100, 255, 218, 0.5)',
        '--password-input-focus-border': '#64FFDA',
        '--stats-label-color': '#8892B0',
        '--stats-value-color': '#CCD6F6',
        '--graph-bar-bg': '#172A45',
        '--wall-color': '#64FFDA',
        '--player-color': '#FF6700',
        '--goal-color': '#FF6700',
        '--trail-color': 'rgba(255, 103, 0, 0.8)',
        '--trail-inactive-color': 'rgba(255, 103, 0, 0.2)',
        '--trail-color-end': 'rgba(100, 255, 218, 0.1)',
        '--dpad-bg-color': 'rgba(100, 255, 218, 0.1)',
        '--dpad-border-color': 'rgba(100, 255, 218, 0.2)',
        '--dpad-active-bg-color': 'rgba(100, 255, 218, 0.25)',
        '--background-image': 'none',
        '--font-family-body': "'Roboto Mono', monospace",
        '--font-family-title': "'Roboto Mono', monospace",
        '--font-family-button': "'Roboto Mono', monospace",
        '--font-family-stats-label': "'Roboto Mono', monospace",
        '--font-family-stats-value': "'Roboto Mono', monospace",
        '--font-weight-title': '700',
        '--font-weight-button': '700',
        '--font-weight-stats-label': '400',
        '--font-size-button': '1rem',
        '--font-size-stats-label': '1.1rem',
        '--main-title-shadow': 'none',
    },
};

let currentThemeCallback;

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
    localStorage.setItem('meghTheme', themeName);

    // Update selected state in theme pickers
    document.querySelectorAll('.theme-preview-container').forEach(container => {
        container.classList.toggle('selected', container.dataset.themeName === themeName);
    });

    if (typeof onFinish === 'function') {
        // Redrawing the maze after theme application can be slow. Deferring it
        // ensures the UI updates first. Calling with an arrow function `() => onFinish()`
        // prevents requestAnimationFrame from passing a timestamp argument to `init`,
        // which fixes the bug where changing themes would reset the game state.
        requestAnimationFrame(() => onFinish());
    }
    endPerf('applyTheme');
}

function populateThemePreviews() {
    const grids = document.querySelectorAll('[data-theme-grid]');
    const template = document.getElementById('theme-preview-template');

    grids.forEach(grid => {
        grid.innerHTML = ''; // Clear existing previews
        for (const [themeName, theme] of Object.entries(THEMES)) {
            const preview = template.content.cloneNode(true);
            const container = preview.querySelector('.theme-preview-container');
            const bg = preview.querySelector('.preview-bg');
            const wall = preview.querySelector('.preview-wall');
            const player = preview.querySelector('.preview-player');
            const goal = preview.querySelector('.preview-goal');
            const nameEl = preview.querySelector('.theme-name');
            
            container.dataset.themeName = themeName;
            bg.style.backgroundColor = theme['--background-color'];
            wall.style.backgroundColor = theme['--wall-color'];
            player.style.backgroundColor = theme['--player-color'];
            goal.style.backgroundColor = theme['--goal-color'];
            nameEl.textContent = themeName;

            container.addEventListener('click', () => applyTheme(themeName, currentThemeCallback));
            container.addEventListener('keydown', (e) => {
                if(e.key === 'Enter' || e.key === ' ') {
                    applyTheme(themeName, currentThemeCallback);
                }
            });

            grid.appendChild(preview);
        }
    });
}

// --- UI Utility Functions ---
export function formatTime(ms) {
    if (ms === Infinity || ms === null || isNaN(ms)) return "--:--";
    const totalSeconds = Math.abs(ms) / 1000;
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
    const tenths = Math.floor((Math.abs(ms) % 1000) / 100).toString();
    const sign = ms < 0 ? "-" : "";
    return `${sign}${minutes}:${seconds}`;
}

export function updateTimer(ms) {
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
    timerEl.textContent = formattedTime;
}

export function updateScoreAttemptsDisplay(gameMode, attempts, score) {
    if (gameMode === 'daily') {
        scoreAttemptsContainer.classList.remove('hidden');
        comebackMessageEl.classList.toggle('hidden', attempts > 0);
        scoreAttemptsLabel.textContent = "ATTEMPTS";
        scoreAttemptsValue.textContent = attempts;
    } else { // endless
        comebackMessageEl.classList.add('hidden');
        scoreAttemptsContainer.classList.remove('hidden');
        scoreAttemptsLabel.textContent = "SCORE";
        scoreAttemptsValue.textContent = score;
    }
}

export function setActiveMode(mode) {
    dailyModeBtn.classList.toggle('active-mode', mode === 'daily');
    endlessModeBtn.classList.toggle('active-mode', mode === 'endless');
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
    gameStartText.textContent = 'PRESS ANY KEY TO START';
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

// --- Sound Icon Management ---
const soundOnIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`;
const soundOffIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>`;

function updateSoundIcon() {
    const isMuted = audio.isAudioMuted();
    soundToggleBtn.innerHTML = isMuted ? soundOffIcon : soundOnIcon;
    soundToggleBtn.setAttribute('aria-label', isMuted ? 'Enable sound' : 'Disable sound');
}


// --- Main UI Initialization ---
export function initUI(onStart, hasGameStarted, onThemeChange) {
    log('Initializing UI...');
    currentThemeCallback = onThemeChange;
    populateThemePreviews();

    const startBtn = document.getElementById('startBtn');
    startBtn.addEventListener('click', () => {
        audio.ensureAudioContextStarted();
        closeModal(instructions);
        onStart();
    });
    
    // Mobile Options Menu
    const openOptionsBtn = document.getElementById('openOptionsBtn');
    openOptionsBtn.addEventListener('click', () => openModal(optionsModal));

    // Handle multiple close buttons for modals
    [
        { btn: 'closeThemeBtn', modal: themeModal },
        { btn: 'closeStatsBtn', modal: statsModal },
        { btn: 'passwordCancel', modal: passwordModal },
        { btn: 'closeAboutBtn', modal: aboutModal },
        { btn: 'closeOptionsBtn', modal: optionsModal }
    ].forEach(({ btn, modal }) => {
        document.getElementById(btn).addEventListener('click', () => closeModal(modal));
    });

    // Handle open buttons (desktop and mobile)
    getThemeButtons().forEach(btn => btn.addEventListener('click', () => {
        closeModal(optionsModal); // Close options if open
        openModal(themeModal);
    }));
    getAboutButtons().forEach(btn => btn.addEventListener('click', () => {
        closeModal(optionsModal);
        openModal(aboutModal);
    }));


    // Sound Toggle Handler
    soundToggleBtn.addEventListener('click', async () => {
        await audio.toggleMute();
        updateSoundIcon();
    });
    
    // Set initial icon state
    updateSoundIcon();

    // Password input clear error on focus
    passwordInput.addEventListener('focus', () => passwordInput.classList.remove('error'));
    
    // Close modal on backdrop click
    [instructions, winMessage, passwordModal, statsModal, themeModal, confirmModal, aboutModal, optionsModal].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal(modal);
        });
    });

    const savedTheme = localStorage.getItem('meghTheme') || 'serenity';
    const isReturningUser = !!localStorage.getItem('meghTheme');

    // Always apply the theme styles synchronously.
    applyTheme(savedTheme, hasGameStarted() ? onThemeChange : undefined);

    if (isReturningUser) {
        // For returning users, start the game on the next available frame.
        // This ensures the theme styles have been applied by the browser, fixing rendering bugs.
        requestAnimationFrame(onStart);
    } else {
        // For new users, show the instructions. The game will start when they click the button.
        openModal(instructions);
    }
}
