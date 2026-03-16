import { describe, expect, it } from 'vitest';
import type { MenuGroup } from '../../data/menuGroups';
import type { CustomExercise } from '../../lib/db';
import type { TeacherExercise, TeacherMenu } from '../../lib/teacherContent';
import {
    getPersonalChallengeEmoji,
    getPersonalChallengeTargetName,
    inferPersonalChallengeExerciseSource,
    inferPersonalChallengeMenuSource,
    isPersonalChallengeTargetMissing,
} from './shared';

function createTeacherExercise(overrides: Partial<TeacherExercise> = {}): TeacherExercise {
    return {
        id: overrides.id ?? 'teacher-ex-1',
        name: overrides.name ?? '先生のストレッチ',
        emoji: overrides.emoji ?? '🧑‍🏫',
        sec: overrides.sec ?? 30,
        placement: overrides.placement ?? 'ending',
        hasSplit: overrides.hasSplit ?? false,
        description: overrides.description ?? '',
        classLevels: overrides.classLevels ?? ['all'],
        visibility: overrides.visibility ?? 'public',
        focusTags: overrides.focusTags ?? [],
        recommended: overrides.recommended ?? false,
        recommendedOrder: overrides.recommendedOrder ?? null,
        displayMode: overrides.displayMode ?? 'teacher_section',
        createdBy: overrides.createdBy ?? 'teacher-1',
        createdAt: overrides.createdAt ?? '2026-03-16T00:00:00.000Z',
    };
}

function createTeacherMenu(overrides: Partial<TeacherMenu> = {}): TeacherMenu {
    return {
        id: overrides.id ?? 'teacher-menu-1',
        name: overrides.name ?? '先生メニュー',
        description: overrides.description ?? '',
        emoji: overrides.emoji ?? '📚',
        exerciseIds: overrides.exerciseIds ?? ['teacher-ex-1'],
        classLevels: overrides.classLevels ?? ['all'],
        visibility: overrides.visibility ?? 'public',
        focusTags: overrides.focusTags ?? [],
        recommended: overrides.recommended ?? false,
        recommendedOrder: overrides.recommendedOrder ?? null,
        displayMode: overrides.displayMode ?? 'teacher_section',
        createdBy: overrides.createdBy ?? 'teacher-1',
        createdAt: overrides.createdAt ?? '2026-03-16T00:00:00.000Z',
    };
}

function createCustomExercise(overrides: Partial<CustomExercise> = {}): CustomExercise {
    return {
        id: overrides.id ?? 'custom-ex-1',
        name: overrides.name ?? 'もらった種目',
        sec: overrides.sec ?? 45,
        emoji: overrides.emoji ?? '🌟',
        placement: overrides.placement ?? 'prep',
        description: overrides.description,
        creatorId: overrides.creatorId ?? 'member-1',
    };
}

function createCustomMenu(overrides: Partial<MenuGroup> = {}): MenuGroup {
    return {
        id: overrides.id ?? 'custom-1',
        name: overrides.name ?? 'もらったメニュー',
        emoji: overrides.emoji ?? '🗂️',
        description: overrides.description ?? '',
        exerciseIds: overrides.exerciseIds ?? ['custom-ex-1'],
        items: overrides.items,
        isPreset: overrides.isPreset ?? false,
        creatorId: overrides.creatorId ?? 'member-1',
        origin: overrides.origin,
        visibility: overrides.visibility,
        focusTags: overrides.focusTags,
        recommended: overrides.recommended,
        recommendedOrder: overrides.recommendedOrder,
        displayMode: overrides.displayMode,
    };
}

describe('personal challenge shared helpers', () => {
    it('shows an explicit missing label for deleted custom exercises', () => {
        const challenge = {
            challengeType: 'exercise' as const,
            exerciseId: 'custom-ex-missing',
            targetMenuId: null,
            menuSource: null,
            iconEmoji: null,
        };

        expect(getPersonalChallengeTargetName(challenge)).toBe('見つからないもらった種目');
        expect(getPersonalChallengeEmoji(challenge)).toBe('⚠️');
        expect(isPersonalChallengeTargetMissing(challenge)).toBe(true);
    });

    it('shows an explicit missing label for deleted custom menus', () => {
        const challenge = {
            challengeType: 'menu' as const,
            exerciseId: null,
            targetMenuId: 'custom-missing',
            menuSource: 'custom' as const,
            iconEmoji: null,
        };

        expect(getPersonalChallengeTargetName(challenge)).toBe('見つからないもらったメニュー');
        expect(getPersonalChallengeEmoji(challenge)).toBe('⚠️');
        expect(isPersonalChallengeTargetMissing(challenge)).toBe(true);
    });

    it('keeps existing labels when the target still exists', () => {
        const challenge = {
            challengeType: 'menu' as const,
            exerciseId: null,
            targetMenuId: 'custom-1',
            menuSource: 'custom' as const,
            iconEmoji: null,
        };
        const customMenu = createCustomMenu();

        expect(getPersonalChallengeTargetName(challenge, [], [], [], [customMenu])).toBe('もらったメニュー');
        expect(getPersonalChallengeEmoji(challenge, [], [], [], [customMenu])).toBe('🗂️');
        expect(isPersonalChallengeTargetMissing(challenge, [], [], [], [customMenu])).toBe(false);
    });

    it('infers retry sources from ids even after local targets disappear', () => {
        expect(inferPersonalChallengeExerciseSource('teacher-ex-gone')).toBe('teacher');
        expect(inferPersonalChallengeExerciseSource('custom-ex-gone')).toBe('custom');
        expect(inferPersonalChallengeExerciseSource('S01')).toBe('standard');
        expect(inferPersonalChallengeMenuSource('custom', 'custom-gone')).toBe('custom');
        expect(inferPersonalChallengeMenuSource(null, 'teacher-menu-gone')).toBe('teacher');
        expect(inferPersonalChallengeMenuSource(null, 'preset-basic')).toBe('preset');
    });

    it('prefers the live lookup result over id prefixes', () => {
        const teacherExercise = createTeacherExercise({ id: 'special-exercise' });
        const customExercise = createCustomExercise({ id: 'special-custom' });
        const teacherMenu = createTeacherMenu({ id: 'special-menu' });
        const customMenu = createCustomMenu({ id: 'special-custom-menu' });

        expect(inferPersonalChallengeExerciseSource('special-exercise', [teacherExercise])).toBe('teacher');
        expect(inferPersonalChallengeExerciseSource('special-custom', [], [customExercise])).toBe('custom');
        expect(inferPersonalChallengeMenuSource(null, 'special-menu', [teacherMenu])).toBe('teacher');
        expect(inferPersonalChallengeMenuSource(null, 'special-custom-menu', [], [customMenu])).toBe('custom');
    });
});
