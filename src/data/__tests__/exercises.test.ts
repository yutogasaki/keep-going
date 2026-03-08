import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    generateSession,
    getExercisesByClass,
    getExerciseById,
    EXERCISES,
    type Exercise,
    type ClassLevel,
} from '../exercises';

// Seed Math.random for deterministic tests where needed
let randomSeed = 0;
function seededRandom(): number {
    randomSeed = (randomSeed * 16807 + 0) % 2147483647;
    return randomSeed / 2147483647;
}

function seedRandom(seed: number) {
    randomSeed = seed;
    vi.spyOn(Math, 'random').mockImplementation(seededRandom);
}

beforeEach(() => {
    vi.restoreAllMocks();
});

// ─── Helper ───────────────────────────────────────────

function makeCustomExercise(overrides: Partial<Exercise> & { id: string; name: string; sec: number; emoji: string }) {
    return overrides;
}

function totalSeconds(session: Exercise[]): number {
    return session.reduce((sum, e) => sum + e.sec, 0);
}

// ─── getExercisesByClass ──────────────────────────────

describe('getExercisesByClass', () => {
    it('初級にはプレ/初級の種目が含まれる', () => {
        const result = getExercisesByClass('初級');
        expect(result.length).toBeGreaterThan(0);
        result.forEach(e => {
            expect(e.classes).toContain('初級');
        });
    });

    it('上級のみの種目は初級に含まれない', () => {
        const upperOnly = EXERCISES.filter(e => e.classes.includes('上級') && !e.classes.includes('初級'));
        const result = getExercisesByClass('初級');
        const resultIds = new Set(result.map(e => e.id));
        upperOnly.forEach(e => {
            expect(resultIds.has(e.id)).toBe(false);
        });
    });

    it('その他は初級と同じ結果を返す', () => {
        const other = getExercisesByClass('その他');
        const beginner = getExercisesByClass('初級');
        expect(other.map(e => e.id).sort()).toEqual(beginner.map(e => e.id).sort());
    });
});

// ─── generateSession: 基本不変条件 ───────────────────

describe('generateSession', () => {
    const classLevel: ClassLevel = '初級';

    it('空でないセッションを返す', () => {
        seedRandom(42);
        const session = generateSession(classLevel);
        expect(session.length).toBeGreaterThan(0);
    });

    it('配置順序: 準備 → ストレッチ → 体幹 → バー → おわり', () => {
        seedRandom(123);
        const session = generateSession(classLevel);

        let lastPlacementOrder = -1;
        const placementOrder: Record<string, number> = { prep: 0, stretch: 1, core: 2, barre: 3, ending: 4, rest: 5 };

        for (const ex of session) {
            if (ex.placement === 'rest') continue;
            const order = placementOrder[ex.placement] ?? 1;
            expect(order).toBeGreaterThanOrEqual(lastPlacementOrder);
            if (order > lastPlacementOrder) lastPlacementOrder = order;
        }
    });

    it('デフォルト目標600秒に対して合理的な範囲内', () => {
        seedRandom(456);
        const session = generateSession(classLevel);
        const total = totalSeconds(session);
        // 目標600秒に対して±50%以内（フェーズごとの最低数制約あり）
        expect(total).toBeGreaterThan(300);
        expect(total).toBeLessThan(1200);
    });

    it('targetSeconds指定で調整される', () => {
        seedRandom(789);
        const shortSession = generateSession(classLevel, { targetSeconds: 120 });
        const longSession = generateSession(classLevel, { targetSeconds: 1800 });

        expect(totalSeconds(shortSession)).toBeLessThan(totalSeconds(longSession));
    });

    // ─── 必須/除外 ─────────────────────────────────

    it('requiredIdsの種目が必ず含まれる', () => {
        seedRandom(111);
        const stretchExercise = EXERCISES.find(e => e.classes.includes('初級') && e.placement === 'stretch')!;
        const session = generateSession(classLevel, {
            requiredIds: [stretchExercise.id],
        });

        const ids = session.map(e => e.id);
        expect(ids).toContain(stretchExercise.id);
    });

    it('excludedIdsの種目が含まれない', () => {
        seedRandom(222);
        const exerciseToExclude = EXERCISES.find(e => e.classes.includes('初級') && e.placement === 'stretch')!;
        const session = generateSession(classLevel, {
            excludedIds: [exerciseToExclude.id],
        });

        const ids = session.map(e => e.id);
        expect(ids).not.toContain(exerciseToExclude.id);
    });

    it('全種目を除外しても最低限のセッションが返る（フォールバック）', () => {
        seedRandom(333);
        const allIds = EXERCISES.map(e => e.id);
        const session = generateSession(classLevel, {
            excludedIds: allIds,
        });

        // フォールバック: filtered.length < 3 で全種目リセット
        expect(session.length).toBeGreaterThan(0);
    });

    // ─── customPool ─────────────────────────────────

    it('customPoolの種目がセッションに含まれうる', () => {
        seedRandom(444);
        const customEx = makeCustomExercise({
            id: 'custom-1',
            name: 'テスト種目',
            sec: 30,
            emoji: '🎯',
        });

        // 必須にして確実に含まれるようにする
        const session = generateSession(classLevel, {
            customPool: [customEx],
            requiredIds: ['custom-1'],
        });

        const ids = session.map(e => e.id);
        expect(ids).toContain('custom-1');
    });

    it('customPoolの種目にデフォルトplacementが付与される', () => {
        seedRandom(555);
        const customEx = makeCustomExercise({
            id: 'custom-2',
            name: 'カスタム',
            sec: 60,
            emoji: '✨',
        });

        const session = generateSession(classLevel, {
            customPool: [customEx],
            requiredIds: ['custom-2'],
        });

        const found = session.find(e => e.id === 'custom-2')!;
        expect(found).toBeDefined();
        expect(found.placement).toBe('stretch');
    });

    // ─── builtInOverrides ───────────────────────────

    it('builtInOverridesが適用される', () => {
        seedRandom(666);
        const overridden = EXERCISES.map(e => {
            if (e.id === 'S01') {
                return { ...e, name: 'オーバーライド開脚', sec: 999 };
            }
            return e;
        });

        const session = generateSession(classLevel, {
            builtInOverrides: overridden,
            requiredIds: ['S01'],
        });

        const found = session.find(e => e.id === 'S01')!;
        expect(found).toBeDefined();
        expect(found.name).toBe('オーバーライド開脚');
        expect(found.sec).toBe(999);
    });

    // ─── スマートオーダリング ────────────────────────

    it('ストレッチ配置で連続同一emojiを可能な限り回避', () => {
        seedRandom(777);
        const session = generateSession(classLevel, { targetSeconds: 600 });
        const stretchExercises = session.filter(e => e.placement === 'stretch');

        if (stretchExercises.length < 3) return; // 少なすぎる場合はスキップ

        let consecutiveCount = 0;
        for (let i = 1; i < stretchExercises.length; i++) {
            if (stretchExercises[i].emoji === stretchExercises[i - 1].emoji) {
                consecutiveCount++;
            }
        }

        // 全種目のユニークemoji数
        const uniqueEmojis = new Set(stretchExercises.map(e => e.emoji)).size;
        // emoji種類が2以上あれば、連続は半分未満であるべき
        if (uniqueEmojis >= 2) {
            expect(consecutiveCount).toBeLessThan(stretchExercises.length / 2);
        }
    });

    // ─── historicalCounts ───────────────────────────

    it('historicalCountsが高い種目は選ばれにくい（統計的テスト）', () => {
        // 10回生成して、使用回数が多い種目の出現率を確認
        const stretchExercises = EXERCISES.filter(e => e.classes.includes('初級') && e.placement === 'stretch');
        if (stretchExercises.length < 2) return;

        const heavilyUsed = stretchExercises[0].id;
        const lightlyUsed = stretchExercises[1].id;

        let heavyCount = 0;
        let lightCount = 0;

        for (let i = 0; i < 20; i++) {
            seedRandom(i * 100);
            const session = generateSession(classLevel, {
                historicalCounts: { [heavilyUsed]: 100 },
                targetSeconds: 600,
            });
            const ids = session.map(e => e.id);
            if (ids.includes(heavilyUsed)) heavyCount++;
            if (ids.includes(lightlyUsed)) lightCount++;
        }

        // 使用回数が少ない種目の方が多く選ばれるはず
        // （必須扱いでない限り）
        expect(lightCount).toBeGreaterThanOrEqual(heavyCount);
    });

    // ─── 繰り返し上限 ──────────────────────────────

    it('同一種目は最大2回まで（rest除く）', () => {
        seedRandom(888);
        // 非常に長い目標で繰り返しを強制
        const session = generateSession(classLevel, { targetSeconds: 3600 });

        const countMap = new Map<string, number>();
        for (const e of session) {
            if (e.placement === 'rest') continue; // rest is auto-inserted, not counted
            countMap.set(e.id, (countMap.get(e.id) || 0) + 1);
        }

        for (const [, count] of countMap) {
            expect(count).toBeLessThanOrEqual(2);
        }
    });

    it('rest種目はおまかせプールに含まれない', () => {
        seedRandom(100);
        const session = generateSession(classLevel, { targetSeconds: 200 });
        // 5分未満のセッションでは自動休憩なし → rest種目が入らない
        const restExercises = session.filter(e => e.placement === 'rest');
        expect(restExercises.length).toBe(0);
    });

    it('5分超のセッションで休憩が自動挿入される', () => {
        seedRandom(42);
        const session = generateSession(classLevel, { targetSeconds: 600 });
        const restExercises = session.filter(e => e.placement === 'rest');
        expect(restExercises.length).toBeGreaterThanOrEqual(1);
        // All auto-inserted rests should be R03 (15秒)
        for (const r of restExercises) {
            expect(r.id).toBe('R03');
        }
    });

    it('セッション末尾が休憩にならない', () => {
        seedRandom(77);
        const session = generateSession(classLevel, { targetSeconds: 600 });
        expect(session[session.length - 1].placement).not.toBe('rest');
    });
});

// ─── getExerciseById ──────────────────────────────────

describe('getExerciseById', () => {
    it('存在するIDで種目を返す', () => {
        const result = getExerciseById('S01');
        expect(result).toBeDefined();
        expect(result!.name).toBe('開脚');
    });

    it('存在しないIDでundefinedを返す', () => {
        const result = getExerciseById('nonexistent');
        expect(result).toBeUndefined();
    });
});
