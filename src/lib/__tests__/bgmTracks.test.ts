import { describe, expect, it } from 'vitest';
import { BGM_TRACKS, DEFAULT_BGM_TRACK_ID, findBgmTrack } from '../bgmTracks';

describe('bgmTracks', () => {
    it('uses friendly in-app labels for bundled tracks', () => {
        const labels = BGM_TRACKS.map((track) => track.label);

        expect(labels).toContain('ようせいの はらっぱ');
        expect(labels).toContain('こねこの パレード');
        expect(labels.some((label) => /Stretch|Parade|Playground|Morning/u.test(label))).toBe(false);
        expect(BGM_TRACKS.every((track) => track.gain > 0 && track.gain <= 1)).toBe(true);
    });

    it('falls back to the default bundled track when the id is unknown', () => {
        expect(findBgmTrack('missing-track')?.id).toBe(DEFAULT_BGM_TRACK_ID);
    });
});
