import { describe, expect, it } from 'vitest';
import type { Challenge } from '../../lib/challenges';
import type { TeacherExercise, TeacherMenu } from '../../lib/teacherContent';
import { pickHomeAnnouncement } from './homeAnnouncementUtils';

function makeChallenge(overrides: Partial<Challenge> = {}): Challenge {
    return {
        id: 'challenge-1',
        title: '前後開脚チャレンジ',
        summary: 'まいにち すこしずつ',
        description: null,
        challengeType: 'exercise',
        exerciseId: 'S01',
        targetMenuId: null,
        menuSource: null,
        targetCount: 3,
        dailyCap: 1,
        countUnit: 'exercise_completion',
        startDate: '2026-03-10',
        endDate: '2026-03-31',
        windowType: 'calendar',
        goalType: 'total_count',
        windowDays: null,
        requiredDays: null,
        dailyMinimumMinutes: null,
        publishMode: 'seasonal',
        publishStartDate: '2026-03-10',
        publishEndDate: '2026-03-31',
        createdBy: 'teacher-1',
        rewardKind: 'medal',
        rewardValue: 1,
        rewardFuwafuwaType: 1,
        tier: 'big',
        iconEmoji: '🩰',
        classLevels: ['初級'],
        createdAt: '2026-03-10T00:00:00Z',
        ...overrides,
    };
}

function makeTeacherMenu(overrides: Partial<TeacherMenu> = {}): TeacherMenu {
    return {
        id: 'teacher-menu-1',
        name: '先生のおすすめメニュー',
        emoji: '🩰',
        description: '',
        exerciseIds: ['S01'],
        classLevels: ['初級'],
        visibility: 'public',
        focusTags: [],
        recommended: true,
        recommendedOrder: 1,
        displayMode: 'teacher_section',
        createdBy: 'teacher-1',
        createdAt: '2026-03-09T00:00:00Z',
        ...overrides,
    };
}

function makeTeacherExercise(overrides: Partial<TeacherExercise> = {}): TeacherExercise {
    return {
        id: 'teacher-exercise-1',
        name: '先生の新しい種目',
        sec: 45,
        emoji: '✨',
        placement: 'stretch',
        hasSplit: false,
        description: '',
        classLevels: ['初級'],
        visibility: 'public',
        focusTags: [],
        recommended: true,
        recommendedOrder: 1,
        displayMode: 'teacher_section',
        createdBy: 'teacher-1',
        createdAt: '2026-03-09T00:00:00Z',
        ...overrides,
    };
}

describe('pickHomeAnnouncement', () => {
    it('prioritizes a new unjoined challenge over teacher recommendations', () => {
        const result = pickHomeAnnouncement({
            activeUserIds: ['user-1'],
            challenges: [makeChallenge()],
            joinedChallengeIds: { 'user-1': [] },
            dismissedAnnouncementIds: [],
            teacherMenuHighlights: [makeTeacherMenu()],
            teacherExerciseHighlight: makeTeacherExercise(),
            isNewTeacherContent: () => true,
            now: new Date('2026-03-11T00:00:00Z').getTime(),
        });

        expect(result).toEqual({
            id: 'challenge:challenge-1',
            kind: 'challenge',
            badgeLabel: 'チャレンジ',
            title: 'あたらしいチャレンジ みつけたよ',
            detail: '前後開脚チャレンジ',
            actionLabel: 'みてみる',
        });
    });

    it('falls back to a new teacher menu when the challenge announcement is dismissed', () => {
        const result = pickHomeAnnouncement({
            activeUserIds: ['user-1'],
            challenges: [makeChallenge()],
            joinedChallengeIds: { 'user-1': [] },
            dismissedAnnouncementIds: ['challenge:challenge-1'],
            teacherMenuHighlights: [makeTeacherMenu()],
            teacherExerciseHighlight: null,
            isNewTeacherContent: (id) => id === 'teacher-menu-1',
            now: new Date('2026-03-11T00:00:00Z').getTime(),
        });

        expect(result).toEqual({
            id: 'teacher-menu:teacher-menu-1',
            kind: 'teacher_menu',
            badgeLabel: '先生',
            title: 'せんせいから おすすめが とどいたよ',
            detail: '先生のおすすめメニュー',
            actionLabel: 'メニューへ',
        });
    });

    it('skips joined challenges and surfaces a new teacher exercise', () => {
        const result = pickHomeAnnouncement({
            activeUserIds: ['user-1', 'user-2'],
            challenges: [makeChallenge()],
            joinedChallengeIds: {
                'user-1': ['challenge-1'],
                'user-2': ['challenge-1'],
            },
            dismissedAnnouncementIds: [],
            teacherMenuHighlights: [],
            teacherExerciseHighlight: makeTeacherExercise(),
            isNewTeacherContent: (id) => id === 'teacher-exercise-1',
            now: new Date('2026-03-11T00:00:00Z').getTime(),
        });

        expect(result).toEqual({
            id: 'teacher-exercise:teacher-exercise-1',
            kind: 'teacher_exercise',
            badgeLabel: '先生',
            title: 'せんせいが これ どうかなって',
            detail: '先生の新しい種目',
            actionLabel: 'メニューへ',
        });
    });

    it('returns null when there is nothing new to announce', () => {
        const result = pickHomeAnnouncement({
            activeUserIds: ['user-1'],
            challenges: [makeChallenge({ createdAt: '2026-02-01T00:00:00Z' })],
            joinedChallengeIds: { 'user-1': [] },
            dismissedAnnouncementIds: [],
            teacherMenuHighlights: [makeTeacherMenu()],
            teacherExerciseHighlight: makeTeacherExercise(),
            isNewTeacherContent: () => false,
            now: new Date('2026-03-11T00:00:00Z').getTime(),
        });

        expect(result).toBeNull();
    });
});
