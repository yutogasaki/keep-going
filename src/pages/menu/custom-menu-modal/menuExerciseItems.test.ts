import { describe, expect, it } from 'vitest';
import { EXERCISES } from '../../../data/exercises';
import type { CustomExercise } from '../../../lib/db';
import type { TeacherExercise } from '../../../lib/teacherContent';
import {
    buildMenuExerciseItems,
    cycleMenuExerciseSelection,
    summarizeMenuExerciseItems,
} from './menuExerciseItems';
import type { TeacherMenuSetting } from '../../../lib/teacherMenuSettings';

function createTeacherExercise(overrides: Partial<TeacherExercise> & Pick<TeacherExercise, 'id' | 'name'>): TeacherExercise {
    return {
        id: overrides.id,
        name: overrides.name,
        sec: overrides.sec ?? 45,
        emoji: overrides.emoji ?? '🧘',
        placement: overrides.placement ?? 'prep',
        hasSplit: overrides.hasSplit ?? false,
        description: overrides.description ?? '',
        classLevels: overrides.classLevels ?? ['初級'],
        visibility: overrides.visibility ?? 'public',
        focusTags: overrides.focusTags ?? [],
        recommended: overrides.recommended ?? false,
        recommendedOrder: overrides.recommendedOrder ?? null,
        displayMode: overrides.displayMode ?? 'teacher_section',
        createdBy: overrides.createdBy ?? 'teacher-1',
        createdAt: overrides.createdAt ?? '2026-03-08T00:00:00.000Z',
    };
}

function createCustomExercise(overrides: Partial<CustomExercise> & Pick<CustomExercise, 'id' | 'name'>): CustomExercise {
    return {
        id: overrides.id,
        name: overrides.name,
        sec: overrides.sec ?? 30,
        emoji: overrides.emoji ?? '✨',
        placement: overrides.placement ?? 'ending',
        hasSplit: overrides.hasSplit,
        description: overrides.description ?? '',
        creatorId: overrides.creatorId ?? 'user-1',
    };
}

function createTeacherSetting(itemId: string, status: TeacherMenuSetting['status']): TeacherMenuSetting {
    return {
        id: `${itemId}-${status}`,
        itemId,
        itemType: 'exercise',
        classLevel: '初級',
        status,
        createdBy: 'teacher-1',
    };
}

describe('menuExerciseItems', () => {
    it('builds filtered exercise items with teacher and custom labels', () => {
        const teacherExercise = createTeacherExercise({ id: 'teacher-1', name: '先生の種目' });
        const customExercise = createCustomExercise({ id: 'custom-1', name: 'じぶん種目' });

        const items = buildMenuExerciseItems({
            classLevel: '初級',
            customExercises: [customExercise],
            excludedExercises: [],
            filter: 'teacher',
            query: '先生',
            requiredExercises: [],
            teacherExercises: [teacherExercise],
            teacherSettings: [createTeacherSetting('teacher-1', 'required')],
            teacherRequiredExerciseIds: new Set(['teacher-1']),
        });

        const summary = summarizeMenuExerciseItems(items);

        expect(summary.visibleItems).toHaveLength(1);
        expect(summary.visibleItems[0]).toMatchObject({
            source: 'teacher',
            sourceLabel: '先生',
            teacherBadge: '先生: 必須',
            isRequired: true,
        });
        expect(summary.requiredCount).toBeGreaterThanOrEqual(1);
    });

    it('ignores hidden teacher items and excludes rest items from counts', () => {
        const restExercise = EXERCISES.find((exercise) => exercise.placement === 'rest');
        if (!restExercise) {
            throw new Error('expected a rest exercise fixture');
        }

        const items = buildMenuExerciseItems({
            classLevel: '初級',
            customExercises: [],
            excludedExercises: [restExercise.id],
            filter: 'changed',
            query: '',
            requiredExercises: [],
            teacherExercises: [createTeacherExercise({ id: 'teacher-hidden', name: '非表示の先生種目' })],
            teacherSettings: [],
            teacherHiddenExerciseIds: new Set(['teacher-hidden']),
        });

        const summary = summarizeMenuExerciseItems(items);

        expect(summary.visibleItems.some((item) => item.exercise.id === 'teacher-hidden')).toBe(false);
        expect(summary.excludedCount).toBe(0);
    });

    it('cycles user and teacher overrides in the same order as the modal', () => {
        const baseItem = buildMenuExerciseItems({
            classLevel: '初級',
            customExercises: [],
            excludedExercises: [],
            filter: 'all',
            query: '',
            requiredExercises: [],
            teacherSettings: [],
        }).find((item) => !item.isRest);

        if (!baseItem) {
            throw new Error('expected a non-rest exercise fixture');
        }

        const fromTeacherRequired = cycleMenuExerciseSelection({
            excludedExercises: [],
            item: {
                ...baseItem,
                isTeacherRequired: true,
                inheritedStatus: 'required',
            },
            requiredExercises: [],
        });

        expect(fromTeacherRequired).toEqual({
            excludedExercises: [baseItem.exercise.id],
            requiredExercises: [baseItem.exercise.id],
        });

        const fromUserExcluded = cycleMenuExerciseSelection({
            excludedExercises: [baseItem.exercise.id],
            item: {
                ...baseItem,
                isUserExcluded: true,
                inheritedStatus: 'optional',
            },
            requiredExercises: [],
        });

        expect(fromUserExcluded).toEqual({
            excludedExercises: [],
            requiredExercises: [baseItem.exercise.id],
        });
    });

    it('shows class defaults and lets users override them back to optional', () => {
        const item = buildMenuExerciseItems({
            classLevel: 'プレ',
            customExercises: [],
            excludedExercises: [],
            filter: 'changed',
            query: 'ポイント',
            requiredExercises: [],
            teacherSettings: [],
        })[0];

        expect(item).toMatchObject({
            classBadge: 'クラス: 必須',
            isRequired: true,
            inheritedStatus: 'required',
        });

        const next = cycleMenuExerciseSelection({
            excludedExercises: [],
            item,
            requiredExercises: [],
        });

        expect(next).toEqual({
            excludedExercises: [item.exercise.id],
            requiredExercises: [item.exercise.id],
        });
    });
});
