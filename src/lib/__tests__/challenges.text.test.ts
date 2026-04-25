import { describe, expect, it } from 'vitest';
import {
    getChallengeCardText,
    getChallengeDescriptionText,
    getChallengeGoalLabel,
    getChallengeHeaderText,
    getChallengeInviteWindowLabel,
    getChallengeProgressLabel,
    getChallengeRewardLabel,
} from '../challenges';
import { makeChallenge } from './challenges.fixtures';

describe('getChallengeRewardLabel', () => {
    it('formats star rewards', () => {
        expect(getChallengeRewardLabel(makeChallenge())).toBe('ほし 3こ');
    });

    it('formats medal rewards', () => {
        expect(getChallengeRewardLabel(makeChallenge({
            rewardKind: 'medal',
            rewardValue: 4,
            rewardFuwafuwaType: 4,
            tier: 'big',
        }))).toBe('メダル');
    });
});

describe('challenge text helpers', () => {
    it('prefers summary for compact card text', () => {
        expect(getChallengeCardText(makeChallenge())).toBe('1日1回の開脚');
    });

    it('falls back to description when summary matches title', () => {
        expect(getChallengeCardText(makeChallenge({
            summary: '開脚チャレンジ',
            description: 'ゆっくりやる',
        }))).toBe('ゆっくりやる');
    });

    it('shows header text only when summary differs from title', () => {
        expect(getChallengeHeaderText(makeChallenge())).toBe('1日1回の開脚');
        expect(getChallengeHeaderText(makeChallenge({ summary: '開脚チャレンジ' }))).toBeNull();
    });

    it('hides detail description when it duplicates summary', () => {
        expect(getChallengeDescriptionText(makeChallenge({
            summary: '同じ',
            description: '同じ',
        }))).toBeNull();
        expect(getChallengeDescriptionText(makeChallenge({
            summary: 'ひとこと',
            description: '詳しい説明',
        }))).toBe('詳しい説明');
    });

    it('formats rolling active-day labels', () => {
        const challenge = makeChallenge({
            windowType: 'rolling',
            goalType: 'active_day',
            windowDays: 7,
            requiredDays: 5,
            targetCount: 5,
        });

        expect(getChallengeGoalLabel(challenge, '前後開脚')).toBe('前後開脚を5日');
        expect(getChallengeProgressLabel(challenge, 3)).toBe('3 / 5日');
        expect(getChallengeInviteWindowLabel(challenge)).toBe('参加すると 今日から7日');
    });

    it('formats duration-based active-day labels', () => {
        const challenge = makeChallenge({
            challengeType: 'duration',
            goalType: 'active_day',
            requiredDays: 5,
            targetCount: 5,
            dailyMinimumMinutes: 3,
        });

        expect(getChallengeGoalLabel(challenge, '1日3分以上')).toBe('1日3分以上を5日');
    });
});
