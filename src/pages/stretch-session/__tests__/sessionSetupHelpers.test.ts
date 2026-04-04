import { describe, expect, it } from 'vitest';
import { EXERCISES } from '../../../data/exercises';
import {
    buildAutoSessionExercises,
    buildEffectiveSessionSelections,
    buildHistoricalCounts,
    buildOrderedRequiredExerciseIds,
    getSessionContextClassLevel,
    getSessionContextUsers,
    getSessionDailyTargetMinutes,
    resolveExplicitSessionExercises,
} from '../sessionSetupHelpers';
import type { TeacherMenuSetting } from '../../../lib/teacherMenuSettings';
import type { UserProfileStore } from '../../../store/useAppStore';

function createUser(id: string, overrides: Partial<UserProfileStore> = {}): UserProfileStore {
    return {
        id,
        name: id,
        classLevel: '初級',
        fuwafuwaBirthDate: '2026-03-01',
        fuwafuwaType: 1,
        fuwafuwaCycleCount: 1,
        fuwafuwaName: null,
        pastFuwafuwas: [],
        notifiedFuwafuwaStages: [],
        dailyTargetMinutes: 10,
        excludedExercises: [],
        requiredExercises: [],
        consumedMagicSeconds: 0,
        chibifuwas: [],
        ...overrides,
    };
}

function createTeacherSetting(itemId: string, status: TeacherMenuSetting['status']): TeacherMenuSetting {
    return {
        id: `${itemId}-${status}`,
        itemId,
        itemType: 'exercise',
        classLevel: '初級',
        status,
        createdBy: 'teacher',
    };
}

describe('sessionSetupHelpers', () => {
    it('derives context users, lowest class level, and highest target minutes', () => {
        const users = [
            createUser('u1', { classLevel: '中級', dailyTargetMinutes: 12 }),
            createUser('u2', { classLevel: 'プレ', dailyTargetMinutes: 8 }),
        ];
        const contextUsers = getSessionContextUsers(users, ['u2']);

        expect(contextUsers).toHaveLength(1);
        expect(getSessionContextClassLevel(contextUsers)).toBe('プレ');
        expect(getSessionDailyTargetMinutes(users)).toBe(12);
    });

    it('builds historical counts from matching users and shared sessions', () => {
        const counts = buildHistoricalCounts([
            { id: '1', date: '2026-03-08', startedAt: '', totalSeconds: 30, exerciseIds: ['S01'], skippedIds: [], userIds: ['u1'] },
            { id: '2', date: '2026-03-08', startedAt: '', totalSeconds: 30, exerciseIds: ['S01', 'S02'], skippedIds: [], userIds: ['u2'] },
            { id: '3', date: '2026-03-08', startedAt: '', totalSeconds: 30, exerciseIds: ['S03'], skippedIds: [] },
        ], ['u1']);

        expect(counts).toEqual({
            S01: 1,
            S03: 1,
        });
    });

    it('lets user settings override teacher defaults while keeping hybrid required ids', () => {
        const selection = buildEffectiveSessionSelections({
            globalRequiredIds: ['S05'],
            globalExcludedIds: ['S03'],
            teacherSettings: [
                createTeacherSetting('S01', 'required'),
                createTeacherSetting('S03', 'required'),
                createTeacherSetting('S02', 'excluded'),
            ],
            sessionExerciseIds: ['custom-1'],
            sessionHybridMode: true,
            todayExerciseIds: ['S06', 'S05'],
        });

        expect(selection.requiredIds).toEqual(['S05', 'S01', 'custom-1']);
        expect(selection.excludedIds).toEqual(['S06', 'S03', 'S02']);
    });

    it('puts class defaults before dynamic required ids', () => {
        expect(buildOrderedRequiredExerciseIds('プレ', ['S05', 'C02'])).toEqual([
            'S07',
            'S01',
            'S02',
            'S05',
            'S06',
            'S08',
            'C02',
        ]);
    });

    it('keeps required packs at the front even when they exceed the target time', () => {
        const session = buildAutoSessionExercises({
            classLevel: 'プレ',
            dailyTargetMinutes: 3,
            globalRequiredIds: [],
            globalExcludedIds: [],
            teacherSettings: [],
            sessionExerciseIds: null,
            sessionHybridMode: false,
            allSessions: [],
            sessionUserIds: ['u1'],
            allCustomPool: [],
            builtInOverrides: EXERCISES,
            todayKey: '2026-04-04',
        });

        expect(session.slice(0, 6).map((exercise) => exercise.id)).toEqual([
            'S07',
            'S01',
            'S02',
            'S05',
            'S06',
            'S08',
        ]);
        expect(session.at(-1)?.id).toBe('S09');
    });

    it('resolves custom exercises into full session exercise objects', () => {
        const resolved = resolveExplicitSessionExercises(['custom-1'], [{
            id: 'custom-1',
            name: 'カスタム',
            sec: 45,
            emoji: '✨',
            placement: 'stretch',
            hasSplit: false,
        }]);

        expect(resolved).toEqual([expect.objectContaining({
            id: 'custom-1',
            name: 'カスタム',
            internal: 'single',
            priority: 'medium',
        })]);
    });
});
