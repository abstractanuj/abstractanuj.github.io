/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { formatTime } from './ui.js';
import { log, warn } from './debug.js';

let attemptsLeft, bestScore, bestPath, bestTime, optimalPath, optimalPathLength;

// --- Onboarding State ---
const VISITED_KEY = 'megh_has_visited';

export function isFirstVisit() {
    return localStorage.getItem(VISITED_KEY) === null;
}

export function setVisited() {
    localStorage.setItem(VISITED_KEY, 'true');
}

// --- Seeded Random Number Generator for Daily Mazes ---
export class SeededRandom {
    constructor(seed) { this.seed = seed; }
    random() {
        var x = Math.sin(this.seed++) * 10000;
        return x - Math.floor(x);
    }
}

export function getAttemptsLeft() { return attemptsLeft; }
export function getBestScore() { return bestScore; }
export function decrementAttempts() { if(attemptsLeft > 0) attemptsLeft--; }

export function setOptimalPath(path, length) {
    optimalPath = path;
    optimalPathLength = length;
}

export function loadGameState(dailySeed) {
    const savedStateJSON = localStorage.getItem('meghMazeState');
    if (savedStateJSON) {
        try {
            const savedState = JSON.parse(savedStateJSON);
            if (savedState && savedState.seed === dailySeed) {
                attemptsLeft = savedState.attemptsLeft;
                bestScore = savedState.bestScore === null ? Infinity : savedState.bestScore;
                bestPath = savedState.bestPath;
                bestTime = savedState.bestTime === null ? Infinity : savedState.bestTime;
                log('Loaded game state from storage.', { savedState });
                return;
            }
        } catch(e) {
            warn('Failed to parse saved state from localStorage.', e);
        }
    }
    
    log('No saved state found for today, initializing new daily state.');
    attemptsLeft = 3;
    bestScore = Infinity;
    bestPath = [];
    bestTime = Infinity;
    saveGameState(dailySeed);
}

export function saveGameState(dailySeed) {
    const state = { seed: dailySeed, attemptsLeft, bestScore, bestPath, bestTime };
    localStorage.setItem('meghMazeState', JSON.stringify(state));
    log('Game state saved.', { state });
}

export function updateDailyState(currentScore, currentTime, currentPath) {
    if (currentScore < bestScore) { 
        log('New best score for today.', { old: bestScore, new: currentScore });
        bestScore = currentScore; 
        bestPath = [...currentPath]; 
    }
    if (currentTime < bestTime) { 
        log('New best time for today.', { old: bestTime, new: currentTime });
        bestTime = currentTime; 
    }
}

// --- Stats Functions ---
function loadStats(mode) {
    const statsJSON = localStorage.getItem(`meghStats-${mode}`);
    try {
        return statsJSON ? JSON.parse(statsJSON) : {
            currentStreak: 0,
            maxStreak: 0,
            puzzlesSolved: 0,
            totalTime: 0,
            recentTimes: []
        };
    } catch(e) {
        warn(`Failed to parse stats for mode: ${mode}`, e);
        return { currentStreak: 0, maxStreak: 0, puzzlesSolved: 0, totalTime: 0, recentTimes: [] };
    }
}
function saveStats(stats, mode) {
    localStorage.setItem(`meghStats-${mode}`, JSON.stringify(stats));
}
export function updateStats(value, isOptimal, mode) {
    const stats = loadStats(mode);
    stats.puzzlesSolved++;
    if (mode === 'daily') {
        stats.totalTime += value; // value is time
        stats.recentTimes.push(value);
        if (stats.recentTimes.length > 5) stats.recentTimes.shift();

        if (isOptimal) {
            stats.currentStreak++;
            if (stats.currentStreak > stats.maxStreak) {
                stats.maxStreak = stats.currentStreak;
            }
        } else {
            stats.currentStreak = 0;
        }
    } else { // endless
        if (value > stats.maxStreak) { // Use maxStreak to store high score for endless
            stats.maxStreak = value;
        }
    }
    log('Updating stats.', { mode, newStats: stats });
    saveStats(stats, mode);
}

export function getStats(mode) {
    return loadStats(mode);
}

// --- Pathfinding & Sharing Logic ---
export function findPath(maze, startCell, endCell) {
    const queue = [[startCell]];
    const visited = new Set([`${startCell.x}-${startCell.y}`]);
    while (queue.length > 0) {
        const path = queue.shift();
        const cell = path[path.length - 1];
        if (cell === endCell) return path;
        const { x, y } = cell;
        const neighbors = [];
        if (!cell.walls.top && y > 0) neighbors.push(maze.grid[y - 1][x]);
        if (!cell.walls.right && x < maze.cols - 1) neighbors.push(maze.grid[y][x + 1]);
        if (!cell.walls.bottom && y < maze.rows - 1) neighbors.push(maze.grid[y + 1][x]);
        if (!cell.walls.left && x > 0) neighbors.push(maze.grid[y][x - 1]);
        for (const neighbor of neighbors) {
            if (!visited.has(`${neighbor.x}-${neighbor.y}`)) {
                visited.add(`${neighbor.x}-${neighbor.y}`);
                const newPath = [...path, neighbor];
                queue.push(newPath);
            }
        }
    }
    return null;
}

export function drawOptimalPath(ctx, playerSize, cellSize, progress = 1) {
    if (!optimalPath || optimalPath.length < 2) return;

    const totalSegments = optimalPath.length - 1;
    if (totalSegments <= 0) return;

    const segmentsToDraw = totalSegments * progress;
    const lastFullSegmentIndex = Math.floor(segmentsToDraw);
    const partialSegmentProgress = segmentsToDraw - lastFullSegmentIndex;

    ctx.beginPath();
    ctx.strokeStyle = 'rgba(245, 101, 101, 0.8)';
    ctx.lineWidth = playerSize * 0.6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const centerOffset = cellSize / 2;
    ctx.moveTo(optimalPath[0].x * cellSize + centerOffset, optimalPath[0].y * cellSize + centerOffset);
    
    // Draw full segments
    for (let i = 1; i <= lastFullSegmentIndex; i++) {
        ctx.lineTo(optimalPath[i].x * cellSize + centerOffset, optimalPath[i].y * cellSize + centerOffset);
    }
    
    // Draw partial segment if animation is in progress
    if (progress < 1 && lastFullSegmentIndex < optimalPath.length - 1) {
        const p1 = optimalPath[lastFullSegmentIndex];
        const p2 = optimalPath[lastFullSegmentIndex + 1];

        const p1X = p1.x * cellSize + centerOffset;
        const p1Y = p1.y * cellSize + centerOffset;
        const p2X = p2.x * cellSize + centerOffset;
        const p2Y = p2.y * cellSize + centerOffset;

        // Linear interpolation for the partial segment
        const interpX = p1X + (p2X - p1X) * partialSegmentProgress;
        const interpY = p1Y + (p2Y - p1Y) * partialSegmentProgress;
        
        ctx.lineTo(interpX, interpY);
    }
    
    ctx.stroke();
}

export function generateShareText(maze, optimalPathLength, dailySeed) {
    const date = new Date(new Date().setHours(0,0,0,0)); // Use consistent date for the seed
    const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    let shareString = `mēgh ${dateString}\n`;

    if (bestScore === optimalPathLength) {
         shareString += `🏆 Optimal Path! ${bestScore}/${optimalPathLength} in ${formatTime(bestTime)}\n`;
    } else if (bestScore === Infinity) {
        shareString += `Path not completed. Optimal: ${optimalPathLength} steps.\n`;
    } else {
         shareString += `My Best: ${bestScore} steps (Optimal: ${optimalPathLength}) in ${formatTime(bestTime)}\n`;
    }
    return shareString;
}