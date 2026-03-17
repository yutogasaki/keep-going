import { describe, expect, it } from 'vitest';
import { getBgmDuckMultiplier, getBgmMixVolume, getEffectsVolume, getSpeechVolume } from '../audio';

describe('getSpeechVolume', () => {
    it('returns 0 when sound volume is 0', () => {
        expect(getSpeechVolume(0)).toBe(0);
    });

    it('keeps speech volume responsive across the slider range', () => {
        expect(getSpeechVolume(0.1)).toBeCloseTo(0.28);
        expect(getSpeechVolume(0.5)).toBeCloseTo(0.6);
        expect(getSpeechVolume(1)).toBe(1);
    });

    it('clamps values outside the supported range', () => {
        expect(getSpeechVolume(-1)).toBe(0);
        expect(getSpeechVolume(2)).toBe(1);
    });
});

describe('getEffectsVolume', () => {
    it('returns 0 when sound volume is 0', () => {
        expect(getEffectsVolume(0)).toBe(0);
    });

    it('keeps small effect sounds audible across the slider range', () => {
        expect(getEffectsVolume(0.1)).toBeCloseTo(0.352);
        expect(getEffectsVolume(0.5)).toBeCloseTo(0.64);
        expect(getEffectsVolume(1)).toBe(1);
    });

    it('clamps values outside the supported range', () => {
        expect(getEffectsVolume(-1)).toBe(0);
        expect(getEffectsVolume(2)).toBe(1);
    });
});

describe('getBgmMixVolume', () => {
    it('keeps the BGM mix quieter than the raw slider value', () => {
        expect(getBgmMixVolume(0)).toBe(0);
        expect(getBgmMixVolume(0.3)).toBeCloseTo(0.0393, 3);
        expect(getBgmMixVolume(0.5)).toBeCloseTo(0.0822, 3);
        expect(getBgmMixVolume(1)).toBeCloseTo(0.225);
    });

    it('clamps values outside the supported range', () => {
        expect(getBgmMixVolume(-1)).toBe(0);
        expect(getBgmMixVolume(2)).toBeCloseTo(0.225);
    });
});

describe('getBgmDuckMultiplier', () => {
    it('keeps BGM at full volume when nothing else is active', () => {
        expect(getBgmDuckMultiplier({ speechActive: false, effectActive: false })).toBe(1);
    });

    it('ducks BGM more strongly for speech than short effects', () => {
        expect(getBgmDuckMultiplier({ speechActive: false, effectActive: true })).toBe(0.22);
        expect(getBgmDuckMultiplier({ speechActive: true, effectActive: false })).toBe(0.08);
    });

    it('keeps the stronger ducking when speech and effects overlap', () => {
        expect(getBgmDuckMultiplier({ speechActive: true, effectActive: true })).toBe(0.08);
    });
});
