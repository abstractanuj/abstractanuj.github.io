/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { Maze } from './js/maze.js';
import { Player } from './js/player.js';
import * as ui from './js/ui.js';
import * as state from './js/state.js';
import * as Debug from './js/debug.js';
import * as audio from './js/audio.js';
import { Timer } from './js/timer.js';
import * as Particles from './js/particles.js';
import { events } from './js/events.js';


// --- Game State ---
let maze, player, animationFrameId, randomGen, optimalPath, optimalPathLength, timer;
let solutionAnimationProgress = 0;
let solutionAnimationStartTime = 0;
let dailySeed;
let gameMode = 'daily'; // 'daily' or 'endless'
let dailyTimeLimit = 120000; // Default/fallback for daily mode, will be calculated dynamically.
let mazesSolved = 0;
let initRetryCount = 0;
const MAX_INIT_RETRIES = 120; // about 2 seconds
let currentInitRequestId = 0;
let hasGameStarted = false; // Tracks if the very first game has been initialized
let pendingConfirmationAction = null;

// --- Finite State Machine (FSM) ---
const gameFSM = {
    currentState: 'LOADING',
    states: {
        LOADING: { enter: () => Debug.log('FSM: Entering LOADING') },
        READY: { enter: () => {
            if (state.isFirstVisit()) {
                gameFSM.transitionTo('ONBOARDING');
            } else {
                ui.showPressToStartMessage();
            }
        }},
        ONBOARDING: { enter: () => ui.showOnboardingTutorial(maze, player) },
        COUNTDOWN: { enter: () => {
            audio.playMusic();
            ui.startGameCountdown(() => gameFSM.transitionTo('PLAYING'));
        }},
        PLAYING: { enter: () => {
            timer.start();
            events.publish('game:started');
        }},
        LEVEL_TRANSITION: { enter: () => {
            ui.flashEndlessLevelClear(() => {
                init(true, true, timer.getTime());
                 ui.startFastCountdown(() => gameFSM.transitionTo('PLAYING'));
            });
        }},
        LEVEL_COMPLETE: { enter: () => handleGameEnd() },
        GAME_OVER: { enter: () => handleGameOver() },
        SHOWING_SOLUTION: { enter: () => {
            ui.closeModal(ui.winMessage);
            solutionAnimationProgress = 0;
            solutionAnimationStartTime = lastTime;
        }},
    },
    transitionTo(newState) {
        if (!this.states[newState]) {
            Debug.error(`FSM: Invalid state transition to ${newState}`);
            return;
        }
        Debug.log(`FSM: Transitioning from ${this.currentState} to ${newState}`);
        this.currentState = newState;
        if (this.states[newState].enter) {
            this.states[newState].enter();
        }
        events.publish('fsm:stateChange', this.currentState);
    }
};


// --- Input State Handling ---
const keyState = {};
const keyMap = {
    'ArrowUp': { dx: 0, dy: -1 }, 'w': { dx: 0, dy: -1 },
    'ArrowDown': { dx: 0, dy: 1 }, 's': { dx: 0, dy: 1 },
    'ArrowLeft': { dx: -1, dy: 0 }, 'a': { dx: -1, dy: 0 },
    'ArrowRight': { dx: 1, dy: 0 }, 'd': { dx: 1, dy: 0 }
};


// --- Game Logic ---
function handlePlayerMove(dx, dy) {
    if (gameFSM.currentState !== 'PLAYING') return;
    
    if (player.moveCooldown <= 0) {
        const moved = player.move(dx, dy);
        if (moved) {
            events.publish('player:move');
            player.setMoveCooldown(false);
        } else {
            events.publish('player:wall-bump');
            player.setMoveCooldown(true);
        }
    }
}

function handleGameEnd() {
    Debug.log('Game ended.', { gameMode, mazesSolved, score: player.path.length - 1, time: timer.getTime() });
    Particles.createWinExplosion(player.x, player.y, maze.cellSize);
    events.publish('player:win');
    timer.stop();
    
    if (gameMode === 'endless') {
        mazesSolved++;
        ui.updateScoreAttemptsDisplay(gameMode, 0, mazesSolved);
        
        const timeRemaining = timer.getTime();
        const baseBonus = 10000;
        const speedBonus = Math.floor(timeRemaining / 4);
        const timeCap = 90000;
        const newTime = Math.min(timeRemaining + baseBonus + speedBonus, timeCap);
        timer.setTime(newTime);
        state.updateStats(mazesSolved, false, 'endless');
        gameFSM.transitionTo('LEVEL_TRANSITION');
        return;
    }

    // Daily Mode Logic
    const currentScore = player.path.length - 1;
    const currentTime = dailyTimeLimit - timer.getTime(); // Calculate solve time from countdown
    const isOptimal = currentScore === optimalPathLength;
    
    state.updateDailyState(currentScore, currentTime, player.path);
    state.updateStats(currentTime, isOptimal, 'daily');

    const winData = {
        isOptimal,
        currentScore,
        currentTime,
        attemptsLeft: state.getAttemptsLeft() - 1,
        bestScore: state.getBestScore(),
        optimalPathLength
    };
    ui.showWinModal(winData);

    state.decrementAttempts();
    state.saveGameState(dailySeed);
    ui.updateScoreAttemptsDisplay(gameMode, state.getAttemptsLeft());
}


function handleGameOver() {
    Debug.log('Game over.', { mazesSolved });
    timer.stop();
    events.publish('game:over');
    ui.showGameOverModal(mazesSolved);
}

function handleTimeUp() {
    Debug.log('Time is up for daily mode.');
    timer.stop();
    events.publish('game:timeup');
    state.decrementAttempts();
    state.saveGameState(dailySeed);
    ui.updateScoreAttemptsDisplay(gameMode, state.getAttemptsLeft());
    ui.showTimeUpModal(state.getAttemptsLeft(), optimalPathLength);
}

function handleTimerUp() {
    if (gameFSM.currentState !== 'PLAYING') return;
    if (gameMode === 'daily') {
        handleTimeUp();
    } else { // endless
        gameFSM.transitionTo('GAME_OVER');
    }
}

function restartEndless() {
    Debug.log('Restarting endless mode.');
    ui.closeModal(ui.winMessage);
    init(true);
}

function restartDailyAttempt() {
    Debug.log('Restarting daily attempt.');
    ui.closeModal(ui.winMessage);
    init(false, true, dailyTimeLimit);
    gameFSM.transitionTo('COUNTDOWN');
}

// --- Event Subscriptions ---
events.subscribe('ui:restartDailyAttempt', restartDailyAttempt);
events.subscribe('ui:restartEndless', restartEndless);
events.subscribe('ui:showOptimalPath', () => gameFSM.transitionTo('SHOWING_SOLUTION'));
events.subscribe('ui:onboardingComplete', () => {
    state.setVisited();
    gameFSM.transitionTo('READY');
});
events.subscribe('ui:share', (event) => {
    const button = event.target;
    const originalText = button.textContent;
    Debug.log('Share action triggered.');
    const text = state.generateShareText(maze, optimalPathLength, dailySeed);
    
    ui.copyToClipboard(text).then(() => {
        button.textContent = 'Copied!';
        button.disabled = true;
        setTimeout(() => {
            button.textContent = originalText;
            button.disabled = false;
        }, 2000);
    });
});


// --- Timer Functions ---
function pauseTimer() {
    if (timer && timer.getIsRunning()) {
        Debug.log('Timer paused for modal.');
        timer.pause();
    }
}
function resumeTimer() {
    const isAnyModalOpen = document.querySelector('.modal:not(.hidden)');
    if (isAnyModalOpen) {
        Debug.log('Modal closed, but another is still open. Timer remains paused.');
        return;
    }
    if (timer && gameFSM.currentState === 'PLAYING') {
        Debug.log('All modals closed. Timer resumed.');
        timer.resume();
    }
}


// --- Game Loop and Initialization ---
function init(useRandomSeed, isContinuation, newTime) {
    const requestId = ++currentInitRequestId;
    const isRequestForDaily = !useRandomSeed;
    const isCurrentModeDaily = (gameMode === 'daily');
    if (isRequestForDaily !== isCurrentModeDaily && hasGameStarted) {
        Debug.warn('Mismatched init request. Aborting stale init call.');
        return;
    }

    const container = document.getElementById('canvas-container');
    if (container.clientWidth === 0) {
        if (initRetryCount < MAX_INIT_RETRIES) {
            initRetryCount++;
            requestAnimationFrame(() => {
                if (requestId !== currentInitRequestId) return;
                init(useRandomSeed, isContinuation, newTime);
            });
            return;
        } else {
            Debug.error('Maze initialization failed: Canvas container never acquired a width.');
            return;
        }
    }
    initRetryCount = 0;
    
    Debug.startPerf('init');
    Debug.log('Initializing game...', { useRandomSeed, isContinuation, newTime, gameMode });
    
    if (timer) timer.stop();
    
    hasGameStarted = true;
    
    if (animationFrameId) lastTime = 0;
    
    ui.closeModal(ui.winMessage);

    const isDaily = gameMode === 'daily' && !useRandomSeed;
    const date = new Date();
    dailySeed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
    const seed = isDaily ? dailySeed : Date.now();
    Debug.log('Using seed:', seed);
    randomGen = new state.SeededRandom(seed);

    if (isDaily) {
        state.loadGameState(dailySeed);
    }
    
    const attempts = state.getAttemptsLeft();
    const newMazeButtons = ui.getNewMazeButtons();
    if (gameMode === 'daily' && attempts <= 0) {
        newMazeButtons.forEach(btn => btn.disabled = true);
    } else {
        newMazeButtons.forEach(btn => btn.disabled = false);
    }

    const size = Math.min(container.clientWidth, container.clientHeight);

    ui.canvas.width = size;
    ui.canvas.height = size;
    Particles.resizeParticleCanvas(size, size);

    let cols, rows, startX, startY, endX, endY, cellSize;
    let baseDim = 17;

    if (gameMode === 'endless') {
        let level = Math.floor(mazesSolved / 2);
        const maxLevel = 5;
        if (level > maxLevel) level = maxLevel;
        const mazeDim = baseDim + (level * 2);
        
        cellSize = Math.floor(size / mazeDim);
        cols = Math.floor(ui.canvas.width / cellSize);
        rows = Math.floor(ui.canvas.height / cellSize);
        startX = Math.floor(randomGen.random() * cols);
        startY = Math.floor(randomGen.random() * rows);
        
        const minDistance = Math.floor(Math.max(cols, rows) * 0.7);
        do {
            endX = Math.floor(randomGen.random() * cols);
            endY = Math.floor(randomGen.random() * rows);
        } while (Math.hypot(startX - endX, startY - endY) < minDistance);

    } else { // Daily mode
        cellSize = Math.floor(size / baseDim);
        cols = Math.floor(ui.canvas.width / cellSize);
        rows = Math.floor(ui.canvas.height / cellSize);
        startX = 0; startY = 0;
        endX = cols - 1; endY = rows - 1;
    }

    if (!cols || !rows || cols <= 0 || rows <= 0) return;

    const mazeOptions = { startX, startY, endX, endY };
    maze = new Maze(cols, rows, cellSize, randomGen, mazeOptions, gameMode, mazesSolved);
    maze.preRender();
    maze.startAnimation();

    player = new Player(startX, startY, cellSize, maze, () => gameFSM.transitionTo('LEVEL_COMPLETE'));

    optimalPath = state.findPath(maze, maze.grid[startY][startX], maze.grid[endY][endX]);
    optimalPathLength = optimalPath ? optimalPath.length - 1 : 0;
    state.setOptimalPath(optimalPath, optimalPathLength);
    
    if (gameMode === 'daily') {
        dailyTimeLimit = 30000 + (optimalPathLength * 600);
    }

    if (!isContinuation) {
        if (gameMode === 'daily') timer.setTime(dailyTimeLimit);
        else { mazesSolved = 0; timer.setTime(60000); }
        gameFSM.transitionTo('READY');
    } else {
        timer.setTime(newTime);
    }
    
    ui.updateTimer(timer.getTime());
    ui.updateScoreAttemptsDisplay(gameMode, state.getAttemptsLeft(), mazesSolved);
    
    Debug.endPerf('init');
}

// --- Main Animation Loop ---
let lastTime = 0;
function animate(currentTime) {
    if (!lastTime) lastTime = currentTime;
    const deltaTime = (currentTime - lastTime) / 1000.0;
    lastTime = currentTime;

    if (timer) {
        timer.update(deltaTime);
    }

    if (player) {
        player.updateCooldown(deltaTime);
        if (gameFSM.currentState === 'PLAYING') {
            if (keyState['ArrowUp'] || keyState['w']) handlePlayerMove(0, -1);
            if (keyState['ArrowDown'] || keyState['s']) handlePlayerMove(0, 1);
            if (keyState['ArrowLeft'] || keyState['a']) handlePlayerMove(-1, 0);
            if (keyState['ArrowRight'] || keyState['d']) handlePlayerMove(1, 0);
        }
    }
    
    if (ui.ctx) {
      ui.ctx.clearRect(0, 0, ui.canvas.width, ui.canvas.height);
      if (maze) {
          maze.drawAnimated(ui.ctx, currentTime);
          maze.drawGoal(ui.ctx);
      }
      if (gameFSM.currentState === 'SHOWING_SOLUTION') {
          const animationDuration = 2000;
          const elapsed = currentTime - solutionAnimationStartTime;
          solutionAnimationProgress = Math.min(elapsed / animationDuration, 1);
          state.drawOptimalPath(ui.ctx, player.size, maze.cellSize, solutionAnimationProgress);
      } else if (player && (gameMode === 'endless' || state.getAttemptsLeft() > 0)) {
          player.updateVisuals(deltaTime);
          player.draw(ui.ctx);
      }
    }
    
    Particles.updateAndDrawParticles();

    Debug.updateOverlay({
        fsmState: gameFSM.currentState,
        mode: gameMode,
        timer: ui.formatTime(timer ? timer.getTime() : 0),
        timerRunning: timer ? timer.getIsRunning() : false,
        pos: player ? `${player.x}, ${player.y}` : 'N/A',
        pathLength: player ? player.path.length -1 : 'N/A',
        optimal: optimalPathLength,
        attempts: state.getAttemptsLeft(),
        score: mazesSolved
    });

    animationFrameId = requestAnimationFrame(animate);
}

function handleNewMazeClick() {
    ui.closeModal(ui.optionsModal);
    Debug.log('New Maze/Restart button clicked.');
    
    if (gameFSM.currentState !== 'PLAYING') {
        init(gameMode === 'endless');
        return;
    }

    pendingConfirmationAction = () => {
        if (gameMode === 'endless') {
            init(true);
        } else if (state.getAttemptsLeft() > 0) {
            state.decrementAttempts();
            ui.updateScoreAttemptsDisplay(gameMode, state.getAttemptsLeft());
            if (state.getAttemptsLeft() <= 0) {
                ui.getNewMazeButtons().forEach(btn => btn.disabled = true);
            }
            restartDailyAttempt();
        }
    };
    
    const title = gameMode === 'endless' ? 'Restart Endless Run?' : 'Restart Daily Puzzle?';
    const text = gameMode === 'endless' ? 'Your current progress and score will be lost.' : 'This will use one of your daily attempts.';
    ui.showConfirmModal(title, text);
}


// --- Event Listeners ---
window.addEventListener('keydown', (e) => {
    if ((e.key.toLowerCase() === 'f' || e.code === 'Space') && gameFSM.currentState === 'READY') {
        e.preventDefault();
        gameFSM.transitionTo('COUNTDOWN');
    }
    if (keyMap[e.key]) {
        e.preventDefault();
        keyState[e.key] = true;
    }
});
window.addEventListener('keyup', (e) => {
    if (keyMap[e.key]) {
        e.preventDefault();
        keyState[e.key] = false;
        if (player) player.resetInputState();
    }
});

function setupSwipeControls() {
    const canvasContainer = document.getElementById('canvas-container');
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    const swipeThreshold = 30; // pixels

    canvasContainer.addEventListener('touchstart', (e) => {
        if (gameFSM.currentState === 'READY') {
            gameFSM.transitionTo('COUNTDOWN');
        }
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    canvasContainer.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;
        handleSwipe();
    }, { passive: true });

    function handleSwipe() {
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);

        if (Math.max(absDeltaX, absDeltaY) < swipeThreshold) return;

        if (absDeltaX > absDeltaY) {
            handlePlayerMove(deltaX > 0 ? 1 : -1, 0); // Right or Left
        } else {
            handlePlayerMove(0, deltaY > 0 ? 1 : -1); // Down or Up
        }
    }
}

ui.getNewMazeButtons().forEach(btn => btn.addEventListener('click', handleNewMazeClick));

function toggleGameMode(newMode) {
    if (gameMode === newMode && hasGameStarted) return;
    ui.closeModal(ui.optionsModal);

    if (newMode === 'daily' && gameFSM.currentState === 'PLAYING' && gameMode === 'endless') {
        pendingConfirmationAction = () => setTimeout(() => setGameMode(newMode), 50);
        ui.showConfirmModal('End Endless Run?', `Your score of ${mazesSolved} will be saved.`);
        return;
    }
    
    setGameMode(newMode);
}

function setGameMode(newMode) {
    if (gameMode === newMode && hasGameStarted) return;
    Debug.log('Game mode set', { newMode });
    
    gameMode = newMode;
    ui.setActiveMode(newMode);
    ui.getNewMazeButtons().forEach(btn => btn.textContent = 'Restart');

    const themeToApply = (newMode === 'endless') ? 'arcade' : 'zen';
    
    const reInitCallback = hasGameStarted ? () => init(gameMode === 'endless') : undefined;
    ui.applyTheme(themeToApply, reInitCallback);
}


// --- Initial Load ---
document.addEventListener('DOMContentLoaded', () => {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/megh/sw.js').catch(err => {
                Debug.error('Service Worker registration failed: ', err);
            });
        });
    }
    
    timer = new Timer(handleTimerUp);
    Debug.init();
    Particles.initParticles();
    audio.init();
    ui.initUI();

    events.subscribe('fsm:stateChange', (newState) => {
        const isGameplayActive = ['ONBOARDING', 'COUNTDOWN', 'PLAYING', 'LEVEL_TRANSITION', 'SHOWING_SOLUTION'].includes(newState);
        document.body.classList.toggle('game-playing', isGameplayActive);
    });
    
    ui.getNewMazeButtons().forEach(btn => btn.textContent = 'Restart');
    
    window.addEventListener('modal:open', pauseTimer);
    window.addEventListener('modal:close', resumeTimer);
    
    document.getElementById('confirmSubmit').addEventListener('click', () => {
        ui.closeModal(ui.confirmModal);
        if (typeof pendingConfirmationAction === 'function') {
            pendingConfirmationAction();
            pendingConfirmationAction = null;
        }
    });
    document.getElementById('confirmCancel').addEventListener('click', () => {
        ui.closeModal(ui.confirmModal);
        pendingConfirmationAction = null;
    });

    // Desktop/Mobile mode buttons
    document.getElementById('dailyModeBtn').addEventListener('click', () => toggleGameMode('daily'));
    document.getElementById('endlessModeBtn').addEventListener('click', () => toggleGameMode('endless'));
    document.getElementById('dailyModeBtnMobile').addEventListener('click', () => toggleGameMode('daily'));
    document.getElementById('endlessModeBtnMobile').addEventListener('click', () => toggleGameMode('endless'));

    setupSwipeControls();
    init(gameMode === 'endless');

    if (!animationFrameId) {
        animationFrameId = requestAnimationFrame(animate);
    }
});