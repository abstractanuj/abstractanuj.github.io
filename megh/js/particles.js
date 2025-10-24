/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
let particles = [];
let particleCtx;
let particleCanvas;

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 1;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.size = Math.random() * 4 + 2;
        this.life = Math.random() * 50 + 50; // frames
        this.initialLife = this.life;
        this.color = color;
    }

    update() {
        this.life--;
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.05; // gravity
        this.size *= 0.98;
    }

    draw() {
        if (!particleCtx) return;
        particleCtx.globalAlpha = this.life / this.initialLife;
        particleCtx.fillStyle = this.color;
        particleCtx.beginPath();
        particleCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        particleCtx.fill();
        particleCtx.globalAlpha = 1;
    }
}

export function initParticles() {
    particleCanvas = document.getElementById('particleCanvas');
    if (particleCanvas) {
        particleCtx = particleCanvas.getContext('2d');
        // Match particle canvas size to maze canvas size
        const mazeCanvas = document.getElementById('mazeCanvas');
        if (mazeCanvas) {
            particleCanvas.width = mazeCanvas.width;
            particleCanvas.height = mazeCanvas.height;
        }
    }
}

export function resizeParticleCanvas(width, height) {
    if (particleCanvas) {
        particleCanvas.width = width;
        particleCanvas.height = height;
    }
}

export function createWinExplosion(x, y, cellSize) {
    const style = getComputedStyle(document.body);
    const color1 = style.getPropertyValue('--goal-color').trim() || '#10B981';
    const color2 = style.getPropertyValue('--player-color').trim() || '#3B82F6';
    const numParticles = 100;
    const centerX = x * cellSize + cellSize / 2;
    const centerY = y * cellSize + cellSize / 2;
    for (let i = 0; i < numParticles; i++) {
        const color = Math.random() > 0.5 ? color1 : color2;
        particles.push(new Particle(centerX, centerY, color));
    }
}

export function updateAndDrawParticles() {
    if (!particleCtx || !particleCanvas) return;
    particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw();
        if (p.life <= 0 || p.size <= 0.2) {
            particles.splice(i, 1);
        }
    }
}
