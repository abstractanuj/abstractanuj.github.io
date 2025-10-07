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
        this.startTime = 0;
        this.elapsedTime = 0;
        this.isRunning = false;
        this.onTimeUp = onTimeUpCallback;
    }

    start() {
        if (this.isRunning || this.elapsedTime <= 0) return;
        log('Timer started.');
        this.isRunning = true;
        this.startTime = Date.now() + this.elapsedTime;

        this.intervalId = setInterval(() => {
            this.elapsedTime = this.startTime - Date.now();
            
            // Clamp value to prevent small negative numbers from floating point issues
            if (this.elapsedTime < 0) this.elapsedTime = 0;

            this.updateVisuals();

            if (this.elapsedTime <= 0) {
                this.stop(); // Stop first to prevent race conditions
                if (typeof this.onTimeUp === 'function') {
                    this.onTimeUp();
                }
            }
            ui.updateTimer(this.elapsedTime);
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
        if (!this.isRunning && this.elapsedTime > 0) {
            log('Timer resumed.');
            this.start();
        }
    }

    setTime(ms) {
        log(`Timer time set to ${ms}ms.`);
        this.stop(); // Ensure any existing timer is stopped before setting new time
        this.elapsedTime = ms;
        ui.updateTimer(this.elapsedTime);
    }

    getTime() {
        return this.elapsedTime;
    }
    
    getIsRunning() {
        return this.isRunning;
    }

    updateVisuals() {
        const bodyEl = document.body;

        if (this.elapsedTime <= 30000 && this.elapsedTime > 0) {
            bodyEl.classList.add('low-time-warning');
        } else {
            bodyEl.classList.remove('low-time-warning');
        }
    }
}