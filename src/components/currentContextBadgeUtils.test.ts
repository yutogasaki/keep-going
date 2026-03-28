import { describe, expect, it } from 'vitest';
import type { UserProfileStore } from '../store/use-app-store/types';
import {
    buildContextOptions,
    getContextHeaderStatus,
    getContextScopeSummary,
    getSelectedContextOption,
    TOGETHER_ID,
} from './currentContextBadgeUtils';

const USERS: UserProfileStore[] = [
    {
        id: 'user-1',
        name: 'さくら',
        classLevel: '初級',
        fuwafuwaBirthDate: '2026-03-01',
        fuwafuwaType: 2,
        fuwafuwaCycleCount: 1,
        fuwafuwaName: null,
        pastFuwafuwas: [],
        notifiedFuwafuwaStages: [],
        dailyTargetMinutes: 10,
        excludedExercises: [],
        requiredExercises: [],
        consumedMagicSeconds: 0,
        challengeStars: 0,
        avatarUrl: undefined,
        chibifuwas: [],
    },
    {
        id: 'user-2',
        name: 'ゆず',
        classLevel: '中級',
        fuwafuwaBirthDate: '2026-03-02',
        fuwafuwaType: 5,
        fuwafuwaCycleCount: 1,
        fuwafuwaName: null,
        pastFuwafuwas: [],
        notifiedFuwafuwaStages: [],
        dailyTargetMinutes: 10,
        excludedExercises: [],
        requiredExercises: [],
        consumedMagicSeconds: 0,
        challengeStars: 0,
        avatarUrl: undefined,
        chibifuwas: [],
    },
];

describe('currentContextBadgeUtils', () => {
    it('adds a together option when there are multiple users', () => {
        const options = buildContextOptions(USERS);

        expect(options).toHaveLength(3);
        expect(options[2]).toMatchObject({
            id: TOGETHER_ID,
            label: 'みんなで！',
            type: 'together',
            userIds: ['user-1', 'user-2'],
        });
    });

    it('falls back to the first user when no session user is selected', () => {
        const options = buildContextOptions(USERS);

        expect(getSelectedContextOption({
            options,
            sessionUserIds: [],
            users: USERS,
        })?.id).toBe('user-1');
    });

    it('selects the together option when multiple users are active', () => {
        const options = buildContextOptions(USERS);
        const selected = getSelectedContextOption({
            options,
            sessionUserIds: ['user-1', 'user-2'],
            users: USERS,
        });

        expect(selected?.id).toBe(TOGETHER_ID);
        expect(getContextHeaderStatus(selected!)).toBe('家族2人を表示中');
        expect(getContextScopeSummary(selected!)).toBe('ホーム・きろく・メニューで、家族みんなのまとまりを見ています');
    });
});
