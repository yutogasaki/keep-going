// Stretch & Core exercise master data from specification

import {
    getExercisePlacementLabel as getPlacementLabel,
    isRestPlacement,
    type ExercisePlacement,
} from './exercisePlacement';

export type ClassLevel = '先生' | 'プレ' | '初級' | '中級' | '上級' | 'その他';

export interface ClassLevelInfo {
    id: ClassLevel;
    label: string;
    emoji: string;
    desc: string;
}

export const CLASS_LEVELS: ClassLevelInfo[] = [
    { id: '先生', label: '先生', emoji: '👩‍🏫', desc: '先生用のステージング' },
    { id: 'プレ', label: 'プレバレエ', emoji: '🐣', desc: 'はじめてのバレエ' },
    { id: '初級', label: '初級', emoji: '🌱', desc: 'たのしくストレッチ' },
    { id: '中級', label: '中級', emoji: '🌸', desc: 'もっとやわらかく' },
    { id: '上級', label: '上級', emoji: '⭐', desc: 'もっと上へ' },
    { id: 'その他', label: 'その他', emoji: '🎵', desc: 'その他のクラス' },
];

/** User-facing class levels (excludes '先生') */
export const USER_CLASS_LEVELS: ClassLevelInfo[] = CLASS_LEVELS.filter(c => c.id !== '先生');

export const CLASS_EMOJI: Record<string, string> = Object.fromEntries(
    CLASS_LEVELS.map(c => [c.id, c.emoji])
);

export type Priority = 'high' | 'medium';

export interface Exercise {
    id: string;
    name: string;
    sec: number;
    placement: ExercisePlacement;
    internal: string;   // 'single' | 'R30→L30' | 'P30→F30'
    classes: ClassLevel[];
    priority: Priority;
    emoji: string;
    hasSplit?: boolean;
    reading?: string; // Phonetic reading for TTS (e.g., "かいきゃく" for "開脚")
    description?: string;
}

export const EXERCISES: Exercise[] = [
    // 準備
    { id: 'S07', name: 'ポイント＆フレックス', sec: 60, placement: 'prep', internal: 'P30・F30', classes: ['プレ', '初級', '中級', '上級'], priority: 'high', emoji: '🦶', description: 'つまさきをピンとのばしたり、ぐっとまげたり。あしのゆびまでバレリーナ！' },
    // ストレッチ
    { id: 'S01', name: '開脚', sec: 30, placement: 'stretch', internal: 'single', classes: ['プレ', '初級', '中級', '上級'], priority: 'high', emoji: '🦵', reading: 'かいきゃく', description: 'あしをひろげてゆかにすわろう。まいにちすこしずつ、もっとひらくよ！' },
    { id: 'S02', name: '前屈', sec: 30, placement: 'stretch', internal: 'single', classes: ['プレ', '初級', '中級', '上級'], priority: 'high', emoji: '🙇', reading: 'ぜんくつ', description: 'あしをまっすぐのばして、まえにたおれよう。あしのうらがのびるかな？' },
    { id: 'S03', name: '前後開脚', sec: 60, placement: 'stretch', internal: 'R30→L30', classes: ['初級', '中級', '上級'], priority: 'medium', emoji: '🩰', hasSplit: true, reading: 'ぜんごかいきゃく', description: 'まえとうしろにあしをひらくスプリッツ。バレリーナのきほんだよ！' },
    { id: 'S05', name: 'アシカさん', sec: 30, placement: 'stretch', internal: 'single', classes: ['プレ', '初級', '中級', '上級'], priority: 'medium', emoji: '🦭', description: 'うつぶせからうでをのばして、アシカさんみたいにむねをそらそう！' },
    { id: 'S06', name: 'ゆりかご', sec: 30, placement: 'stretch', internal: 'single', classes: ['プレ', '初級', '中級', '上級'], priority: 'high', emoji: '🛏️', description: 'せなかをまるくして、ゆらゆらゆれよう。せぼねがほぐれてきもちいいよ！' },
    { id: 'S08', name: 'どんぐり', sec: 30, placement: 'stretch', internal: 'single', classes: ['プレ', '初級', '中級', '上級'], priority: 'medium', emoji: '🌰', description: 'からだをちいさくまるめて、どんぐりみたいにコロコロ。リラックスしよう！' },
    // 体幹
    { id: 'S04', name: 'ブリッジ', sec: 30, placement: 'core', internal: 'single', classes: ['初級', '中級', '上級'], priority: 'medium', emoji: '🌈', description: 'あおむけからグーンとおなかをもちあげよう。ぜんしんのちからをつかうよ！' },
    { id: 'S10', name: 'Y字バランス', sec: 60, placement: 'core', internal: 'R30→L30', classes: ['プレ', '初級', '中級', '上級'], priority: 'medium', emoji: '💃', hasSplit: true, reading: 'わいじばらんす', description: 'かたあしでたって、もうかたほうのあしをたかくあげよう。バランスにちょうせん！' },
    { id: 'C01', name: 'プランク', sec: 30, placement: 'core', internal: 'single', classes: ['プレ', '初級', '中級', '上級'], priority: 'medium', emoji: '💪', description: 'うでとつまさきでからだをまっすぐキープ。おなかにちからをいれてね！' },
    { id: 'C02', name: 'サイドプランク', sec: 60, placement: 'core', internal: 'R30→L30', classes: ['プレ', '初級', '中級', '上級'], priority: 'medium', emoji: '🏋️', hasSplit: true, description: 'よこむきでからだをささえよう。わきばらがつよくなるよ！' },
    // おわり
    { id: 'S09', name: '深呼吸', sec: 30, placement: 'ending', internal: 'single', classes: ['プレ', '初級', '中級', '上級'], priority: 'high', emoji: '🌬️', reading: 'しんこきゅう', description: '深く深呼吸する。' },
    // 休憩（手動メニュー用。おまかせプールには含めない）
    { id: 'R01', name: '休憩5秒', sec: 5, placement: 'rest', internal: 'single', classes: ['プレ', '初級', '中級', '上級'], priority: 'medium', emoji: '💤', reading: 'きゅうけい', description: 'すこしやすんで、つぎにそなえよう！' },
    { id: 'R02', name: '休憩10秒', sec: 10, placement: 'rest', internal: 'single', classes: ['プレ', '初級', '中級', '上級'], priority: 'medium', emoji: '💤', reading: 'きゅうけい', description: 'すこしやすんで、つぎにそなえよう！' },
    { id: 'R03', name: '休憩15秒', sec: 15, placement: 'rest', internal: 'single', classes: ['プレ', '初級', '中級', '上級'], priority: 'medium', emoji: '💤', reading: 'きゅうけい', description: 'すこしやすんで、つぎにそなえよう！' },
];

const SESSION_ORDER: ExercisePlacement[] = ['prep', 'stretch', 'core', 'barre', 'ending'];
const FILL_ORDER: ExercisePlacement[] = ['stretch', 'core', 'barre', 'ending', 'prep'];
const TARGET_COUNTS: Partial<Record<ExercisePlacement, number>> = {
    prep: 1,
    core: 2,
    barre: 1,
    ending: 1,
};

// Get exercise by ID
export function getExerciseById(id: string): Exercise | undefined {
    return EXERCISES.find(e => e.id === id);
}

// Color mapping for exercises
export const EXERCISE_COLORS: Record<string, string> = {
    S01: '#FFE5D9',
    S02: '#D4F0E7',
    S03: '#E8D5F5',
    S04: '#D5E8F5',
    S05: '#FFF3D4',
    S06: '#FFD9E8',
    S07: '#D9F5FF',
    S08: '#E8E5D4',
    S09: '#DFF3FF',
    S10: '#E8F5D9',
    C01: '#D4E8F5',
    C02: '#E5D9FF',
    R01: '#E8F0F5',
    R02: '#E8F0F5',
    R03: '#E8F0F5',
};

export function getExerciseColor(id: string): string {
    return EXERCISE_COLORS[id] || '#F0F3F5';
}

export function getExercisePlacementLabel(placement: ExercisePlacement): string {
    return getPlacementLabel(placement);
}

export function isRestExercise(exercise: Pick<Exercise, 'placement'>): boolean {
    return isRestPlacement(exercise.placement);
}

function createExerciseFromPool(poolExercise: SessionPoolExercise): Exercise {
    return {
        ...poolExercise,
        internal: poolExercise.internal || (poolExercise.hasSplit ? 'R30→L30' : 'single'),
        placement: poolExercise.placement || 'stretch',
        classes: poolExercise.classes || ['プレ', '初級', '中級', '上級'],
        priority: poolExercise.priority || 'medium',
    };
}

function orderStretchExercises(exercises: Exercise[]): Exercise[] {
    const ordered: Exercise[] = [];
    const remaining = [...exercises];

    while (remaining.length > 0) {
        if (ordered.length === 0) {
            ordered.push(remaining.splice(0, 1)[0]);
            continue;
        }

        const lastExercise = ordered[ordered.length - 1];
        let bestIndex = remaining.findIndex((exercise) => exercise.emoji !== lastExercise.emoji);
        if (bestIndex === -1) bestIndex = 0;
        ordered.push(remaining.splice(bestIndex, 1)[0]);
    }

    return ordered;
}

function sumSeconds(exercises: Exercise[]): number {
    return exercises.reduce((sum, exercise) => sum + exercise.sec, 0);
}

function buildAvailableByPlacement(exercises: Exercise[]) {
    return SESSION_ORDER.reduce<Record<ExercisePlacement, Exercise[]>>((acc, placement) => {
        acc[placement] = exercises.filter((exercise) => exercise.placement === placement);
        return acc;
    }, {
        prep: [],
        stretch: [],
        core: [],
        barre: [],
        ending: [],
        rest: [],
    });
}

function getSortWeight(exercise: Exercise, usageCounts: Record<string, number>) {
    // Random slight variance + historical usage weight (lower usage = more likely)
    return Math.random() + (usageCounts[exercise.id] || 0) * 10;
}

function pickPlacementExercises(
    placement: ExercisePlacement,
    availableByPlacement: Record<ExercisePlacement, Exercise[]>,
    requiredIds: string[],
    usageCounts: Record<string, number>,
): Exercise[] {
    const available = availableByPlacement[placement];
    const required = available.filter((exercise) => requiredIds.includes(exercise.id));
    const targetCount = TARGET_COUNTS[placement];

    if (!targetCount) {
        return [...required];
    }

    const selected = [...required];
    const remaining = available
        .filter((exercise) => !requiredIds.includes(exercise.id))
        .sort((a, b) => getSortWeight(a, usageCounts) - getSortWeight(b, usageCounts));

    while (selected.length < targetCount && remaining.length > 0) {
        selected.push(remaining.shift()!);
    }

    return selected;
}

function pushUntilTarget(
    source: Exercise[],
    selected: Exercise[],
    targetSeconds: number,
    currentSecondsRef: { value: number },
) {
    for (const exercise of source) {
        if (currentSecondsRef.value >= targetSeconds) {
            break;
        }
        selected.push(exercise);
        currentSecondsRef.value += exercise.sec;
    }
}

// Get exercises by class level
export function getExercisesByClass(classLevel: ClassLevel): Exercise[] {
    const level = classLevel === 'その他' ? '初級' as ClassLevel : classLevel;
    return EXERCISES.filter(e => e.classes.includes(level) && !isRestExercise(e));
}

// Default Session target duration in seconds (10 minutes)
export const DEFAULT_SESSION_TARGET_SECONDS = 600;

export type SessionPoolExercise =
    Pick<Exercise, 'id' | 'name' | 'sec' | 'emoji'>
    & Partial<Omit<Exercise, 'id' | 'name' | 'sec' | 'emoji'>>;

export interface GenerateSessionOptions {
    excludedIds?: string[];
    requiredIds?: string[];
    targetSeconds?: number;
    customPool?: SessionPoolExercise[];
    historicalCounts?: Record<string, number>;
    /** Override built-in exercises (e.g., with teacher item overrides applied) */
    builtInOverrides?: Exercise[];
}

// Generate a session (list of exercises) for a class
// Required priority always included, high/medium fills remaining time up to target
export function generateSession(classLevel: ClassLevel, options: GenerateSessionOptions = {}): Exercise[] {
    const {
        excludedIds = [],
        requiredIds = [],
        targetSeconds = DEFAULT_SESSION_TARGET_SECONDS,
        customPool = [],
        historicalCounts = {},
        builtInOverrides,
    } = options;

    const baseExercises = builtInOverrides
        ? builtInOverrides.filter(e => e.classes.includes(classLevel === 'その他' ? '初級' : classLevel))
        : getExercisesByClass(classLevel);
    const allAvailable = [
        ...baseExercises,
        ...customPool.map(createExerciseFromPool),
    ];

    let filtered = allAvailable.filter(exercise => !excludedIds.includes(exercise.id));
    if (filtered.length < 3) {
        filtered = allAvailable;
    }

    const availableByPlacement = buildAvailableByPlacement(filtered);
    const selectedPrep = pickPlacementExercises('prep', availableByPlacement, requiredIds, historicalCounts);
    const selectedCore = pickPlacementExercises('core', availableByPlacement, requiredIds, historicalCounts);
    const selectedBarre = pickPlacementExercises('barre', availableByPlacement, requiredIds, historicalCounts);
    const selectedEnding = pickPlacementExercises('ending', availableByPlacement, requiredIds, historicalCounts);

    const requiredStretch = availableByPlacement.stretch.filter((exercise) => requiredIds.includes(exercise.id));
    const selectedStretch = [...requiredStretch];

    const currentSecondsRef = {
        value: sumSeconds([...selectedPrep, ...selectedCore, ...selectedBarre, ...selectedEnding, ...selectedStretch]),
    };

    const remainingStretch = availableByPlacement.stretch.filter((exercise) => !requiredIds.includes(exercise.id));
    const highStretch = remainingStretch
        .filter((exercise) => exercise.priority === 'high')
        .sort((a, b) => getSortWeight(a, historicalCounts) - getSortWeight(b, historicalCounts));
    const mediumStretch = remainingStretch
        .filter((exercise) => exercise.priority === 'medium')
        .sort((a, b) => getSortWeight(a, historicalCounts) - getSortWeight(b, historicalCounts));

    pushUntilTarget(highStretch, selectedStretch, targetSeconds, currentSecondsRef);
    pushUntilTarget(mediumStretch, selectedStretch, targetSeconds, currentSecondsRef);

    if (currentSecondsRef.value < targetSeconds) {
        const alreadySelectedIds = new Set(
            [...selectedPrep, ...selectedStretch, ...selectedCore, ...selectedBarre, ...selectedEnding].map((exercise) => exercise.id)
        );

        for (const placement of FILL_ORDER) {
            const unused = availableByPlacement[placement]
                .filter((exercise) => !alreadySelectedIds.has(exercise.id))
                .sort((a, b) => getSortWeight(a, historicalCounts) - getSortWeight(b, historicalCounts));

            pushUntilTarget(unused, placement === 'stretch' ? selectedStretch : placement === 'core' ? selectedCore : placement === 'barre' ? selectedBarre : placement === 'ending' ? selectedEnding : selectedPrep, targetSeconds, currentSecondsRef);

            if (currentSecondsRef.value >= targetSeconds) {
                break;
            }
        }
    }

    if (currentSecondsRef.value < targetSeconds) {
        const countMap = new Map<string, number>();
        for (const exercise of [...selectedPrep, ...selectedStretch, ...selectedCore, ...selectedBarre, ...selectedEnding]) {
            countMap.set(exercise.id, (countMap.get(exercise.id) || 0) + 1);
        }

        for (const placement of FILL_ORDER) {
            const canRepeat = availableByPlacement[placement]
                .filter((exercise) => (countMap.get(exercise.id) || 0) < 2)
                .sort((a, b) => getSortWeight(a, historicalCounts) - getSortWeight(b, historicalCounts));

            const targetList = placement === 'stretch'
                ? selectedStretch
                : placement === 'core'
                    ? selectedCore
                    : placement === 'barre'
                        ? selectedBarre
                        : placement === 'ending'
                            ? selectedEnding
                            : selectedPrep;

            for (const exercise of canRepeat) {
                if (currentSecondsRef.value >= targetSeconds) {
                    break;
                }

                const nextCount = (countMap.get(exercise.id) || 0) + 1;
                countMap.set(exercise.id, nextCount);
                targetList.push(exercise);
                currentSecondsRef.value += exercise.sec;
            }

            if (currentSecondsRef.value >= targetSeconds) {
                break;
            }
        }
    }

    const session = [
        ...selectedPrep,
        ...orderStretchExercises(selectedStretch),
        ...selectedCore,
        ...selectedBarre,
        ...selectedEnding,
    ];

    // Auto-insert rest breaks every 5 minutes
    const REST_INTERVAL = 300;
    const restExercise = EXERCISES.find(e => e.id === 'R03')!;
    const withRests: Exercise[] = [];
    let accumulated = 0;
    for (const exercise of session) {
        withRests.push(exercise);
        accumulated += exercise.sec;
        if (accumulated >= REST_INTERVAL) {
            withRests.push(restExercise);
            accumulated = 0;
        }
    }

    if (withRests.length > 0 && isRestExercise(withRests[withRests.length - 1])) {
        withRests.pop();
    }

    return withRests;
}

// Get a replacement exercise when skipping
export function getReplacementExercise(classLevel: ClassLevel, currentSessionIds: string[], targetSec: number): Exercise | null {
    const available = getExercisesByClass(classLevel).filter(
        (exercise) => !currentSessionIds.includes(exercise.id) && exercise.placement === 'stretch'
    );
    const match = available.find(exercise => exercise.sec === targetSec) || available[0];
    return match || null;
}

// Generate a session from specific exercise IDs
export function generateSessionFromIds(ids: string[]): Exercise[] {
    return ids
        .map(id => getExerciseById(id))
        .filter((exercise): exercise is Exercise => exercise !== undefined);
}

// Calculate total seconds for a list of exercise IDs
export function calculateTotalSeconds(ids: string[]): number {
    return ids.reduce((total, id) => {
        const exercise = getExerciseById(id);
        return total + (exercise?.sec || 0);
    }, 0);
}
