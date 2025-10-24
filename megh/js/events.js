/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { log, error } from './debug.js';

class EventBus {
    constructor() {
        this.eventListeners = {};
    }

    /**
     * Subscribes a callback to an event.
     * @param {string} eventName The name of the event.
     * @param {Function} callback The function to call when the event is published.
     */
    subscribe(eventName, callback) {
        if (!this.eventListeners[eventName]) {
            this.eventListeners[eventName] = [];
        }
        this.eventListeners[eventName].push(callback);
        log(`[EventBus] Subscribed to "${eventName}"`);
    }

    /**
     * Unsubscribes a callback from an event.
     * @param {string} eventName The name of the event.
     * @param {Function} callback The callback function to remove.
     */
    unsubscribe(eventName, callback) {
        if (this.eventListeners[eventName]) {
            this.eventListeners[eventName] = this.eventListeners[eventName].filter(
                listener => listener !== callback
            );
            log(`[EventBus] Unsubscribed from "${eventName}"`);
        }
    }

    /**
     * Publishes an event, calling all subscribed callbacks.
     * @param {string} eventName The name of the event to publish.
     * @param {*} data The data to pass to the callbacks.
     */
    publish(eventName, data) {
        if (this.eventListeners[eventName]) {
            log(`[EventBus] Publishing "${eventName}"`, data);
            this.eventListeners[eventName].forEach(callback => {
                try {
                    callback(data);
                } catch (e) {
                    error(`[EventBus] Error in callback for event "${eventName}":`, e);
                }
            });
        }
    }
}

// Export a single instance to be used throughout the application
export const events = new EventBus();