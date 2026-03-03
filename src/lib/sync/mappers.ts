import type { CustomExercise, SessionRecord } from '../db';
import type { MenuGroup } from '../../data/menuGroups';
import type { ClassLevel } from '../../data/exercises';
import type { ChibifuwaRecord, PastFuwafuwaRecord, UserProfileStore } from '../../store/useAppStore';

export interface AppSettingsInput {
    onboardingCompleted: boolean;
    soundVolume: number;
    ttsEnabled: boolean;
    bgmEnabled: boolean;
    hapticEnabled: boolean;
    notificationsEnabled: boolean;
    notificationTime: string;
}

export function toSessionUpsertPayload(record: SessionRecord, accountId: string) {
    return {
        id: record.id,
        account_id: accountId,
        date: record.date,
        started_at: record.startedAt,
        total_seconds: record.totalSeconds,
        exercise_ids: record.exerciseIds,
        skipped_ids: record.skippedIds,
        user_ids: record.userIds ?? [],
    };
}

export function toFamilyMemberUpsertPayload(user: UserProfileStore, accountId: string) {
    return {
        id: user.id,
        account_id: accountId,
        name: user.name,
        class_level: user.classLevel,
        fuwafuwa_birth_date: user.fuwafuwaBirthDate,
        fuwafuwa_type: user.fuwafuwaType,
        fuwafuwa_cycle_count: user.fuwafuwaCycleCount,
        fuwafuwa_name: user.fuwafuwaName,
        past_fuwafuwas: user.pastFuwafuwas,
        notified_fuwafuwa_stages: user.notifiedFuwafuwaStages,
        daily_target_minutes: user.dailyTargetMinutes,
        excluded_exercises: user.excludedExercises,
        required_exercises: user.requiredExercises,
        consumed_magic_date: user.consumedMagicDate ?? null,
        consumed_magic_seconds: user.consumedMagicSeconds ?? 0,
        avatar_url: user.avatarUrl ?? null,
        chibifuwas: user.chibifuwas ?? [],
    };
}

export function toCustomExerciseUpsertPayload(exercise: CustomExercise, accountId: string) {
    return {
        id: exercise.id,
        account_id: accountId,
        name: exercise.name,
        sec: exercise.sec,
        emoji: exercise.emoji,
        has_split: exercise.hasSplit ?? false,
        creator_id: exercise.creatorId ?? null,
    };
}

export function toMenuGroupUpsertPayload(group: MenuGroup, accountId: string) {
    return {
        id: group.id,
        account_id: accountId,
        name: group.name,
        emoji: group.emoji,
        description: group.description,
        exercise_ids: group.exerciseIds,
        is_preset: group.isPreset,
        creator_id: group.creatorId ?? null,
    };
}

export function toAppSettingsUpsertPayload(settings: AppSettingsInput, accountId: string) {
    return {
        account_id: accountId,
        onboarding_completed: settings.onboardingCompleted,
        sound_volume: settings.soundVolume,
        tts_enabled: settings.ttsEnabled,
        bgm_enabled: settings.bgmEnabled,
        haptic_enabled: settings.hapticEnabled,
        notifications_enabled: settings.notificationsEnabled,
        notification_time: settings.notificationTime,
    };
}

function mergeUniqueById<T extends { id: string }>(primary: T[], secondary: T[]): T[] {
    const result = [...primary];
    const idSet = new Set(primary.map((item) => item.id));
    for (const item of secondary) {
        if (!idSet.has(item.id)) {
            result.push(item);
        }
    }
    return result;
}

export function toLocalUserFromCloudFamily(cloudFamily: any, localUser?: UserProfileStore): UserProfileStore {
    const cloudPast = (cloudFamily.past_fuwafuwas ?? []) as PastFuwafuwaRecord[];
    const localPast = localUser?.pastFuwafuwas ?? [];
    const mergedPast = mergeUniqueById(cloudPast, localPast);

    const cloudChibis = (cloudFamily.chibifuwas ?? []) as ChibifuwaRecord[];
    const localChibis = localUser?.chibifuwas ?? [];
    const mergedChibis = mergeUniqueById(cloudChibis, localChibis);

    return {
        id: cloudFamily.id,
        name: cloudFamily.name,
        classLevel: cloudFamily.class_level as ClassLevel,
        fuwafuwaBirthDate: cloudFamily.fuwafuwa_birth_date,
        fuwafuwaType: cloudFamily.fuwafuwa_type,
        fuwafuwaCycleCount: cloudFamily.fuwafuwa_cycle_count,
        fuwafuwaName: cloudFamily.fuwafuwa_name,
        pastFuwafuwas: mergedPast,
        notifiedFuwafuwaStages: (cloudFamily.notified_fuwafuwa_stages ?? []) as number[],
        dailyTargetMinutes: cloudFamily.daily_target_minutes,
        excludedExercises: cloudFamily.excluded_exercises as string[],
        requiredExercises: cloudFamily.required_exercises as string[],
        consumedMagicDate: cloudFamily.consumed_magic_date ?? undefined,
        consumedMagicSeconds: cloudFamily.consumed_magic_seconds ?? 0,
        avatarUrl: cloudFamily.avatar_url ?? undefined,
        chibifuwas: mergedChibis,
    };
}

export function toLocalSessionRecord(cloudSession: any): SessionRecord {
    return {
        id: cloudSession.id,
        date: cloudSession.date,
        startedAt: cloudSession.started_at,
        totalSeconds: cloudSession.total_seconds,
        exerciseIds: cloudSession.exercise_ids as string[],
        skippedIds: cloudSession.skipped_ids as string[],
        userIds: cloudSession.user_ids as string[],
    };
}

export function toLocalCustomExercise(cloudExercise: any): CustomExercise {
    return {
        id: cloudExercise.id,
        name: cloudExercise.name,
        sec: cloudExercise.sec,
        emoji: cloudExercise.emoji,
        hasSplit: cloudExercise.has_split ?? false,
        creatorId: cloudExercise.creator_id ?? undefined,
    };
}

export function toLocalCustomMenuGroup(cloudGroup: any): MenuGroup {
    return {
        id: cloudGroup.id,
        name: cloudGroup.name,
        emoji: cloudGroup.emoji,
        description: cloudGroup.description ?? '',
        exerciseIds: cloudGroup.exercise_ids as string[],
        isPreset: false,
        creatorId: cloudGroup.creator_id ?? undefined,
    };
}
