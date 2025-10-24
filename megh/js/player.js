/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { log } from './debug.js';

export class Player {
    constructor(x, y, size, maze, onWin) {
        this.startX = x;
        this.startY = y;
        this.x = x; 
        this.y = y;
        this.pixelX = x * maze.cellSize;
        this.pixelY = y * maze.cellSize;
        this.size = size * 0.6;
        this.maze = maze;
        this.path = [{x, y}];
        this.deadEnds = [];
        this.onWin = onWin;

        this.moveCooldown = 0;
        this.moveInterval = 0.075;
        this.isHoldingMove = false;
        
        // Animation properties for "juice"
        this.scale = { x: 1, y: 1 };
        this.targetScale = { x: 1, y: 1 };
        
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
            
            // Set target scale for squash/stretch effect
            if (dx !== 0) { // horizontal move
                this.targetScale.x = 1.3; this.targetScale.y = 0.7;
            } else { // vertical move
                this.targetScale.x = 0.7; this.targetScale.y = 1.3;
            }

        } else {
            // Bump effect
            if (dx !== 0) { // horizontal bump
                this.targetScale.x = 0.85; this.targetScale.y = 1.15;
            } else { // vertical bump
                this.targetScale.x = 1.15; this.targetScale.y = 0.85;
            }
        }
        return moved;
    }
    updateCooldown(deltaTime) {
        if (this.moveCooldown > 0) {
            this.moveCooldown -= deltaTime;
        }
    }
    resetInputState() {
        this.isHoldingMove = false;
    }
    setMoveCooldown(isWallBump) {
        if (isWallBump) {
             this.moveCooldown = this.moveInterval * 1.5;
        } else if (!this.isHoldingMove) {
            this.moveCooldown = this.moveInterval * 2.5; // First move gets a longer cooldown
            this.isHoldingMove = true;
        } else {
            this.moveCooldown = this.moveInterval;
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
        const existingIndex = this.path.findIndex(p => p.x === newPos.x && p.y === newPos.y);
        if (existingIndex !== -1) {
            const abandonedSegment = this.path.slice(existingIndex);
            if (abandonedSegment.length > 1) {
                 abandonedSegment.push(this.path[existingIndex]);
                 this.deadEnds.push(abandonedSegment);
            }
            this.path.length = existingIndex + 1;
        } else {
            this.path.push(newPos);
        }
        this.redrawTrailCanvas();
    }
    updateVisuals(deltaTime = 1 / 60) {
        const targetX = this.x * this.maze.cellSize;
        const targetY = this.y * this.maze.cellSize;
        const posLerpFactor = 1 - Math.exp(-20 * deltaTime);
        this.pixelX += (targetX - this.pixelX) * posLerpFactor;
        this.pixelY += (targetY - this.pixelY) * posLerpFactor;

        // Smoothly animate scale back to normal or to idle "breathing"
        const isIdle = Math.abs(targetX - this.pixelX) < 0.1 && Math.abs(targetY - this.pixelY) < 0.1;
        
        let finalTargetX, finalTargetY;
        if (isIdle) {
            const breath = 1 + Math.sin(Date.now() / 350) * 0.05;
            finalTargetX = breath;
            finalTargetY = breath;
        } else {
            finalTargetX = 1;
            finalTargetY = 1;
        }

        const scaleLerpFactor = 1 - Math.exp(-15 * deltaTime);
        this.scale.x += (this.targetScale.x - this.scale.x) * scaleLerpFactor;
        this.scale.y += (this.targetScale.y - this.scale.y) * scaleLerpFactor;
        
        // Reset the "one-shot" target scale towards the final target
        this.targetScale.x += (finalTargetX - this.targetScale.x) * scaleLerpFactor;
        this.targetScale.y += (finalTargetY - this.targetScale.y) * scaleLerpFactor;
    }
    redrawTrailCanvas() {
        this.trailCtx.clearRect(0, 0, this.trailCanvas.width, this.trailCanvas.height);
        const style = getComputedStyle(document.body);
        const centerOffset = this.maze.cellSize / 2;
        const lineWidth = this.size * 0.4;
        
        // Draw dead ends
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
                this.trailCtx.lineTo(segment[i].x * this.maze.cellSize + centerOffset, segment[i].y * this.maze.cellSize + centerOffset);
            }
            this.trailCtx.stroke();
        });

        // Draw active path
        if (this.path.length < 2) return;
        const activeColor = style.getPropertyValue('--trail-color').trim() || 'rgba(128, 180, 98, 0.8)';
        this.trailCtx.strokeStyle = activeColor;
        this.trailCtx.beginPath();
        this.trailCtx.moveTo(this.path[0].x * this.maze.cellSize + centerOffset, this.path[0].y * this.maze.cellSize + centerOffset);
        for (let i = 1; i < this.path.length; i++) {
            this.trailCtx.lineTo(this.path[i].x * this.maze.cellSize + centerOffset, this.path[i].y * this.maze.cellSize + centerOffset);
        }
        this.trailCtx.stroke();
    }
    draw(ctx) {
        ctx.drawImage(this.trailCanvas, 0, 0);

        const currentSize = this.size; // Base size, scaling is handled by transform
        const xPos = this.pixelX + (this.maze.cellSize - currentSize) / 2;
        const yPos = this.pixelY + (this.maze.cellSize - currentSize) / 2;

        const style = getComputedStyle(document.body);
        const playerColor = style.getPropertyValue('--player-color').trim() || '#d9374b';

        ctx.save();
        // Translate to center of player for scaling, then apply scale, then translate back
        ctx.translate(xPos + currentSize / 2, yPos + currentSize / 2);
        ctx.scale(this.scale.x, this.scale.y);
        ctx.translate(-(xPos + currentSize / 2), -(yPos + currentSize / 2));
        
        ctx.fillStyle = playerColor; 
        ctx.beginPath(); 
        ctx.arc(xPos + currentSize/2, yPos + currentSize/2, currentSize/2, 0, Math.PI * 2); 
        ctx.fill();
        ctx.restore();
    }
    checkWin() {
        if (this.x === this.maze.endX && this.y === this.maze.endY) {
            log('Win condition met.');
            this.onWin();
        }
    }
}