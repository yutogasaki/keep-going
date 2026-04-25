import { describe, it, expect } from 'vitest';
import {
    toSessionUpsertPayload,
    toAppSettingsUpsertPayload,
    toMenuGroupUpsertPayload,
    toLocalSessionRecord,
    toLocalCustomExercise,
    toLocalCustomMenuGroup,
    toLocalUserFromCloudFamily,
} from '../mappers';
import type { SessionRecord } from '../../db';
import type { MenuGroup } from '../../../data/menuGroups';
import type { UserProfileStore } from '../../../store/useAppStore';
import { baseCloudFamily } from './mappers.fixtures';

describe('toSessionUpsertPayload', () => {
    it('maps camelCase to snake_case correctly', () => {
        const record: SessionRecord = {
            id: 'ses-1',
            date: '2026-03-05',
            startedAt: '2026-03-05T10:00:00',
            totalSeconds: 600,
            exerciseIds: ['ex1', 'ex2'],
            skippedIds: ['ex3'],
            userIds: ['user1'],
        };

        const payload = toSessionUpsertPayload(record, 'account-123');

        expect(payload).toEqual({
            id: 'ses-1',
            account_id: 'account-123',
            date: '2026-03-05',
            started_at: '2026-03-05T10:00:00',
            total_seconds: 600,
            exercise_ids: ['ex1', 'ex2'],
            planned_exercise_ids: [],
            planned_items: [],
            skipped_ids: ['ex3'],
            user_ids: ['user1'],
            source_menu_id: null,
            source_menu_source: null,
            source_menu_name: null,
        });
    });

    it('defaults userIds to empty array when undefined', () => {
        const record = {
            id: 'ses-2',
            date: '2026-03-05',
            startedAt: '2026-03-05T10:00:00',
            totalSeconds: 300,
            exerciseIds: [],
            skippedIds: [],
        } as SessionRecord;

        const payload = toSessionUpsertPayload(record, 'acc');
        expect(payload.user_ids).toEqual([]);
    });
});

describe('toLocalSessionRecord', () => {
    it('maps snake_case to camelCase correctly', () => {
        const cloud = {
            id: 'ses-1',
            date: '2026-03-05',
            started_at: '2026-03-05T10:00:00',
            total_seconds: 600,
            exercise_ids: ['ex1'],
            planned_exercise_ids: [],
            skipped_ids: [],
            user_ids: ['user1'],
            source_menu_id: null,
            source_menu_source: null,
            source_menu_name: null,
        };

        const local = toLocalSessionRecord(cloud);

        expect(local).toEqual({
            id: 'ses-1',
            date: '2026-03-05',
            startedAt: '2026-03-05T10:00:00',
            totalSeconds: 600,
            exerciseIds: ['ex1'],
            plannedExerciseIds: [],
            plannedItems: [],
            skippedIds: [],
            userIds: ['user1'],
            sourceMenuId: null,
            sourceMenuSource: null,
            sourceMenuName: null,
        });
    });
});

describe('menu group mappers', () => {
    it('writes menu_items when present', () => {
        const group: MenuGroup = {
            id: 'menu-1',
            name: 'テストメニュー',
            emoji: '🌟',
            description: 'test',
            exerciseIds: ['S01', 'inline-1'],
            items: [
                { id: 'S01', kind: 'exercise_ref', exerciseId: 'S01' },
                {
                    id: 'inline-1',
                    kind: 'inline_only',
                    name: 'その場ジャンプ',
                    sec: 30,
                    emoji: '✨',
                    placement: 'stretch',
                    internal: 'single',
                },
            ],
            isPreset: false,
            creatorId: 'user-1',
        };

        expect(toMenuGroupUpsertPayload(group, 'acc-1')).toEqual({
            id: 'menu-1',
            account_id: 'acc-1',
            name: 'テストメニュー',
            emoji: '🌟',
            description: 'test',
            exercise_ids: ['S01', 'inline-1'],
            menu_items: group.items,
            is_preset: false,
            creator_id: 'user-1',
        });
    });

    it('restores menu_items and falls back when missing', () => {
        const cloudWithItems = {
            id: 'menu-1',
            name: 'メニュー',
            emoji: '🌈',
            description: 'desc',
            exercise_ids: ['S01', 'inline-1'],
            menu_items: [
                { id: 'S01', kind: 'exercise_ref', exerciseId: 'S01' },
                {
                    id: 'inline-1',
                    kind: 'inline_only',
                    name: 'その場ジャンプ',
                    sec: 30,
                    emoji: '✨',
                    placement: 'stretch',
                    internal: 'single',
                },
            ],
            creator_id: 'user-1',
        };

        expect(toLocalCustomMenuGroup(cloudWithItems as never)).toMatchObject({
            id: 'menu-1',
            items: cloudWithItems.menu_items,
        });

        const cloudWithoutItems = {
            ...cloudWithItems,
            menu_items: null,
            exercise_ids: ['S01', 'S02'],
        };

        const result = toLocalCustomMenuGroup(cloudWithoutItems as never);
        expect(result.items).toHaveLength(2);
        expect(result.items![0]).toMatchObject({ kind: 'exercise_ref', exerciseId: 'S01' });
        expect(result.items![1]).toMatchObject({ kind: 'exercise_ref', exerciseId: 'S02' });
        expect(result.items![0].id).toMatch(/^ref-/);
        expect(result.items![1].id).toMatch(/^ref-/);
    });
});

describe('toLocalCustomExercise', () => {
    it('maps cloud exercise to local format', () => {
        const cloud = {
            id: 'ex-1',
            name: 'テスト種目',
            sec: 30,
            emoji: '🧘',
            placement: 'core',
            has_split: true,
            description: 'テスト説明',
            creator_id: 'teacher-1',
        };

        const local = toLocalCustomExercise(cloud);

        expect(local).toEqual({
            id: 'ex-1',
            name: 'テスト種目',
            sec: 30,
            emoji: '🧘',
            placement: 'core',
            hasSplit: true,
            description: 'テスト説明',
            creatorId: 'teacher-1',
        });
    });

    it('defaults hasSplit to false and description/creatorId to undefined', () => {
        const cloud = {
            id: 'ex-2',
            name: 'シンプル',
            sec: 20,
            emoji: '💪',
        };

        const local = toLocalCustomExercise(cloud);

        expect(local.hasSplit).toBe(false);
        expect(local.description).toBeUndefined();
        expect(local.creatorId).toBeUndefined();
        expect(local.placement).toBe('stretch');
    });
});

describe('toLocalUserFromCloudFamily', () => {
    it('maps cloud family to local user', () => {
        const local = toLocalUserFromCloudFamily(baseCloudFamily);

        expect(local.id).toBe('user-1');
        expect(local.name).toBe('テストちゃん');
        expect(local.classLevel).toBe('初級');
        expect(local.fuwafuwaType).toBe(3);
        expect(local.fuwafuwaName).toBe('ぽわぽわ');
    });

    it('merges pastFuwafuwas from cloud and local (union by id)', () => {
        const cloudFamily = {
            ...baseCloudFamily,
            past_fuwafuwas: [
                { id: 'fw-1', type: 0, stage: 3, name: 'ふわ1', cycleNumber: 1 },
            ],
        };
        const localUser = {
            id: 'user-1',
            pastFuwafuwas: [
                { id: 'fw-1', type: 0, stage: 3, name: 'ふわ1', cycleNumber: 1 },
                { id: 'fw-2', type: 1, stage: 2, name: 'ふわ2', cycleNumber: 2 },
            ],
        } as unknown as UserProfileStore;

        const result = toLocalUserFromCloudFamily(cloudFamily, localUser);

        expect(result.pastFuwafuwas).toHaveLength(2);
        expect(result.pastFuwafuwas.map((f) => f.id).sort()).toEqual(['fw-1', 'fw-2']);
    });

    it('cloud wins for regular fields even when local differs', () => {
        const localUser = {
            id: 'user-1',
            name: 'ローカル名前',
            classLevel: '上級',
            fuwafuwaType: 9,
        } as unknown as UserProfileStore;

        const result = toLocalUserFromCloudFamily(baseCloudFamily, localUser);

        expect(result.name).toBe('テストちゃん'); // cloud wins
        expect(result.classLevel).toBe('初級'); // cloud wins
        expect(result.fuwafuwaType).toBe(3); // cloud wins
    });
});

describe('toAppSettingsUpsertPayload', () => {
    it('maps settings to cloud format', () => {
        const settings = {
            onboardingCompleted: true,
            soundVolume: 0.8,
            ttsEnabled: false,
            bgmEnabled: true,
            hapticEnabled: true,
            notificationsEnabled: true,
            notificationTime: '20:30',
        };

        const payload = toAppSettingsUpsertPayload(settings, 'acc-1');

        expect(payload).toEqual({
            account_id: 'acc-1',
            onboarding_completed: true,
            sound_volume: 0.8,
            tts_enabled: false,
            bgm_enabled: true,
            haptic_enabled: true,
            notifications_enabled: true,
            notification_time: '20:30',
        });
    });
});
