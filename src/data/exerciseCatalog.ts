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

export const USER_CLASS_LEVELS: ClassLevelInfo[] = CLASS_LEVELS.filter((classLevel) => classLevel.id !== '先生');

export const CLASS_EMOJI: Record<string, string> = Object.fromEntries(
    CLASS_LEVELS.map((classLevel) => [classLevel.id, classLevel.emoji]),
);

export type Priority = 'high' | 'medium';

export interface Exercise {
    id: string;
    name: string;
    sec: number;
    placement: ExercisePlacement;
    internal: string;
    classes: ClassLevel[];
    priority: Priority;
    emoji: string;
    hasSplit?: boolean;
    reading?: string;
    description?: string;
}

export const EXERCISES: Exercise[] = [
    { id: 'S07', name: 'ポイント＆フレックス', sec: 60, placement: 'prep', internal: 'P30・F30', classes: ['プレ', '初級', '中級', '上級'], priority: 'high', emoji: '🦶', description: 'つまさきをピンとのばしたり、ぐっとまげたり。あしのゆびまでバレリーナ！' },
    { id: 'S01', name: '開脚', sec: 30, placement: 'stretch', internal: 'single', classes: ['プレ', '初級', '中級', '上級'], priority: 'high', emoji: '🦵', reading: 'かいきゃく', description: 'あしをひろげてゆかにすわろう。まいにちすこしずつ、もっとひらくよ！' },
    { id: 'S02', name: '前屈', sec: 30, placement: 'stretch', internal: 'single', classes: ['プレ', '初級', '中級', '上級'], priority: 'high', emoji: '🙇', reading: 'ぜんくつ', description: 'あしをまっすぐのばして、まえにたおれよう。あしのうらがのびるかな？' },
    { id: 'S03', name: '前後開脚', sec: 60, placement: 'stretch', internal: 'R30→L30', classes: ['初級', '中級', '上級'], priority: 'medium', emoji: '🩰', hasSplit: true, reading: 'ぜんごかいきゃく', description: 'まえとうしろにあしをひらくスプリッツ。バレリーナのきほんだよ！' },
    { id: 'S05', name: 'アシカさん', sec: 30, placement: 'stretch', internal: 'single', classes: ['プレ', '初級', '中級', '上級'], priority: 'medium', emoji: '🦭', description: 'うつぶせからうでをのばして、アシカさんみたいにむねをそらそう！' },
    { id: 'S06', name: 'ゆりかご', sec: 30, placement: 'stretch', internal: 'single', classes: ['プレ', '初級', '中級', '上級'], priority: 'high', emoji: '🛏️', description: 'せなかをまるくして、ゆらゆらゆれよう。せぼねがほぐれてきもちいいよ！' },
    { id: 'S08', name: 'どんぐり', sec: 30, placement: 'stretch', internal: 'single', classes: ['プレ', '初級', '中級', '上級'], priority: 'medium', emoji: '🌰', description: 'からだをちいさくまるめて、どんぐりみたいにコロコロ。リラックスしよう！' },
    { id: 'S04', name: 'ブリッジ', sec: 30, placement: 'core', internal: 'single', classes: ['初級', '中級', '上級'], priority: 'medium', emoji: '🌈', description: 'あおむけからグーンとおなかをもちあげよう。ぜんしんのちからをつかうよ！' },
    { id: 'S10', name: 'Y字バランス', sec: 60, placement: 'core', internal: 'R30→L30', classes: ['プレ', '初級', '中級', '上級'], priority: 'medium', emoji: '💃', hasSplit: true, reading: 'わいじばらんす', description: 'かたあしでたって、もうかたほうのあしをたかくあげよう。バランスにちょうせん！' },
    { id: 'C01', name: 'プランク', sec: 30, placement: 'core', internal: 'single', classes: ['プレ', '初級', '中級', '上級'], priority: 'medium', emoji: '💪', description: 'うでとつまさきでからだをまっすぐキープ。おなかにちからをいれてね！' },
    { id: 'C02', name: 'サイドプランク', sec: 60, placement: 'core', internal: 'R30→L30', classes: ['プレ', '初級', '中級', '上級'], priority: 'medium', emoji: '🏋️', hasSplit: true, description: 'よこむきでからだをささえよう。わきばらがつよくなるよ！' },
    { id: 'S09', name: '深呼吸', sec: 30, placement: 'ending', internal: 'single', classes: ['プレ', '初級', '中級', '上級'], priority: 'high', emoji: '🌬️', reading: 'しんこきゅう', description: '深く深呼吸する。' },
    { id: 'R01', name: '休憩5秒', sec: 5, placement: 'rest', internal: 'single', classes: ['プレ', '初級', '中級', '上級'], priority: 'medium', emoji: '💤', reading: 'きゅうけい', description: 'すこしやすんで、つぎにそなえよう！' },
    { id: 'R02', name: '休憩10秒', sec: 10, placement: 'rest', internal: 'single', classes: ['プレ', '初級', '中級', '上級'], priority: 'medium', emoji: '💤', reading: 'きゅうけい', description: 'すこしやすんで、つぎにそなえよう！' },
    { id: 'R03', name: '休憩15秒', sec: 15, placement: 'rest', internal: 'single', classes: ['プレ', '初級', '中級', '上級'], priority: 'medium', emoji: '💤', reading: 'きゅうけい', description: 'すこしやすんで、つぎにそなえよう！' },
];

export function getExerciseById(id: string): Exercise | undefined {
    return EXERCISES.find((exercise) => exercise.id === id);
}

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

export function getExercisesByClass(classLevel: ClassLevel): Exercise[] {
    const level = classLevel === 'その他' ? '初級' : classLevel;
    return EXERCISES.filter((exercise) => exercise.classes.includes(level) && !isRestExercise(exercise));
}
