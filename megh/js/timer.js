/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import * as ui from './ui.js';
import { log } from './debug.js';

export class Timer {
    constructor(onTimeUpCallback) {
        this.remainingTime = 0;
        this.isRunning = false;
        this.onTimeUp = onTimeUpCallback;
        this.lastUpdateTime = 0;
    }

    /**
     * Updates the timer's state. Should be called every frame from the main game loop.
     * @param {number} deltaTime - The time elapsed since the last frame, in seconds.
     */
    update(deltaTime) {
        if (!this.isRunning || this.remainingTime <= 0) {
            return;
        }

        this.remainingTime -= deltaTime * 1000; // deltaTime is in seconds

        // Throttle UI updates to avoid excessive DOM manipulation
        const now = Date.now();
        if (now - this.lastUpdateTime > 100) {
            ui.updateTimer(this.remainingTime);
            this.lastUpdateTime = now;
        }

        if (this.remainingTime <= 0) {
            this.remainingTime = 0;
            ui.updateTimer(this.remainingTime); // Final update to show 00:00.0
            this.stop(); // Stop first to prevent race conditions
            if (typeof this.onTimeUp === 'function') {
                this.onTimeUp();
            }
        }
    }

    start() {
        if (this.isRunning || this.remainingTime <= 0) return;
        log('Timer started.');
        this.isRunning = true;
        this.lastUpdateTime = Date.now();
    }

    stop() {
        log('Timer stopped.');
        this.isRunning = false;
    }

    pause() {
        if (this.isRunning) {
            log('Timer paused.');
            this.isRunning = false;
        }
    }

    resume() {
        if (!this.isRunning && this.remainingTime > 0) {
            log('Timer resumed.');
            this.isRunning = true;
            this.lastUpdateTime = Date.now();
        }
    }

    setTime(ms) {
        log(`Timer time set to ${ms}ms.`);
        this.isRunning = false; // Ensure timer is not running when time is set
        this.remainingTime = ms;
        ui.updateTimer(this.remainingTime);
    }

    getTime() {
        return this.remainingTime;
    }
    
    getIsRunning() {
        return this.isRunning;
    }
}