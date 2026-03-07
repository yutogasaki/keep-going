import { describe, expect, it } from 'vitest';
import { getSpeechVolume } from '../audio';

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
