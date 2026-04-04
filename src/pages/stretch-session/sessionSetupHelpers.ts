import { EXERCISES, generateSession, type ClassLevel, type Exercise } from '../../data/exercises';
import type { CustomExercise, SessionRecord } from '../../lib/db';
import {
    getClassDefaultRequiredExerciseIds,
    getEffectiveExcludedExerciseIds,
    getOrderedEffectiveRequiredExerciseIds,
} from '../../lib/menuExerciseSettings';
import { sessionPlannedItemToExercise, type SessionPlannedItem } from '../../lib/sessionPlan';
import type { TeacherExercise } from '../../lib/teacherContent';
import type { TeacherItemOverride } from '../../lib/teacherItemOverrides';
import type { TeacherMenuSetting } from '../../lib/teacherMenuSettings';
import type { UserProfileStore } from '../../store/useAppStore';

const CLASS_LEVEL_WEIGHTS: Record<ClassLevel, number> = {
    '先生': -1,
    'プレ': 0,
    '初級': 1,
    '中級': 2,
    '上級': 3,
    'その他': 1,
};

interface EffectiveSessionSelectionParams {
    classLevel: ClassLevel;
    globalRequiredIds: string[];
    globalExcludedIds: string[];
    teacherSettings: TeacherMenuSetting[];
    orderedExerciseIds: string[];
    sessionExerciseIds: string[] | null;
    sessionHybridMode?: boolean;
    todayExerciseIds: string[];
}

export function getSessionContextUsers(
    users: UserProfileStore[],
    sessionUserIds: string[],
): UserProfileStore[] {
    const currentUsers = users.filter((user) => sessionUserIds.includes(user.id));
    return currentUsers.length > 0 ? currentUsers : users.slice(0, 1);
}

export function getSessionContextClassLevel(contextUsers: UserProfileStore[]): ClassLevel {
    if (contextUsers.length === 0) {
        return '初級';
    }

    return contextUsers.reduce<ClassLevel>((minimum, user) => {
        return CLASS_LEVEL_WEIGHTS[user.classLevel] < CLASS_LEVEL_WEIGHTS[minimum]
            ? user.classLevel
            : minimum;
    }, contextUsers[0].classLevel);
}

export function getSessionDailyTargetMinutes(contextUsers: UserProfileStore[]): number {
    if (contextUsers.length === 0) {
        return 10;
    }

    return Math.max(...contextUsers.map((user) => user.dailyTargetMinutes ?? 10));
}

export function getMergedUserSettingIds(
    contextUsers: UserProfileStore[],
    key: 'excludedExercises' | 'requiredExercises',
): string[] {
    return Array.from(new Set(
        contextUsers.flatMap((user) => user[key] ?? [])
    ));
}

export function buildExerciseOverrideMap(overrides: TeacherItemOverride[]): Map<string, TeacherItemOverride> {
    return new Map(
        overrides
            .filter((override) => override.itemType === 'exercise')
            .map((override) => [override.itemId, override]),
    );
}

function dedupeExerciseIds(ids: string[]): string[] {
    const seen = new Set<string>();
    const ordered: string[] = [];

    for (const id of ids) {
        if (!id || seen.has(id)) {
            continue;
        }
        seen.add(id);
        ordered.push(id);
    }

    return ordered;
}

function removeLeadingPrep(exercises: Exercise[]): Exercise[] {
    const trimmed = [...exercises];
    while (trimmed[0]?.placement === 'prep') {
        trimmed.shift();
    }
    return trimmed;
}

function removeTrailingEnding(exercises: Exercise[]): Exercise[] {
    const trimmed = [...exercises];
    while (trimmed[trimmed.length - 1]?.placement === 'ending') {
        trimmed.pop();
    }
    return trimmed;
}

function insertAutoRestExercises(exercises: Exercise[]): Exercise[] {
    const restExercise = EXERCISES.find((exercise) => exercise.id === 'R03');
    if (!restExercise) {
        return exercises;
    }

    const withRests: Exercise[] = [];
    let accumulated = 0;
    for (const exercise of exercises) {
        withRests.push(exercise);
        accumulated += exercise.sec;
        if (accumulated >= 300) {
            withRests.push(restExercise);
            accumulated = 0;
        }
    }

    if (withRests.at(-1)?.placement === 'rest') {
        withRests.pop();
    }

    return withRests;
}

export function buildOrderedRequiredExerciseIds(
    classLevel: ClassLevel,
    dynamicRequiredIds: string[],
): string[] {
    return getOrderedEffectiveRequiredExerciseIds({
        classLevel,
        exerciseIds: [
            ...getClassDefaultRequiredExerciseIds(classLevel),
            ...dynamicRequiredIds,
        ],
        teacherSettings: [],
        userRequiredExerciseIds: dynamicRequiredIds,
        userExcludedExerciseIds: [],
    });
}

export function applyTeacherExerciseOverrides(
    exercises: Exercise[],
    overrideMap: Map<string, TeacherItemOverride>,
): Exercise[] {
    return exercises.map((exercise) => {
        const override = overrideMap.get(exercise.id);
        if (!override) {
            return exercise;
        }

        return {
            ...exercise,
            name: override.nameOverride ?? exercise.name,
            emoji: override.emojiOverride ?? exercise.emoji,
            sec: override.secOverride ?? exercise.sec,
            hasSplit: override.hasSplitOverride ?? exercise.hasSplit,
            description: override.descriptionOverride ?? exercise.description,
            reading: override.nameOverride ? undefined : exercise.reading,
        };
    });
}

export function mapTeacherExercisesToCustomPool(
    teacherExercises: TeacherExercise[],
    classLevel: ClassLevel,
): CustomExercise[] {
    return teacherExercises
        .filter((exercise) => exercise.classLevels.length === 0 || exercise.classLevels.includes(classLevel))
        .map((exercise) => ({
            id: exercise.id,
            name: exercise.name,
            sec: exercise.sec,
            emoji: exercise.emoji,
            placement: exercise.placement,
            hasSplit: exercise.hasSplit,
            description: exercise.description,
        }));
}

export function buildHistoricalCounts(
    sessions: SessionRecord[],
    sessionUserIds: string[],
): Record<string, number> {
    const counts: Record<string, number> = {};

    for (const session of sessions) {
        if (session.userIds && !session.userIds.some((userId) => sessionUserIds.includes(userId))) {
            continue;
        }

        for (const exerciseId of session.exerciseIds) {
            counts[exerciseId] = (counts[exerciseId] || 0) + 1;
        }
    }

    return counts;
}

export function buildEffectiveSessionSelections({
    classLevel,
    globalRequiredIds,
    globalExcludedIds,
    teacherSettings,
    orderedExerciseIds,
    sessionExerciseIds,
    sessionHybridMode,
    todayExerciseIds,
}: EffectiveSessionSelectionParams): { requiredIds: string[]; excludedIds: string[] } {
    const requiredIds = dedupeExerciseIds([
        ...getOrderedEffectiveRequiredExerciseIds({
            classLevel,
            exerciseIds: orderedExerciseIds,
            teacherSettings,
            userRequiredExerciseIds: globalRequiredIds,
            userExcludedExerciseIds: globalExcludedIds,
        }),
        ...(sessionHybridMode && sessionExerciseIds ? sessionExerciseIds : []),
    ]);
    const excludedIds = dedupeExerciseIds([
        ...todayExerciseIds,
        ...getEffectiveExcludedExerciseIds({
            classLevel,
            exerciseIds: orderedExerciseIds,
            teacherSettings,
            userRequiredExerciseIds: globalRequiredIds,
            userExcludedExerciseIds: globalExcludedIds,
        }),
    ]).filter((id) => !requiredIds.includes(id));

    return { requiredIds, excludedIds };
}

export function buildAutoSessionExercises({
    classLevel,
    dailyTargetMinutes,
    globalRequiredIds,
    globalExcludedIds,
    teacherSettings,
    sessionExerciseIds,
    sessionHybridMode,
    allSessions,
    sessionUserIds,
    allCustomPool,
    builtInOverrides,
    todayKey,
}: {
    classLevel: ClassLevel;
    dailyTargetMinutes: number;
    globalRequiredIds: string[];
    globalExcludedIds: string[];
    teacherSettings: TeacherMenuSetting[];
    sessionExerciseIds: string[] | null;
    sessionHybridMode?: boolean;
    allSessions: SessionRecord[];
    sessionUserIds: string[];
    allCustomPool: CustomExercise[];
    builtInOverrides: Exercise[];
    todayKey: string;
}): Exercise[] {
    const historicalCounts = buildHistoricalCounts(allSessions, sessionUserIds);
    const todayExerciseIds = allSessions
        .filter((session) => session.date === todayKey)
        .flatMap((session) => [...session.exerciseIds, ...session.skippedIds]);
    const allAvailableExercises = [...builtInOverrides, ...allCustomPool];
    const orderedExerciseIds = allAvailableExercises.map((exercise) => exercise.id);
    const { requiredIds, excludedIds } = buildEffectiveSessionSelections({
        classLevel,
        globalRequiredIds,
        globalExcludedIds,
        teacherSettings,
        orderedExerciseIds,
        sessionExerciseIds,
        sessionHybridMode,
        todayExerciseIds,
    });
    const requiredExercises = resolveExplicitSessionExercises(requiredIds, allAvailableExercises);
    const requiredExerciseIds = requiredExercises.map((exercise) => exercise.id);
    const requiredSeconds = requiredExercises.reduce((sum, exercise) => sum + exercise.sec, 0);
    const remainingTargetSeconds = Math.max(0, dailyTargetMinutes * 60 - requiredSeconds);

    const optionalSession = remainingTargetSeconds > 0
        ? generateSession(classLevel, {
            excludedIds: dedupeExerciseIds([...excludedIds, ...requiredExerciseIds]),
            requiredIds: [],
            targetSeconds: remainingTargetSeconds,
            customPool: allCustomPool,
            historicalCounts,
            builtInOverrides,
        })
        : [];

    const trimmedOptionalSession = requiredExercises.length > 0
        ? removeTrailingEnding(removeLeadingPrep(optionalSession.filter((exercise) => exercise.placement !== 'rest')))
        : optionalSession.filter((exercise) => exercise.placement !== 'rest');

    const combined = [
        ...requiredExercises,
        ...trimmedOptionalSession,
    ];
    const endingExercise = resolveExplicitSessionExercises(['S09'], allAvailableExercises)[0];

    if (endingExercise && combined.at(-1)?.id !== endingExercise.id) {
        combined.push(endingExercise);
    }

    return insertAutoRestExercises(combined);
}

export function resolveExplicitSessionExercises(
    sessionExerciseIds: string[],
    allExercises: Array<Partial<Exercise> & Pick<Exercise, 'id' | 'name' | 'sec' | 'emoji' | 'placement'>>,
): Exercise[] {
    const resolved: Exercise[] = [];

    for (const id of sessionExerciseIds) {
        const found = allExercises.find((exercise) => exercise.id === id);
        if (!found) {
            continue;
        }

        resolved.push({
            id: found.id,
            name: found.name,
            sec: found.sec,
            placement: found.placement,
            emoji: found.emoji,
            internal: found.hasSplit ? 'R30→L30' : 'single',
            classes: found.classes ?? [],
            priority: found.priority ?? 'medium',
            hasSplit: found.hasSplit,
            reading: found.reading,
            description: found.description,
        });
    }

    return resolved;
}

export function resolvePlannedSessionExercises(items: SessionPlannedItem[]): Exercise[] {
    return items.map((item) => sessionPlannedItemToExercise(item));
}

export function getDefaultBuiltInExercises(): Exercise[] {
    return EXERCISES;
}
