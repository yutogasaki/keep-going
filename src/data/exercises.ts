// Stretch & Core exercise master data from specification

export type ExerciseType = 'stretch' | 'core' | 'rest';
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

export type ExercisePhase = 'warmup' | 'main' | 'core' | 'rest';

export interface Exercise {
    id: string;
    name: string;
    sec: number;
    type: ExerciseType;
    internal: string;   // 'single' | 'R30→L30' | 'P30→F30'
    classes: ClassLevel[];
    priority: Priority;
    emoji: string;
    hasSplit?: boolean;
    phase: ExercisePhase;
    reading?: string; // Phonetic reading for TTS (e.g., "かいきゃく" for "開脚")
    description?: string;
}

export const EXERCISES: Exercise[] = [
    // Stretches (Warmups)
    { id: 'S07', name: 'ポイント＆フレックス', sec: 60, type: 'stretch', internal: 'P30・F30', classes: ['プレ', '初級', '中級', '上級'], priority: 'high', emoji: '🦶', phase: 'warmup', description: 'つまさきをピンとのばしたり、ぐっとまげたり。あしのゆびまでバレリーナ！' },
    { id: 'S06', name: 'ゆりかご', sec: 30, type: 'stretch', internal: 'single', classes: ['プレ', '初級', '中級', '上級'], priority: 'high', emoji: '🛏️', phase: 'warmup', description: 'せなかをまるくして、ゆらゆらゆれよう。せぼねがほぐれてきもちいいよ！' },
    { id: 'S08', name: 'どんぐり', sec: 30, type: 'stretch', internal: 'single', classes: ['プレ', '初級', '中級', '上級'], priority: 'medium', emoji: '🌰', phase: 'warmup', description: 'からだをちいさくまるめて、どんぐりみたいにコロコロ。リラックスしよう！' },
    // Stretches (Main)
    { id: 'S01', name: '開脚', sec: 30, type: 'stretch', internal: 'single', classes: ['プレ', '初級', '中級', '上級'], priority: 'high', emoji: '🦵', phase: 'main', reading: 'かいきゃく', description: 'あしをひろげてゆかにすわろう。まいにちすこしずつ、もっとひらくよ！' },
    { id: 'S02', name: '前屈', sec: 30, type: 'stretch', internal: 'single', classes: ['プレ', '初級', '中級', '上級'], priority: 'high', emoji: '🙇', phase: 'main', reading: 'ぜんくつ', description: 'あしをまっすぐのばして、まえにたおれよう。あしのうらがのびるかな？' },
    { id: 'S03', name: '前後開脚', sec: 60, type: 'stretch', internal: 'R30→L30', classes: ['初級', '中級', '上級'], priority: 'medium', emoji: '🩰', phase: 'main', hasSplit: true, reading: 'ぜんごかいきゃく', description: 'まえとうしろにあしをひらくスプリッツ。バレリーナのきほんだよ！' },
    { id: 'S05', name: 'アシカさん', sec: 30, type: 'stretch', internal: 'single', classes: ['プレ', '初級', '中級', '上級'], priority: 'medium', emoji: '🦭', phase: 'main', description: 'うつぶせからうでをのばして、アシカさんみたいにむねをそらそう！' },
    // Core & Balance
    { id: 'S04', name: 'ブリッジ', sec: 30, type: 'stretch', internal: 'single', classes: ['初級', '中級', '上級'], priority: 'medium', emoji: '🌈', phase: 'core', description: 'あおむけからグーンとおなかをもちあげよう。ぜんしんのちからをつかうよ！' },
    { id: 'S10', name: 'Y字バランス', sec: 60, type: 'stretch', internal: 'R30→L30', classes: ['プレ', '初級', '中級', '上級'], priority: 'medium', emoji: '💃', phase: 'core', hasSplit: true, reading: 'わいじばらんす', description: 'かたあしでたって、もうかたほうのあしをたかくあげよう。バランスにちょうせん！' },
    { id: 'C01', name: 'プランク', sec: 30, type: 'core', internal: 'single', classes: ['プレ', '初級', '中級', '上級'], priority: 'medium', emoji: '💪', phase: 'core', description: 'うでとつまさきでからだをまっすぐキープ。おなかにちからをいれてね！' },
    { id: 'C02', name: 'サイドプランク', sec: 60, type: 'core', internal: 'R30→L30', classes: ['プレ', '初級', '中級', '上級'], priority: 'medium', emoji: '🏋️', phase: 'core', hasSplit: true, description: 'よこむきでからだをささえよう。わきばらがつよくなるよ！' },
    // Rest (for custom menus; excluded from おまかせ pool)
    { id: 'R01', name: '休憩5秒', sec: 5, type: 'rest', internal: 'single', classes: ['プレ', '初級', '中級', '上級'], priority: 'medium', emoji: '💤', phase: 'rest', reading: 'きゅうけい', description: 'すこしやすんで、つぎにそなえよう！' },
    { id: 'R02', name: '休憩10秒', sec: 10, type: 'rest', internal: 'single', classes: ['プレ', '初級', '中級', '上級'], priority: 'medium', emoji: '💤', phase: 'rest', reading: 'きゅうけい', description: 'すこしやすんで、つぎにそなえよう！' },
    { id: 'R03', name: '休憩15秒', sec: 15, type: 'rest', internal: 'single', classes: ['プレ', '初級', '中級', '上級'], priority: 'medium', emoji: '💤', phase: 'rest', reading: 'きゅうけい', description: 'すこしやすんで、つぎにそなえよう！' },
];

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

// Get exercises by class level
export function getExercisesByClass(classLevel: ClassLevel): Exercise[] {
    const level = classLevel === 'その他' ? '初級' as ClassLevel : classLevel;
    return EXERCISES.filter(e => e.classes.includes(level) && e.type !== 'rest');
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

    const usageCounts = historicalCounts;

    const baseExercises = builtInOverrides
        ? builtInOverrides.filter(e => e.classes.includes(classLevel === 'その他' ? '初級' : classLevel))
        : getExercisesByClass(classLevel);
    // Merge base exercises with custom exercises. Ensure custom exercises have 'main' phase and 'stretch' type as defaults.
    const allAvailable: Exercise[] = [
        ...baseExercises,
        ...customPool.map((c) => ({
            ...c,
            internal: c.internal || (c.hasSplit ? 'R30→L30' : 'single'),
            phase: c.phase || 'main',
            type: c.type || 'stretch',
            classes: c.classes || ['プレ', '初級', '中級', '上級'],
            priority: c.priority || 'medium',
        })),
    ];

    // Filter out excluded IDs (like those already done today)
    let filtered = allAvailable.filter(e => !excludedIds.includes(e.id));

    // If we've exhausted everything (user did ALL exercises today), reset and use everything
    if (filtered.length < 3) {
        filtered = allAvailable;
    }

    // Split by phases
    const availableWarmups = filtered.filter(e => e.phase === 'warmup');
    const availableMain = filtered.filter(e => e.phase === 'main');
    const availableCore = filtered.filter(e => e.phase === 'core');

    // Filter Required exercises
    const requiredWarmups = availableWarmups.filter(e => requiredIds.includes(e.id));
    const requiredMain = availableMain.filter(e => requiredIds.includes(e.id));
    const requiredCore = availableCore.filter(e => requiredIds.includes(e.id));

    const getSortWeight = (e: Exercise) => {
        // Random slight variance + historical usage weight (lower usage = more likely)
        return Math.random() + (usageCounts[e.id] || 0) * 10;
    };

    // 1. Pick Warmup (aim for 1-2, prioritize required)
    const selectedWarmup = [...requiredWarmups];
    const remainingWarmups = availableWarmups.filter(e => !requiredIds.includes(e.id)).sort((a, b) => getSortWeight(a) - getSortWeight(b));
    while (selectedWarmup.length < 2 && remainingWarmups.length > 0) {
        selectedWarmup.push(remainingWarmups.shift()!);
    }
    let currentSec = selectedWarmup.reduce((sum, e) => sum + e.sec, 0);

    // 2. Pick Core/Balance (aim for 2, prioritize required) to put at the very end
    const selectedCore = [...requiredCore];
    const remainingCore = availableCore.filter(e => !requiredIds.includes(e.id)).sort((a, b) => getSortWeight(a) - getSortWeight(b));
    while (selectedCore.length < 2 && remainingCore.length > 0) {
        selectedCore.push(remainingCore.shift()!);
    }
    currentSec += selectedCore.reduce((sum, e) => sum + e.sec, 0);

    // 3. Pick Main Stretches to fill the rest up to target
    const selectedMain: Exercise[] = [...requiredMain];
    currentSec += requiredMain.reduce((sum, e) => sum + e.sec, 0);

    // High priority first for remaining main stretches
    const remainingMain = availableMain.filter(e => !requiredIds.includes(e.id));
    const highMain = remainingMain.filter(e => e.priority === 'high').sort((a, b) => getSortWeight(a) - getSortWeight(b));
    const mediumMain = remainingMain.filter(e => e.priority === 'medium').sort((a, b) => getSortWeight(a) - getSortWeight(b));

    for (const ex of highMain) {
        if (currentSec >= targetSeconds) break;
        selectedMain.push(ex);
        currentSec += ex.sec;
    }

    for (const ex of mediumMain) {
        if (currentSec >= targetSeconds) break;
        selectedMain.push(ex);
        currentSec += ex.sec;
    }

    // If still under time, add exercises that haven't been selected yet (each max 2 appearances)
    if (currentSec < targetSeconds && availableMain.length > 0) {
        const alreadySelectedIds = new Set(selectedMain.map(e => e.id));
        // First: add exercises not yet used at all
        const unused = availableMain.filter(e => !alreadySelectedIds.has(e.id)).sort((a, b) => getSortWeight(a) - getSortWeight(b));
        for (const ex of unused) {
            if (currentSec >= targetSeconds) break;
            selectedMain.push(ex);
            currentSec += ex.sec;
        }
        // Still short? Allow each exercise to appear at most twice total
        if (currentSec < targetSeconds) {
            const countMap = new Map<string, number>();
            for (const e of selectedMain) countMap.set(e.id, (countMap.get(e.id) || 0) + 1);
            const canRepeat = availableMain.filter(e => (countMap.get(e.id) || 0) < 2).sort((a, b) => getSortWeight(a) - getSortWeight(b));
            for (const ex of canRepeat) {
                if (currentSec >= targetSeconds) break;
                selectedMain.push(ex);
                currentSec += ex.sec;
            }
        }
    }

    // Smart ordering for Main phase (avoid consecutive same emojis/body parts if possible)
    const orderedMain: Exercise[] = [];
    const remaining = [...selectedMain];

    while (remaining.length > 0) {
        if (orderedMain.length === 0) {
            orderedMain.push(remaining.splice(0, 1)[0]);
            continue;
        }
        const lastEx = orderedMain[orderedMain.length - 1];
        let bestIdx = remaining.findIndex(e => e.emoji !== lastEx.emoji);
        if (bestIdx === -1) bestIdx = 0;
        orderedMain.push(remaining.splice(bestIdx, 1)[0]);
    }

    // Combine: Warmup -> Main -> Core
    const session = [...selectedWarmup, ...orderedMain, ...selectedCore];

    // Auto-insert rest breaks every 5 minutes
    const REST_INTERVAL = 300;
    const restExercise = EXERCISES.find(e => e.id === 'R03')!;
    const withRests: Exercise[] = [];
    let accumulated = 0;
    for (const ex of session) {
        withRests.push(ex);
        accumulated += ex.sec;
        if (accumulated >= REST_INTERVAL) {
            withRests.push(restExercise);
            accumulated = 0;
        }
    }
    // Remove trailing rest
    if (withRests.length > 0 && withRests[withRests.length - 1].type === 'rest') {
        withRests.pop();
    }

    return withRests;
}

// Get a replacement exercise when skipping
export function getReplacementExercise(classLevel: ClassLevel, currentSessionIds: string[], targetSec: number): Exercise | null {
    const available = getExercisesByClass(classLevel).filter(e => !currentSessionIds.includes(e.id) && e.type === 'stretch');
    // Try to find one that exactly matches the skipped time, otherwise just take any
    const match = available.find(e => e.sec === targetSec) || available[0];
    return match || null;
}

// Generate a session from specific exercise IDs
export function generateSessionFromIds(ids: string[]): Exercise[] {
    return ids
        .map(id => getExerciseById(id))
        .filter((e): e is Exercise => e !== undefined);
}

// Calculate total seconds for a list of exercise IDs
export function calculateTotalSeconds(ids: string[]): number {
    return ids.reduce((total, id) => {
        const ex = getExerciseById(id);
        return total + (ex?.sec || 0);
    }, 0);
}
