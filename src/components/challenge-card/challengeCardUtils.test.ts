import { describe, expect, it } from 'vitest';
import { getChallengeProgressCallout } from './challengeCardUtils';

describe('challengeCardUtils', () => {
    it('builds active-day progress callouts', () => {
        expect(getChallengeProgressCallout({
            progress: 2,
            goalTarget: 5,
            goalType: 'active_day',
            allCompleted: false,
        })).toBe('あと3日でクリア');
    });

    it('builds total-count progress callouts', () => {
        expect(getChallengeProgressCallout({
            progress: 4,
            goalTarget: 7,
            goalType: 'total_count',
            allCompleted: false,
        })).toBe('あと3回でクリア');
    });

    it('uses completion copy after clearing the challenge', () => {
        expect(getChallengeProgressCallout({
            progress: 5,
            goalTarget: 5,
            goalType: 'active_day',
            allCompleted: true,
        })).toBe('クリア！ ごほうびゲット');
    });
});
