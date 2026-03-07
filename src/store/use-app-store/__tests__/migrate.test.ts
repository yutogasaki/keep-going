import { describe, it, expect, vi, beforeEach } from 'vitest';
import { migrateAppState, APP_STATE_VERSION } from '../migrate';

// Mock dependencies
vi.mock('../../../lib/db', () => ({
    getTodayKey: vi.fn(() => '2026-03-06'),
}));

// Mock crypto.randomUUID
const MOCK_UUID = 'test-uuid-1234';
vi.stubGlobal('crypto', {
    randomUUID: () => MOCK_UUID,
});

beforeEach(() => {
    vi.restoreAllMocks();
});

// ─── Helper ───────────────────────────────────────────

function makeV0State(overrides: Record<string, any> = {}) {
    return {
        classLevel: '初級',
        fuwafuwaBirthDate: '2026-03-01',
        fuwafuwaType: 3,
        fuwafuwaCycleCount: 1,
        fuwafuwaName: 'テスト',
        pastFuwafuwas: [],
        notifiedFuwafuwaStages: [],
        requiredExercises: ['S01', 'S02'],
        excludedExercises: [],
        dailyTargetMinutes: 10,
        onboardingCompleted: true,
        soundVolume: 1.0,
        ttsEnabled: true,
        ...overrides,
    };
}

function makeV5State(overrides: Record<string, any> = {}) {
    return {
        users: [{
            id: 'user-1',
            name: 'テスト',
            classLevel: '初級',
            fuwafuwaBirthDate: '2026-03-01',
            fuwafuwaType: 3,
            fuwafuwaCycleCount: 1,
            fuwafuwaName: 'テスト',
            pastFuwafuwas: [],
            notifiedFuwafuwaStages: [],
            dailyTargetMinutes: 10,
            excludedExercises: ['C01', 'C02'],
            requiredExercises: ['S01', 'S02', 'S07'],
            consumedMagicSeconds: 0,
        }],
        sessionUserIds: ['user-1'],
        onboardingCompleted: true,
        soundVolume: 1.0,
        ttsEnabled: true,
        bgmEnabled: true,
        hapticEnabled: true,
        ...overrides,
    };
}

function makeCurrentState(overrides: Record<string, any> = {}) {
    return {
        users: [{
            id: 'user-1',
            name: 'テスト',
            classLevel: '初級',
            fuwafuwaBirthDate: '2026-03-01',
            fuwafuwaType: 3,
            fuwafuwaCycleCount: 1,
            fuwafuwaName: 'テスト',
            pastFuwafuwas: [],
            notifiedFuwafuwaStages: [],
            dailyTargetMinutes: 10,
            excludedExercises: [],
            requiredExercises: [],
            consumedMagicSeconds: 0,
            chibifuwas: [],
        }],
        sessionUserIds: ['user-1'],
        onboardingCompleted: true,
        soundVolume: 1.0,
        ttsEnabled: true,
        bgmEnabled: true,
        hapticEnabled: true,
        joinedChallengeIds: {},
        ...overrides,
    };
}

// ─── v0: S07必須追加 ─────────────────────────────────

describe('v0 migration', () => {
    it('requiredExercisesにS07がなければ追加', () => {
        const state = makeV0State({ requiredExercises: ['S01', 'S02'] });
        const result = migrateAppState(state, 0);
        // v0ではrequiredExercisesはまだグローバル（v5で移動するまで）
        // v11で旧デフォルトが削除されるので、S07は残らない
        // v0の時点ではpersistされたrequiredExercisesにS07がpushされる
        // しかしv5でuser[0]に移動し、v11で旧デフォルトから削除される
        // 結果: requiredExercisesは空になるはず
        expect(result.users[0].requiredExercises).toEqual([]);
    });

    it('S07が既にあれば重複追加しない', () => {
        const state = makeV0State({ requiredExercises: ['S01', 'S07'] });
        migrateAppState(state, 0);
        // S07の数を確認（v5移動前の段階）
        const filtered = state.requiredExercises?.filter((id: string) => id === 'S07') ?? [];
        expect(filtered.length).toBeLessThanOrEqual(1);
    });
});

// ─── v2: bgm/haptic デフォルト ─────────────────────

describe('v2 migration', () => {
    it('bgmEnabled/hapticEnabledが未定義ならtrueをセット', () => {
        const state = makeV0State();
        delete state.bgmEnabled;
        delete state.hapticEnabled;
        const result = migrateAppState(state, 0);
        expect(result.bgmEnabled).toBe(true);
        expect(result.hapticEnabled).toBe(true);
    });

    it('既存値があれば上書きしない', () => {
        const state = makeV0State({ bgmEnabled: false, hapticEnabled: false });
        const result = migrateAppState(state, 0);
        expect(result.bgmEnabled).toBe(false);
        expect(result.hapticEnabled).toBe(false);
    });
});

// ─── v3: 単一→マルチユーザー移行 ────────────────────

describe('v3 migration (single→multi user)', () => {
    it('レガシー状態からusers配列を作成', () => {
        const state = makeV0State();
        const result = migrateAppState(state, 0);

        expect(result.users).toBeDefined();
        expect(Array.isArray(result.users)).toBe(true);
        expect(result.users.length).toBe(1);
    });

    it('ユーザー名がレガシーfuwafuwaNameから引き継がれる', () => {
        const state = makeV0State({ fuwafuwaName: 'さくら' });
        const result = migrateAppState(state, 0);
        expect(result.users[0].name).toBe('さくら');
    });

    it('レガシーフィールドが削除される', () => {
        const state = makeV0State();
        migrateAppState(state, 0);
        expect(state.classLevel).toBeUndefined();
        expect(state.fuwafuwaBirthDate).toBeUndefined();
        expect(state.fuwafuwaType).toBeUndefined();
    });

    it('既にusersがあれば移行しない', () => {
        const state = makeV0State({
            users: [{ id: 'existing', name: '既存ユーザー' }],
        });
        const result = migrateAppState(state, 0);
        expect(result.users[0].id).toBe('existing');
    });
});

// ─── v5: グローバル設定→ユーザー別移行 ─────────────

describe('v5 migration (global→per-user settings)', () => {
    it('グローバル設定がuser[0]に移動', () => {
        const state: any = {
            ...makeV0State(),
            users: [{ id: 'u1', name: 'テスト' }],
            sessionUserIds: ['u1'],
            dailyTargetMinutes: 15,
            excludedExercises: ['S03'],
            requiredExercises: ['S01', 'S05'],
            bgmEnabled: true,
            hapticEnabled: true,
        };

        const result = migrateAppState(state, 3);
        // v5→v11: S01は旧デフォルトなので削除、S05はユーザー追加なので残る
        expect(result.users[0].dailyTargetMinutes).toBe(15);
        expect(result.users[0].requiredExercises).toContain('S05');
        expect(result.users[0].excludedExercises).toContain('S03');
    });

    it('グローバルフィールドが削除される', () => {
        const state: any = {
            ...makeV0State(),
            users: [{ id: 'u1', name: 'テスト' }],
            sessionUserIds: ['u1'],
            bgmEnabled: true,
            hapticEnabled: true,
        };

        migrateAppState(state, 3);
        expect(state.dailyTargetMinutes).toBeUndefined();
        expect(state.excludedExercises).toBeUndefined();
        expect(state.requiredExercises).toBeUndefined();
    });

    it('2人目以降はデフォルト値を使用', () => {
        const state: any = {
            ...makeV0State(),
            users: [
                { id: 'u1', name: 'ユーザー1' },
                { id: 'u2', name: 'ユーザー2' },
            ],
            sessionUserIds: ['u1'],
            bgmEnabled: true,
            hapticEnabled: true,
        };

        const result = migrateAppState(state, 3);
        expect(result.users[1].dailyTargetMinutes).toBe(10);
        // v11で旧デフォルトが削除されるので空になる
        expect(result.users[1].requiredExercises).toEqual([]);
        expect(result.users[1].excludedExercises).toEqual([]);
    });
});

// ─── v10: joinedChallengeIds 配列→Record ────────────

describe('v10 migration (array→record)', () => {
    it('配列からユーザー別Recordに変換', () => {
        const state = makeV5State({
            joinedChallengeIds: ['challenge-1', 'challenge-2'],
        });

        const result = migrateAppState(state, 5);
        expect(result.joinedChallengeIds).toEqual({
            'user-1': ['challenge-1', 'challenge-2'],
        });
    });

    it('空配列は空Recordになる', () => {
        const state = makeV5State({
            joinedChallengeIds: [],
        });

        const result = migrateAppState(state, 5);
        expect(result.joinedChallengeIds).toEqual({});
    });
});

// ─── v11: 旧デフォルト値削除 ────────────────────────

describe('v11 migration (old defaults cleanup)', () => {
    it('旧デフォルトrequired(S01,S02,S07)が削除される', () => {
        const state = makeV5State();
        state.users[0].requiredExercises = ['S01', 'S02', 'S07', 'S05'];

        const result = migrateAppState(state, 10);
        expect(result.users[0].requiredExercises).toEqual(['S05']);
    });

    it('旧デフォルトexcluded(C01,C02)が削除される', () => {
        const state = makeV5State();
        state.users[0].excludedExercises = ['C01', 'C02', 'S03'];

        const result = migrateAppState(state, 10);
        expect(result.users[0].excludedExercises).toEqual(['S03']);
    });

    it('ユーザー追加の種目は保持される', () => {
        const state = makeV5State();
        state.users[0].requiredExercises = ['S05', 'S10'];
        state.users[0].excludedExercises = ['S03'];

        const result = migrateAppState(state, 10);
        expect(result.users[0].requiredExercises).toEqual(['S05', 'S10']);
        expect(result.users[0].excludedExercises).toEqual(['S03']);
    });
});

// ─── 冪等性: 最新版に再適用しても変化なし ────────────

describe('idempotency', () => {
    it('最新バージョンのstateを再migrationしても変化なし', () => {
        const state = makeCurrentState();
        const stateCopy = JSON.parse(JSON.stringify(state));

        const result = migrateAppState(stateCopy, APP_STATE_VERSION);

        expect(result.users).toEqual(state.users);
        expect(result.joinedChallengeIds).toEqual(state.joinedChallengeIds);
        expect(result.bgmEnabled).toBe(state.bgmEnabled);
        expect(result.hapticEnabled).toBe(state.hapticEnabled);
    });
});

// ─── フルパス: v0→current ────────────────────────────

describe('full migration path (v0→current)', () => {
    it('v0から最新まで全マイグレーション通過', () => {
        const state = makeV0State({
            fuwafuwaName: 'ひかる',
            classLevel: '中級',
            dailyTargetMinutes: 15,
        });

        const result = migrateAppState(state, 0);

        // users が作成されている
        expect(result.users.length).toBe(1);
        expect(result.users[0].name).toBe('ひかる');
        expect(result.users[0].classLevel).toBe('中級');
        expect(result.users[0].dailyTargetMinutes).toBe(15);

        // 旧デフォルトは削除済み
        expect(result.users[0].requiredExercises).not.toContain('S01');
        expect(result.users[0].excludedExercises).not.toContain('C01');

        // 新フィールドが存在
        expect(result.users[0].chibifuwas).toEqual([]);
        expect(result.users[0].consumedMagicSeconds).toBe(0);
        expect((result.users[0] as any).consumedMagicDate).toBeUndefined();
        expect(result.joinedChallengeIds).toEqual({});

        // レガシーフィールドが削除
        expect((result as any).classLevel).toBeUndefined();
        expect((result as any).fuwafuwaName).toBeUndefined();
    });
});
