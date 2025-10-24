/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { log, startPerf, endPerf } from './debug.js';

class Cell {
    constructor(x, y, size) {
        this.x = x; this.y = y; this.size = size;
        this.walls = { top: true, right: true, bottom: true, left: true };
        this.visited = false;
    }
    draw(ctx) {
        const xPos = this.x * this.size; 
        const yPos = this.y * this.size;
        const style = getComputedStyle(document.body);
        const wallColor = style.getPropertyValue('--wall-color').trim() || '#3a2a1a';

        ctx.strokeStyle = wallColor; 
        ctx.lineWidth = 5;
        ctx.lineCap = 'square'; // Fix for corner gaps
        ctx.beginPath();
        if (this.walls.top) { ctx.moveTo(xPos, yPos); ctx.lineTo(xPos + this.size, yPos); }
        if (this.walls.right) { ctx.moveTo(xPos + this.size, yPos); ctx.lineTo(xPos + this.size, yPos + this.size); }
        if (this.walls.bottom) { ctx.moveTo(xPos + this.size, yPos + this.size); ctx.lineTo(xPos, yPos + this.size); }
        if (this.walls.left) { ctx.moveTo(xPos, yPos + this.size); ctx.lineTo(xPos, yPos); }
        ctx.stroke();
    }
}

export class Maze {
    constructor(cols, rows, cellSize, randomGen, options = {}, gameMode = 'daily', mazesSolved = 0) {
        this.cols = cols; 
        this.rows = rows; 
        this.cellSize = cellSize;
        this.randomGen = randomGen;
        this.startX = options.startX ?? 0;
        this.startY = options.startY ?? 0;
        this.endX = options.endX ?? cols - 1;
        this.endY = options.endY ?? rows - 1;
        this.gameMode = gameMode;
        this.mazesSolved = mazesSolved;
        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCtx = this.offscreenCanvas.getContext('2d');
        this.grid = this.createGrid();
        this.stack = [];

        // Animation state
        this.isAnimating = false;
        this.animationStartTime = 0;
        this.animationDuration = 500; // ms

        // Randomly choose a generation algorithm for variety
        if (this.randomGen.random() > 0.5) {
            log('Generating maze with Prim\'s Algorithm');
            this.generateWithPrims();
        } else {
            log('Generating maze with Recursive Backtracking (DFS)');
            this.generateWithDFS();
        }
    }
    createGrid() {
        const grid = [];
        for (let y = 0; y < this.rows; y++) {
            const row = [];
            for (let x = 0; x < this.cols; x++) { row.push(new Cell(x, y, this.cellSize)); }
            grid.push(row);
        }
        return grid;
    }
    generateWithDFS() {
        startPerf('mazeGeneration (DFS)');
        if (!this.grid || this.grid.length === 0 || this.grid[0].length === 0) return;
        let current = this.grid[this.startY][this.startX];
        current.visited = true;
        this.stack.push(current);
        while (this.stack.length > 0) {
            current = this.stack.pop();
            const neighbors = this.getUnvisitedNeighbors(current);
            if (neighbors.length > 0) {
                this.stack.push(current);
                // Shuffle neighbors to ensure randomness
                for (let i = neighbors.length - 1; i > 0; i--) {
                    const j = Math.floor(this.randomGen.random() * (i + 1));
                    [neighbors[i], neighbors[j]] = [neighbors[j], neighbors[i]];
                }
                const chosen = neighbors[0];
                this.removeWalls(current, chosen);
                chosen.visited = true;
                this.stack.push(chosen);
            }
        }
        this.addLoops();
        endPerf('mazeGeneration (DFS)');
        log('Maze generation complete (DFS)');
    }
    generateWithPrims() {
        startPerf('mazeGeneration (Prim)');
        if (!this.grid || this.grid.length === 0 || this.grid[0].length === 0) return;

        const startCell = this.grid[this.startY][this.startX];
        startCell.visited = true;
    
        const frontier = [];
        // Add neighbors of start cell to the frontier
        const { x, y } = startCell;
        if (y > 0) frontier.push({ cell: this.grid[y - 1][x], from: startCell });
        if (x < this.cols - 1) frontier.push({ cell: this.grid[y][x + 1], from: startCell });
        if (y < this.rows - 1) frontier.push({ cell: this.grid[y + 1][x], from: startCell });
        if (x > 0) frontier.push({ cell: this.grid[y][x - 1], from: startCell });
    
        while (frontier.length > 0) {
            const randIndex = Math.floor(this.randomGen.random() * frontier.length);
            const { cell: current, from: fromCell } = frontier.splice(randIndex, 1)[0];
    
            if (current.visited) continue;
    
            this.removeWalls(fromCell, current);
            current.visited = true;
            
            // Add its unvisited neighbors to the frontier
            const { x: curX, y: curY } = current;
            const neighbors = [];
            if (curY > 0) neighbors.push(this.grid[curY - 1][curX]);
            if (curX < this.cols - 1) neighbors.push(this.grid[curY][curX + 1]);
            if (curY < this.rows - 1) neighbors.push(this.grid[curY + 1][curX]);
            if (curX > 0) neighbors.push(this.grid[curY][curX - 1]);
    
            for (const neighbor of neighbors) {
                if (!neighbor.visited) {
                    frontier.push({ cell: neighbor, from: current });
                }
            }
        }
        
        this.addLoops();
        endPerf('mazeGeneration (Prim)');
        log('Maze generation complete (Prim)');
    }
    addLoops() {
        let loops;
        if (this.gameMode === 'endless') {
            const maxComplexityLevel = 10; // Cap complexity scaling after 10 solved mazes
            const cappedMazesSolved = Math.min(this.mazesSolved, maxComplexityLevel);
            // Reduce loops as difficulty increases to create fewer shortcuts
            const loopDivisor = 15 + cappedMazesSolved;
            loops = Math.floor((this.cols * this.rows) / loopDivisor);
        } else {
            // Default for daily
            loops = Math.floor((this.cols * this.rows) / 15);
        }
        
        for (let i = 0; i < loops; i++) {
            const x = Math.floor(this.randomGen.random() * this.cols);
            const y = Math.floor(this.randomGen.random() * this.rows);
            const cell = this.grid[y][x];
            const neighborsWithWalls = [];
            if (cell.walls.top && y > 0) neighborsWithWalls.push(this.grid[y - 1][x]);
            if (cell.walls.right && x < this.cols - 1) neighborsWithWalls.push(this.grid[y][x + 1]);
            if (cell.walls.bottom && y < this.rows - 1) neighborsWithWalls.push(this.grid[y + 1][x]);
            if (cell.walls.left && x > 0) neighborsWithWalls.push(this.grid[y][x - 1]);
            if (neighborsWithWalls.length > 0) {
                const neighbor = neighborsWithWalls[Math.floor(this.randomGen.random() * neighborsWithWalls.length)];
                this.removeWalls(cell, neighbor);
            }
        }
    }
    getUnvisitedNeighbors(cell) {
        const neighbors = [];
        const { x, y } = cell;
        const grid = this.grid;
        if (y > 0 && !grid[y - 1][x].visited) neighbors.push(grid[y - 1][x]);
        if (x < this.cols - 1 && !grid[y][x + 1].visited) neighbors.push(grid[y][x + 1]);
        if (y < this.rows - 1 && !grid[y + 1][x].visited) neighbors.push(grid[y + 1][x]);
        if (x > 0 && !grid[y][x - 1].visited) neighbors.push(grid[y][x - 1]);
        return neighbors;
    }
    removeWalls(a, b) {
        const dx = a.x - b.x; const dy = a.y - b.y;
        if (dx === 1) { a.walls.left = false; b.walls.right = false; }
        else if (dx === -1) { a.walls.right = false; b.walls.left = false; }
        if (dy === 1) { a.walls.top = false; b.walls.bottom = false; }
        else if (dy === -1) { a.walls.bottom = false; b.walls.top = false; }
    }
    preRender() {
        startPerf('mazePreRender');
        this.offscreenCanvas.width = this.cols * this.cellSize;
        this.offscreenCanvas.height = this.rows * this.cellSize;
        this.grid.forEach(row => row.forEach(cell => cell.draw(this.offscreenCtx)));
        endPerf('mazePreRender');
    }
    startAnimation() {
        this.isAnimating = true;
        this.animationStartTime = 0; // Reset, will be set on the first animation frame
    }
    drawAnimated(ctx, currentTime) {
        if (!this.isAnimating) {
            ctx.drawImage(this.offscreenCanvas, 0, 0);
            return;
        }
        if (this.animationStartTime === 0) {
            this.animationStartTime = currentTime;
        }

        const elapsed = currentTime - this.animationStartTime;
        const progress = Math.min(elapsed / this.animationDuration, 1);

        ctx.globalAlpha = progress;
        ctx.drawImage(this.offscreenCanvas, 0, 0);
        ctx.globalAlpha = 1.0; // Reset alpha for other drawing operations

        if (progress >= 1) {
            this.isAnimating = false;
        }
    }
    drawGoal(ctx) {
        if (!ctx) return;
        const endCell = this.grid[this.endY][this.endX];
        
        const style = getComputedStyle(document.body);
        const goalColor = style.getPropertyValue('--goal-color').trim() || '#c89c3c';
        
        // Pulsing animation logic
        const pulseFactor = 0.15;
        const pulseSpeed = 400; // ms per cycle
        const breath = (Math.sin(Date.now() / pulseSpeed) + 1) / 2; // Varies from 0 to 1
        const sizePulse = breath * pulseFactor;
        const glowPulse = breath * 15;

        const baseSize = this.cellSize / 2;
        const currentSize = baseSize + baseSize * sizePulse;
        const offset = (this.cellSize - currentSize) / 2;
        
        ctx.save();
        ctx.shadowColor = goalColor;
        ctx.shadowBlur = 5 + glowPulse;
        ctx.fillStyle = goalColor; 
        ctx.fillRect(
            endCell.x * this.cellSize + offset, 
            endCell.y * this.cellSize + offset, 
            currentSize, 
            currentSize
        );
        ctx.restore();
    }
}