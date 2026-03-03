interface AuraVisualState {
    auraColor: string;
    pulseDuration: number;
    showFireflies: boolean;
}

export function getAuraVisualState(activeDays: number): AuraVisualState {
    if (activeDays >= 5) {
        return {
            auraColor: 'rgba(255, 215, 0, 0.35)',
            pulseDuration: 2,
            showFireflies: true,
        };
    }

    if (activeDays >= 2) {
        return {
            auraColor: 'rgba(255, 154, 158, 0.25)',
            pulseDuration: 3,
            showFireflies: false,
        };
    }

    return {
        auraColor: 'rgba(43,186,160,0.15)',
        pulseDuration: 4,
        showFireflies: false,
    };
}
