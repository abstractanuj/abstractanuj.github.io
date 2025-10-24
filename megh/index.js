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

// --- Game State ---
let maze, player, animationFrameId, randomGen, optimalPath, optimalPathLength, timer;
let isAutoMoving = false;
let isShowingSolution = false;
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
let isGameActive = false; // Tracks if the current attempt/maze is in progress (timer running or ready to run)
let pendingConfirmationAction = null;
let isGameOver = false;
let isCountdownActive = false;
let shouldResumeTimerAfterInit = false;
let isReadyToStart = false; // New flag to wait for first user input


// --- Input State Handling ---
const keyState = {};
const keyMap = {
    'ArrowUp': { dx: 0, dy: -1 }, 'w': { dx: 0, dy: -1 },
    'ArrowDown': { dx: 0, dy: 1 }, 's': { dx: 0, dy: 1 },
    'ArrowLeft': { dx: -1, dy: 0 }, 'a': { dx: -1, dy: 0 },
    'ArrowRight': { dx: 1, dy: 0 }, 'd': { dx: 1, dy: 0 }
};


// --- Game Logic ---

// New function to create a seamless transition between endless mode levels.
function startEndlessTransitionAndNextLevel(newTime) {
    isAutoMoving = true;
    
    // Use a UI function for the "LEVEL CLEAR!" transition, which includes the success sound.
    ui.flashEndlessLevelClear(() => {
        // This callback executes after the message has faded.
        
        // Setup the next maze in the background.
        init(true, true, newTime);
        
        // Use another UI function for a quick "GO!" start.
        ui.startFastCountdown(() => {
            // This callback executes as "GO!" appears.
            isAutoMoving = false; // Player can move now.
            isGameActive = true;
            timer.start();
        });
    });
}

function handleGameEnd() {
    Debug.log('Game ended.', { gameMode, mazesSolved, score: player.path.length - 1, time: timer.getTime() });
    timer.stop();
    isAutoMoving = true;
    isGameActive = false;

    if (gameMode === 'endless') {
        mazesSolved++;
        ui.updateScoreAttemptsDisplay(gameMode, 0, mazesSolved);
        
        const timeRemaining = timer.getTime();
        // New dynamic bonus: 10 seconds for completion + 25% of remaining time for speed.
        const baseBonus = 10000;
        const speedBonus = Math.floor(timeRemaining / 4);
        const timeCap = 90000; // Cap at 90s to maintain challenge.
        const newTime = Math.min(timeRemaining + baseBonus + speedBonus, timeCap);

        state.updateStats(mazesSolved, false, 'endless');
        
        startEndlessTransitionAndNextLevel(newTime);
        return;
    }

    // Daily Mode Logic
    const currentScore = player.path.length - 1;
    const currentTime = dailyTimeLimit - timer.getTime(); // Calculate solve time from countdown
    const isOptimal = currentScore === optimalPathLength;
    
    state.updateDailyState(currentScore, currentTime, player.path);
    state.updateStats(currentTime, isOptimal, 'daily');

    // --- Win Message UI Logic (moved from ui.js for better separation of concerns) ---
    const winTitle = document.getElementById('winTitle');
    const statsText = document.getElementById('statsText');
    const buttonContainer = document.getElementById('buttonContainer');
    buttonContainer.innerHTML = ''; // Clear previous buttons

    const createButton = (text, onClick, id) => {
        const button = document.createElement('button');
        button.className = 'themed-button font-bold py-3 px-6 rounded-lg text-xl w-full sm:w-auto';
        button.textContent = text;
        if (id) button.id = id;
        button.addEventListener('click', onClick);
        return button;
    };
    
    const timeString = ui.formatTime(currentTime);
    if (isOptimal) {
        winTitle.textContent = "OPTIMAL PATH!";
        statsText.textContent = `You found the most efficient route in ${currentScore} steps! Time: ${timeString}`;
        buttonContainer.appendChild(createButton('Share', shareAction, 'shareButton'));
    } else if (state.getAttemptsLeft() > 1) { // attemptsLeft hasn't been decremented yet for this attempt
        winTitle.textContent = "PATH COMPLETE";
        statsText.textContent = `Your path: ${currentScore} steps. Time: ${timeString}. You have ${state.getAttemptsLeft() - 1} attempts left.`;
        buttonContainer.appendChild(createButton('Try Again', restartDailyAttempt));
    } else {
        winTitle.textContent = "ATTEMPTS FINISHED";
        statsText.textContent = `Your best score today was ${state.getBestScore() === Infinity ? 'N/A' : state.getBestScore()} steps. The optimal path is ${optimalPathLength} steps.`;
        buttonContainer.appendChild(createButton('Show Path', showOptimalPathAction));
        buttonContainer.appendChild(createButton('Share Score', shareAction, 'shareButton'));
    }
    ui.openModal(ui.winMessage);

    state.decrementAttempts();
    state.saveGameState(dailySeed);
    ui.updateScoreAttemptsDisplay(gameMode, state.getAttemptsLeft());
}


function handleGameOver() {
    if (isGameOver) return; // Prevent multiple calls
    isGameOver = true;
    isGameActive = false;
    
    Debug.log('Game over.', { mazesSolved });
    timer.stop();
    isAutoMoving = true;
    
    const winTitle = document.getElementById('winTitle');
    const statsText = document.getElementById('statsText');
    const buttonContainer = document.getElementById('buttonContainer');
    buttonContainer.innerHTML = '';
    
    const createButton = (text, onClick) => {
        const button = document.createElement('button');
        button.className = 'themed-button font-bold py-3 px-6 rounded-lg text-xl';
        button.textContent = text;
        button.addEventListener('click', onClick);
        return button;
    };

    winTitle.textContent = "GAME OVER";
    statsText.textContent = `You solved ${mazesSolved} mazes!`;
    buttonContainer.appendChild(createButton('Try Again', restartEndless));
    ui.openModal(ui.winMessage);
}

function handleTimeUp() {
    Debug.log('Time is up for daily mode.');
    timer.stop();
    isAutoMoving = true;
    isGameActive = false;
    state.decrementAttempts();
    state.saveGameState(dailySeed);
    ui.updateScoreAttemptsDisplay(gameMode, state.getAttemptsLeft());

    const winTitle = document.getElementById('winTitle');
    const statsText = document.getElementById('statsText');
    const buttonContainer = document.getElementById('buttonContainer');
    buttonContainer.innerHTML = '';

    const createButton = (text, onClick) => {
        const button = document.createElement('button');
        button.className = 'themed-button font-bold py-3 px-6 rounded-lg text-xl w-full sm:w-auto';
        button.textContent = text;
        button.addEventListener('click', onClick);
        return button;
    };

    winTitle.textContent = "TIME'S UP";
    if (state.getAttemptsLeft() > 0) {
        statsText.textContent = `You ran out of time. You have ${state.getAttemptsLeft()} attempts left.`;
        buttonContainer.appendChild(createButton('Try Again', restartDailyAttempt));
    } else {
        statsText.textContent = `You ran out of time and have no attempts left. The optimal path is ${optimalPathLength} steps.`;
        buttonContainer.appendChild(createButton('Show Path', showOptimalPathAction));
    }
    ui.openModal(ui.winMessage);
}

function handleTimerUp() {
    if (isGameOver) return; // Prevent multiple calls after game over
    if (gameMode === 'daily') {
        handleTimeUp();
    } else { // endless
        handleGameOver();
    }
}

function restartEndless() {
    Debug.log('Restarting endless mode.');
    ui.closeModal(ui.winMessage);
    init(true);
}

// New function to handle the game start sequence
function startGameSequence() {
    if (isCountdownActive) return;
    isCountdownActive = true;
    isAutoMoving = true; // Lock controls during countdown

    const onCountdownFinished = () => {
        isAutoMoving = false; // Unlock controls
        isGameActive = true;
        timer.start();
        isCountdownActive = false;
    };

    ui.startGameCountdown(onCountdownFinished);
}

function startGame() {
    if (!isReadyToStart) return;
    isReadyToStart = false; // Consume the flag
    audio.playMusic();
    startGameSequence();
}

/**
 * Robustly handles a "Try Again" click in daily mode by re-initializing the maze.
 * This fixes a bug where maze walls could disappear on a "Time's Up" retry.
 */
function restartDailyAttempt() {
    Debug.log('Restarting daily attempt.');
    ui.closeModal(ui.winMessage);
    
    // Re-initialize the maze using the daily seed. isContinuation = true prevents
    // the "Press to Start" message from showing, and we pass the calculated time limit.
    init(false, true, dailyTimeLimit);
    
    // Immediately start the countdown for the new attempt.
    startGameSequence();
}

function showOptimalPathAction() {
    Debug.log('Showing optimal path.');
    ui.closeModal(ui.winMessage);
    isAutoMoving = true;
    isShowingSolution = true;
    solutionAnimationProgress = 0;
    solutionAnimationStartTime = lastTime; // Use timestamp from last animation frame
}

function shareAction(event) {
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
}

// --- Timer Functions ---
function pauseTimer() {
    if (timer && timer.getIsRunning()) {
        Debug.log('Timer paused for modal.');
        timer.pause();
    }
}
function resumeTimer() {
    // Check if any other modal is still visible on the page.
    const isAnyModalOpen = document.querySelector('.modal:not(.hidden)');

    if (isAnyModalOpen) {
        Debug.log('Modal closed, but another is still open. Timer remains paused.');
        return; // Do not resume the timer.
    }

    if (timer && isGameActive && !isCountdownActive) {
        Debug.log('All modals closed. Timer resumed.');
        timer.resume();
    }
}

const isEndlessGameActive = () => gameMode === 'endless' && timer && timer.getIsRunning();


// --- Game Loop and Initialization ---
function init(useRandomSeed, isContinuation, newTime) {
    const requestId = ++currentInitRequestId;

    // Robust check to prevent race conditions from stale init calls.
    const isRequestForDaily = !useRandomSeed;
    const isCurrentModeDaily = (gameMode === 'daily');
    if (isRequestForDaily !== isCurrentModeDaily && hasGameStarted) {
        Debug.warn('Mismatched init request. Aborting stale init call.', {
            requestedDaily: isRequestForDaily,
            currentMode: gameMode,
        });
        return;
    }

    const container = document.getElementById('canvas-container');
    if (container.clientWidth === 0) {
        if (initRetryCount < MAX_INIT_RETRIES) {
            initRetryCount++;
            Debug.log(`Canvas container width is 0. Deferring init. Attempt: ${initRetryCount}`);
            requestAnimationFrame(() => {
                if (requestId !== currentInitRequestId) {
                    Debug.warn('Aborting deferred init due to new request.', { staleId: requestId, currentId: currentInitRequestId });
                    return;
                }
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
    isGameActive = false; // Reset for the new maze/attempt
    isGameOver = false;

    if (useRandomSeed === undefined) {
        const isCurrentlyDaily = gameMode === 'daily';
        Debug.log('Re-initializing for redraw.');
        init(!isCurrentlyDaily, true, timer.getTime());
        return;
    }
    
    if (animationFrameId) {
        // When re-initializing, reset lastTime to prevent a deltaTime spike
        // from time spent in menus or between levels.
        lastTime = 0;
    }

    isAutoMoving = false;
    isShowingSolution = false;
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

    const availableHeight = container.clientHeight;
    const availableWidth = container.clientWidth;
    const size = Math.min(availableWidth, availableHeight);

    ui.canvas.width = size;
    ui.canvas.height = size;

    let cols, rows, startX, startY, endX, endY, cellSize;
    let baseDim = 17; // Use a fixed base dimension for consistent complexity.


    if (gameMode === 'endless') {
        let level = Math.floor(mazesSolved / 2);
        const maxLevel = 5;
        if (level > maxLevel) level = maxLevel;
        
        const mazeDim = baseDim + (level * 2);
        
        cellSize = Math.floor(size / mazeDim);
        if (cellSize < 5) cellSize = 5;
        cols = Math.floor(ui.canvas.width / cellSize);
        rows = Math.floor(ui.canvas.height / cellSize);

        startX = Math.floor(randomGen.random() * cols);
        startY = Math.floor(randomGen.random() * rows);

        // Ensure start and end points are sufficiently far apart
        const minDistance = Math.floor(Math.max(cols, rows) * 0.7);
        let distance;
        do {
            endX = Math.floor(randomGen.random() * cols);
            endY = Math.floor(randomGen.random() * rows);
            distance = Math.sqrt(Math.pow(startX - endX, 2) + Math.pow(startY - endY, 2));
        } while (distance < minDistance);

    } else { // Daily mode
        cellSize = Math.floor(size / baseDim);
        if (cellSize < 10) cellSize = 10;
        cols = Math.floor(ui.canvas.width / cellSize);
        rows = Math.floor(ui.canvas.height / cellSize);
        startX = 0;
        startY = 0;
        endX = cols - 1;
        endY = rows - 1;
    }

    if (!cols || !rows || cols <= 0 || rows <= 0) {
        Debug.warn('Invalid maze dimensions, aborting init.', { cols, rows });
        return;
    };

    const mazeOptions = { startX, startY, endX, endY };
    maze = new Maze(cols, rows, cellSize, randomGen, mazeOptions, gameMode, mazesSolved);
    maze.preRender();
    maze.startAnimation();

    player = new Player(startX, startY, cellSize, maze, handleGameEnd);

    optimalPath = state.findPath(maze, maze.grid[startY][startX], maze.grid[endY][endX]);
    optimalPathLength = optimalPath ? optimalPath.length - 1 : 0;
    state.setOptimalPath(optimalPath, optimalPathLength);
    Debug.log('Maze generated.', { cols: maze.cols, rows: maze.rows, optimalPath: optimalPathLength });

    // --- DYNAMIC TIMER CALCULATION ---
    if (gameMode === 'daily') {
        const baseTime = 30000; // 30 seconds
        const timePerStep = 600; // 0.6 seconds per optimal step
        dailyTimeLimit = baseTime + (optimalPathLength * timePerStep);
        Debug.log('Calculated daily time limit:', { time: dailyTimeLimit, optimal: optimalPathLength });
    }

    if (!isContinuation) {
        if (gameMode === 'daily') {
            timer.setTime(dailyTimeLimit);
        } else { // endless
            mazesSolved = 0;
            timer.setTime(60000);
        }
        isReadyToStart = true;
        ui.showPressToStartMessage();
        ui.showOnboardingHint();
    } else {
        timer.setTime(newTime);
    }

    if (shouldResumeTimerAfterInit) {
        isGameActive = true;
        timer.start();
        shouldResumeTimerAfterInit = false;
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

    if (player && !isAutoMoving && !isShowingSolution) {
        player.updateCooldown(deltaTime);
        if (keyState['ArrowUp'] || keyState['w']) player.handleContinuousMove(0, -1);
        if (keyState['ArrowDown'] || keyState['s']) player.handleContinuousMove(0, 1);
        if (keyState['ArrowLeft'] || keyState['a']) player.handleContinuousMove(-1, 0);
        if (keyState['ArrowRight'] || keyState['d']) player.handleContinuousMove(1, 0);
    }
    
    if (ui.ctx) {
      ui.ctx.clearRect(0, 0, ui.canvas.width, ui.canvas.height);
      if (maze) {
          maze.drawAnimated(ui.ctx, currentTime);
          maze.drawGoal(ui.ctx);
      }
      if (isShowingSolution) {
          const animationDuration = 2000; // 2 seconds
          const elapsed = currentTime - solutionAnimationStartTime;
          solutionAnimationProgress = Math.min(elapsed / animationDuration, 1);
          state.drawOptimalPath(ui.ctx, player.size, maze.cellSize, solutionAnimationProgress);
      } else if (player && (gameMode === 'endless' || state.getAttemptsLeft() > 0)) {
          player.updateVisuals(deltaTime);
          player.draw(ui.ctx);
      }
    }

    Debug.updateOverlay({
        mode: gameMode,
        seed: gameMode === 'daily' ? dailySeed : 'N/A (Endless)',
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
    ui.closeModal(ui.optionsModal); // Close mobile options menu if open
    Debug.log('New Maze/Restart button clicked.');
    if (gameMode === 'endless') {
        // If the game is active (player is moving, timer running), show confirmation.
        if (isGameActive) {
            pendingConfirmationAction = () => {
                init(true);
            };
            document.getElementById('confirmModalTitle').textContent = 'Restart Endless Run?';
            document.getElementById('confirmModalText').textContent = 'Your current progress and score will be lost.';
            ui.openModal(ui.confirmModal);
        } else {
            // Otherwise (e.g., on the 'Game Over' screen, or before starting), just restart.
            init(true);
        }
        return;
    }
    if (state.getAttemptsLeft() > 0) {
        pendingConfirmationAction = () => {
            state.decrementAttempts();
            const attempts = state.getAttemptsLeft();
            ui.updateScoreAttemptsDisplay(gameMode, attempts);
            if (attempts <= 0) {
                ui.getNewMazeButtons().forEach(btn => btn.disabled = true);
            }
            restartDailyAttempt();
        };
        document.getElementById('confirmModalTitle').textContent = 'Restart Daily Puzzle?';
        document.getElementById('confirmModalText').textContent = 'This will use one of your daily attempts. Your current progress will be lost.';
        ui.openModal(ui.confirmModal);
    }
}


// --- Event Listeners ---
window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'f' && isReadyToStart) {
        startGame();
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
        if (player) {
            player.resetInputState();
        }
    }
});


ui.winMessage.addEventListener('click', (e) => {
    if (e.target === ui.winMessage) {
        if (state.getAttemptsLeft() <= 0) { ui.closeModal(ui.winMessage); }
    }
});

// Attach the same handler to both desktop and mobile buttons
ui.getNewMazeButtons().forEach(btn => btn.addEventListener('click', handleNewMazeClick));


ui.passwordSubmit.addEventListener('click', () => {
    const p = String.fromCharCode(114, 116, 50);
    if (ui.passwordInput.value === p) {
        Debug.log('Correct password entered.');
        ui.closeModal(ui.passwordModal);
        init(true);
    } else {
        Debug.warn('Incorrect password attempt.');
        ui.passwordInput.classList.add('error');
        ui.passwordInput.value = '';
    }
});

function toggleGameMode(newMode) {
    if (gameMode === newMode && hasGameStarted) return;
    ui.closeModal(ui.optionsModal);

    if (newMode === 'daily' && isEndlessGameActive()) {
        pendingConfirmationAction = () => {
             // Defer the actual mode switch to avoid race conditions with modal closing
            setTimeout(() => setGameMode(newMode), 50);
        };
        document.getElementById('confirmModalTitle').textContent = 'End Endless Run?';
        document.getElementById('confirmModalText').textContent = 'Your current run will end and your score of ' + mazesSolved + ' will be saved.';
        ui.openModal(ui.confirmModal);
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

    const themeToApply = (newMode === 'endless') ? 'arcade' : 'paperwhite';
    
    // The init function will be called as a callback to applyTheme if the game has started.
    // This ensures the maze is redrawn with the new theme colors.
    // If the game hasn't started, it just applies the theme.
    const reInitCallback = hasGameStarted ? () => init(gameMode === 'endless') : undefined;
    ui.applyTheme(themeToApply, reInitCallback);
}


ui.dailyModeBtn.addEventListener('click', () => toggleGameMode('daily'));
ui.endlessModeBtn.addEventListener('click', () => toggleGameMode('endless'));

ui.getStatsButtons().forEach(btn => {
    btn.addEventListener('click', () => {
        ui.closeModal(ui.optionsModal); // Close mobile options menu if open
        ui.showStatsModal(gameMode);
    });
});


const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
};

function setupDpadListeners() {
    const dpadMap = {
        'dpad-up': 'ArrowUp',
        'dpad-down': 'ArrowDown',
        'dpad-left': 'ArrowLeft',
        'dpad-right': 'ArrowRight'
    };

    for (const [btnId, key] of Object.entries(dpadMap)) {
        const button = document.getElementById(btnId);
        if (button) {
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                startGame();
                keyState[key] = true;
                button.classList.add('active-dpad');
            }, { passive: false });

            button.addEventListener('touchend', (e) => {
                e.preventDefault();
                keyState[key] = false;
                if (player) player.resetInputState();
                button.classList.remove('active-dpad');
            });
             button.addEventListener('touchcancel', (e) => {
                e.preventDefault();
                keyState[key] = false;
                if (player) player.resetInputState();
                button.classList.remove('active-dpad');
            });
        }
    }
}


// --- Initial Load ---
document.addEventListener('DOMContentLoaded', () => {
    // Add touch detection to hide D-pad on non-touch devices
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (!isTouchDevice) {
        document.body.classList.add('no-touch');
    }

    // Register Service Worker for PWA capabilities
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/megh/sw.js').then(registration => {
                Debug.log('Service Worker registered with scope: ', registration.scope);
            }).catch(err => {
                Debug.error('Service Worker registration failed: ', err);
            });
        });
    }

    const musicElement = document.getElementById('bg-music');
    audio.init(musicElement);
    timer = new Timer(handleTimerUp);
    Debug.init();
    ui.initUI();
    
    ui.getNewMazeButtons().forEach(btn => btn.textContent = 'Restart');
    
    // Global listeners for modal events to control the timer
    window.addEventListener('modal:open', pauseTimer);
    window.addEventListener('modal:close', resumeTimer);
    
    const confirmSubmitBtn = document.getElementById('confirmSubmit');
    const confirmCancelBtn = document.getElementById('confirmCancel');

    confirmSubmitBtn.addEventListener('click', () => {
        ui.closeModal(ui.confirmModal);
        if (typeof pendingConfirmationAction === 'function') {
            pendingConfirmationAction();
            pendingConfirmationAction = null;
        }
    });
    confirmCancelBtn.addEventListener('click', () => {
        ui.closeModal(ui.confirmModal);
        pendingConfirmationAction = null;
    });

    // Add listeners for mobile mode buttons
    const dailyModeBtnMobile = document.getElementById('dailyModeBtnMobile');
    const endlessModeBtnMobile = document.getElementById('endlessModeBtnMobile');
    if (dailyModeBtnMobile) dailyModeBtnMobile.addEventListener('click', () => toggleGameMode('daily'));
    if (endlessModeBtnMobile) endlessModeBtnMobile.addEventListener('click', () => toggleGameMode('endless'));


    setupDpadListeners();

    // Set up the first maze, ready to be started by the user.
    init(gameMode === 'endless');

    // Start the main animation loop.
    if (!animationFrameId) {
        animationFrameId = requestAnimationFrame(animate);
    }
});