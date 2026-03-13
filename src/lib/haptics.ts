// Haptic feedback utility utilizing navigator.vibrate
// This provides physical feedback for actions, enhancing the UX (Android/PC primarily, iOS web lacks support)

import { useAppStore } from '../store/useAppStore';

export const haptics = {
    // Basic vibration method
    vibrate(pattern: number | number[]) {
        if (!useAppStore.getState().hapticEnabled) return;
        if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
            try {
                navigator.vibrate(pattern);
            } catch {
                // Ignore, as some browsers completely block it or throw
            }
        }
    },

    // Light tick for slider changes, short countdown marks
    tick() {
        this.vibrate(10);
    },

    // Slightly stronger pulse for button clicks or phase changes
    pulse() {
        this.vibrate(20);
    },

    // Success pattern for completing a session
    success() {
        this.vibrate([30, 50, 30, 50, 60]);
    },

    // Warning/Error (e.g. invalid action)
    warning() {
        this.vibrate([50, 100, 50]);
    },
};
