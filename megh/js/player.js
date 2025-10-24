/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { log } from './debug.js';

export class Player {
    constructor(x, y, size, maze, onWin) {
        this.startX = x; // Store initial position
        this.startY = y;
        this.x = x; 
        this.y = y; // Grid position
        this.pixelX = x * maze.cellSize; // Visual position
        this.pixelY = y * maze.cellSize;
        this.size = size * 0.6;
        this.maze = maze;
        this.path = [{x, y}];
        this.deadEnds = []; // Array of path segments, e.g., [[{x,y}, {x,y}], [{x,y}, ...]]
        this.onWin = onWin;

        // Cooldown for smooth, frame-based movement
        this.moveCooldown = 0;
        this.moveInterval = 0.075; // Time in seconds between moves
        this.isHoldingMove = false; // Tracks if a move key is being held down
        this.bumpCooldown = 0;
        this.bumpInterval = 0.5; // seconds
        
        // Off-screen canvas for optimized trail rendering
        this.trailCanvas = document.createElement('canvas');
        this.trailCanvas.width = maze.cols * maze.cellSize;
        this.trailCanvas.height = maze.rows * maze.cellSize;
        this.trailCtx = this.trailCanvas.getContext('2d');
        this.redrawTrailCanvas();
    }
    move(dx, dy) {
        const currentCell = this.maze.grid[this.y][this.x];
        let newX = this.x + dx; let newY = this.y + dy;
        let moved = false;
        if (dx === 1 && !currentCell.walls.right) { this.x = newX; moved = true; }
        if (dx === -1 && !currentCell.walls.left) { this.x = newX; moved = true; }
        if (dy === 1 && !currentCell.walls.bottom) { this.y = newY; moved = true; }
        if (dy === -1 && !currentCell.walls.top) { this.y = newY; moved = true; }
        if (moved) {
            log('Player moved', { from: {x: this.x-dx, y: this.y-dy}, to: {x: this.x, y: this.y} });
            this.updatePath();
            this.checkWin();
        }
        return moved;
    }
    updateCooldown(deltaTime) {
        if (this.moveCooldown > 0) {
            this.moveCooldown -= deltaTime;
        }
        if (this.bumpCooldown > 0) {
            this.bumpCooldown -= deltaTime;
        }
    }
    resetInputState() {
        this.isHoldingMove = false;
    }
    handleContinuousMove(dx, dy) {
        if (this.moveCooldown <= 0) {
            const moved = this.move(dx, dy);
            if (moved) {
                // The first move in a sequence gets a longer cooldown to distinguish
                // a "tap" from a "hold", preventing accidental double moves.
                if (!this.isHoldingMove) {
                    this.moveCooldown = this.moveInterval * 2.5; // e.g. 187.5ms
                    this.isHoldingMove = true;
                } else {
                    this.moveCooldown = this.moveInterval; // 75ms for subsequent moves
                }
            } else {
                // Wall collision feedback
                this.moveCooldown = this.moveInterval * 1.5; // Longer cooldown for bumps
                log('Player hit a wall.');
                
                if (this.bumpCooldown <= 0) {
                    this.bumpCooldown = this.bumpInterval;
                }
            }
        }
    }
    reset() {
        log('Player reset to start.');
        this.x = this.startX;
        this.y = this.startY;
        this.pixelX = this.startX * this.maze.cellSize;
        this.pixelY = this.startY * this.maze.cellSize;
        this.path = [{x: this.startX, y: this.startY}];
        this.deadEnds = [];
        this.redrawTrailCanvas();
    }
    updatePath() {
        const newPos = { x: this.x, y: this.y };
        
        // Find if the new position is already in the current path
        const existingIndex = this.path.findIndex(p => p.x === newPos.x && p.y === newPos.y);

        if (existingIndex !== -1) {
            // If it exists, we've either backtracked or created a loop.
            // The part of the path from that existing point onwards is now a "dead end".
            const abandonedSegment = this.path.slice(existingIndex);
            
            // To make the dead end draw as a closed loop, add the start point to the end.
            if (abandonedSegment.length > 1) {
                 abandonedSegment.push(this.path[existingIndex]);
                 this.deadEnds.push(abandonedSegment);
            }
            
            // The new active path is the path up to that existing point.
            this.path.length = existingIndex + 1;
            log('Player backtracked or closed loop, path updated.', { newLength: this.path.length });
        } else {
            // This is a new, unvisited cell on the current path.
            this.path.push(newPos);
            log('Player path extended.', { newLength: this.path.length });
        }
        
        this.redrawTrailCanvas();
    }
    updateVisuals(deltaTime = 1 / 60) {
        const targetX = this.x * this.maze.cellSize;
        const targetY = this.y * this.maze.cellSize;
        // Use a frame-rate independent lerp for smooth animation
        const lerpFactor = 1 - Math.exp(-20 * deltaTime);
        this.pixelX += (targetX - this.pixelX) * lerpFactor;
        this.pixelY += (targetY - this.pixelY) * lerpFactor;
    }
    redrawTrailCanvas() {
        this.trailCtx.clearRect(0, 0, this.trailCanvas.width, this.trailCanvas.height);
        const style = getComputedStyle(document.body);
        const centerOffset = this.maze.cellSize / 2;
        const lineWidth = this.size * 0.4;
        
        // 1. Draw dead ends (dim)
        const inactiveColor = style.getPropertyValue('--trail-inactive-color').trim() || 'rgba(128, 180, 98, 0.3)';
        this.trailCtx.strokeStyle = inactiveColor;
        this.trailCtx.lineWidth = lineWidth;
        this.trailCtx.lineCap = 'round';
        this.trailCtx.lineJoin = 'round';

        this.deadEnds.forEach(segment => {
            if (segment.length < 2) return;
            this.trailCtx.beginPath();
            this.trailCtx.moveTo(segment[0].x * this.maze.cellSize + centerOffset, segment[0].y * this.maze.cellSize + centerOffset);
            for (let i = 1; i < segment.length; i++) {
                const point = segment[i];
                this.trailCtx.lineTo(point.x * this.maze.cellSize + centerOffset, point.y * this.maze.cellSize + centerOffset);
            }
            this.trailCtx.stroke();
        });

        // 2. Draw active path (bright)
        if (this.path.length < 2) return;
        const activeColor = style.getPropertyValue('--trail-color').trim() || 'rgba(128, 180, 98, 0.8)';
        this.trailCtx.strokeStyle = activeColor;
        this.trailCtx.beginPath();
        this.trailCtx.moveTo(this.path[0].x * this.maze.cellSize + centerOffset, this.path[0].y * this.maze.cellSize + centerOffset);
        for (let i = 1; i < this.path.length; i++) {
            const point = this.path[i];
            this.trailCtx.lineTo(point.x * this.maze.cellSize + centerOffset, point.y * this.maze.cellSize + centerOffset);
        }
        this.trailCtx.stroke();
    }
    draw(ctx) {
        // Draw the pre-rendered trail canvas
        ctx.drawImage(this.trailCanvas, 0, 0);

        const breathScale = 1 + Math.sin(Date.now() / 400) * 0.05;
        const currentSize = this.size * breathScale;

        const xPos = this.pixelX + (this.maze.cellSize - currentSize) / 2;
        const yPos = this.pixelY + (this.maze.cellSize - currentSize) / 2;

        const style = getComputedStyle(document.body);
        const playerColor = style.getPropertyValue('--player-color').trim() || '#d9374b';

        ctx.fillStyle = playerColor; 
        ctx.beginPath(); 
        ctx.arc(xPos + currentSize/2, yPos + currentSize/2, currentSize/2, 0, Math.PI * 2); 
        ctx.fill();
    }
    checkWin() {
        if (this.x === this.maze.endX && this.y === this.maze.endY) {
            log('Win condition met.');
            this.onWin();
        }
    }
}