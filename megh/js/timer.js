/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import * as ui from './ui.js';
import * as audio from './audio.js';
import { log } from './debug.js';

export class Timer {
    constructor(onTimeUpCallback) {
        this.intervalId = null;
        this.remainingTime = 0;
        this.isRunning = false;
        this.lastTickTime = 0;
        this.onTimeUp = onTimeUpCallback;
    }

    start() {
        if (this.isRunning || this.remainingTime <= 0) return;
        log('Timer started.');
        this.isRunning = true;
        this.lastTickTime = Date.now();

        this.intervalId = setInterval(() => {
            const now = Date.now();
            const delta = now - this.lastTickTime;
            this.lastTickTime = now;
            this.remainingTime -= delta;

            if (this.remainingTime < 0) this.remainingTime = 0;

            this.updateVisuals();

            // Check if time is up *after* updating visuals and time value
            if (this.remainingTime <= 0) {
                ui.updateTimer(this.remainingTime); // Final update to show 00:00.0
                this.stop(); // Stop first to prevent race conditions
                if (typeof this.onTimeUp === 'function') {
                    this.onTimeUp();
                }
            } else {
                ui.updateTimer(this.remainingTime);
            }
        }, 100);
    }

    stop() {
        if (this.intervalId) {
            log('Timer stopped.');
            clearInterval(this.intervalId);
        }
        this.intervalId = null;
        this.isRunning = false;
        document.body.classList.remove('low-time-warning');
    }

    pause() {
        if (this.isRunning) {
            log('Timer paused.');
            this.stop();
        }
    }

    resume() {
        if (!this.isRunning && this.remainingTime > 0) {
            log('Timer resumed.');
            this.start();
        }
    }

    setTime(ms) {
        log(`Timer time set to ${ms}ms.`);
        this.stop(); // Ensure any existing timer is stopped before setting new time
        this.remainingTime = ms;
        ui.updateTimer(this.remainingTime);
        this.updateVisuals(); // Also update visuals when setting time
    }

    getTime() {
        return this.remainingTime;
    }
    
    getIsRunning() {
        return this.isRunning;
    }

    updateVisuals() {
        const bodyEl = document.body;

        if (this.remainingTime <= 30000 && this.remainingTime > 0) {
            bodyEl.classList.add('low-time-warning');
        } else {
            bodyEl.classList.remove('low-time-warning');
        }
    }
}
