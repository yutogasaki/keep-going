import { describe, expect, it } from 'vitest';
import {
    getFamilyMessage,
    getSoftProgress,
    getSoftProgressShort,
    getStageLabel,
    getUserMessage,
} from './fuwafuwaHomeCardCopy';

describe('fuwafuwaHomeCardCopy', () => {
    it('returns stage labels for each growth phase', () => {
        expect(getStageLabel(1)).toBe('たまご');
        expect(getStageLabel(2)).toBe('ようせい');
        expect(getStageLabel(3)).toBe('おとな');
    });

    it('returns soft progress labels for family and short card states', () => {
        expect(getSoftProgress(95)).toBe('もうすこしで まんたん！');
        expect(getSoftProgressShort(35)).toBe('いいかんじ');
    });

    it('returns family and user messages based on progress state', () => {
        expect(getFamilyMessage(3, 0, 600)).toBe('3にんで ちからを あわせよう！');
        expect(getUserMessage(0, 600, 1, 0)).toBe('きょうも まってたよ');
        expect(getUserMessage(590, 600, 2, 6)).toBe('もうすぐ おおきくなれそう！');
    });
});
