import type { HomeVisitRecency } from './homeVisitMemory';

type AfterglowKind = 'announcement' | 'magic_delivery';

function pickVariant<T>(variants: readonly T[], seed: number): T {
    return variants[Math.abs(seed) % variants.length];
}

function getPeopleLabel(activeCount: number): string {
    return activeCount === 2 ? 'ふたりで' : `${activeCount}にんで`;
}

export function getFamilyGreetingLines(
    activeCount: number,
    visitRecency: HomeVisitRecency,
    variantSeed: number,
): string[] {
    const peopleLabel = getPeopleLabel(activeCount);

    if (visitRecency === 'recent') {
        return pickVariant([
            ['また すぐ あえたね', 'このぽかぽか まだ のこってるよ'],
            ['さっきの つづきみたいで', 'ふわふわ うれしいな'],
            ['また みんなの こえが きこえて', 'ほっとしたよ'],
            ['きょうも みんなで', 'いっしょだね'],
        ], variantSeed);
    }

    if (visitRecency === 'today') {
        return pickVariant([
            ['また みんなで きてくれたね', 'ふわふわ うれしいな'],
            ['きょう もういちど', 'あえて うれしいな'],
            ['また あいに きてくれて', 'ふわふわ ぽかぽかだよ'],
            ['きょうも みんなで', 'いっしょだね'],
        ], variantSeed);
    }

    if (visitRecency === 'returning') {
        return pickVariant([
            ['また あえて うれしいな', 'ふわふわ まってたよ'],
            ['ひさしぶりだね', 'また きてくれて うれしいな'],
            ['みんなが きてくれて', 'ぽかぽか もどってきたよ'],
            ['きょうも みんなで', 'いっしょだね'],
        ], variantSeed);
    }

    return pickVariant([
        [`${peopleLabel} いると`, 'なんだか たのしいね'],
        ['みんなが いると', 'ふわふわ うれしいな'],
        ['みんなが きてくれて', 'ふわふわ ぽかぽかだよ'],
        ['きょうも みんなで', 'いっしょだね'],
    ], variantSeed);
}

export function getUserGreetingLines(
    stage: number,
    visitRecency: HomeVisitRecency,
    variantSeed: number,
): string[] {
    if (visitRecency === 'recent') {
        return pickVariant([
            ['また すぐ あえたね', 'このぽかぽか まだ のこってるよ'],
            ['さっきも きてくれたね', 'また あえて うれしいな'],
            ['また すぐ みにきてくれて', 'ふわふわ うれしいな'],
            ['まっていたよ', 'きょうも いっしょだね'],
        ], variantSeed);
    }

    if (visitRecency === 'today') {
        return pickVariant([
            ['また きてくれたね', 'ふわふわ うれしいな'],
            ['きょう もういちど', 'あえて うれしいな'],
            ['また あいに きてくれて', 'ふわふわ ぽかぽかだよ'],
            ['まっていたよ', 'きょうも いっしょだね'],
        ], variantSeed);
    }

    if (visitRecency === 'returning') {
        return pickVariant([
            ['また あえて うれしいな', 'ふわふわ まってたよ'],
            ['ひさしぶりだね', 'また きてくれて うれしいな'],
            ['きょうも あいに きてくれたの？', 'ふわふわ うれしいな'],
            ['まっていたよ', 'きょうも いっしょだね'],
        ], variantSeed);
    }

    if (stage === 1) {
        return pickVariant([
            ['きょうも まってたよ', 'あえて うれしいな'],
            ['なんだか そわそわしてたんだ', 'また あえたね'],
            ['きょうも あそびに きてくれたの？', 'ふわふわ うれしいな'],
            ['まっていたよ', 'きょうも いっしょだね'],
        ], variantSeed);
    }

    return pickVariant([
        ['あえて うれしいな', 'ふわふわ ごきげんだよ'],
        ['きょうも きてくれたね', 'また あえて うれしいな'],
        ['きょうも あそびに きてくれたの？', 'ふわふわ うれしいな'],
        ['まっていたよ', 'きょうも いっしょだね'],
    ], variantSeed);
}

export function getFamilyAfterglowLines(
    kind: AfterglowKind,
    visitRecency: HomeVisitRecency,
    depth: number,
): string[] {
    if (kind === 'announcement') {
        if (visitRecency === 'recent') {
            return depth === 0
                ? ['さっき みてくれたこと', 'まだ おぼえてるよ']
                : depth === 1
                    ? ['また みにきてくれて', 'ふわふわ うれしいな']
                    : ['きになったときに', 'また のぞいてみてね'];
        }

        if (visitRecency === 'returning') {
            return depth === 0
                ? ['また みにきてくれて', 'ふわふわ うれしいな']
                : depth === 1
                    ? ['ひさしぶりでも', 'ちゃんと おぼえてるよ']
                    : ['また きになったら', 'のぞいてみてね'];
        }

        return depth === 0
            ? ['みつけてくれて', 'ふわふわ うれしいな']
            : depth === 1
                ? ['また みにいけたら', 'たのしそうだね']
                : ['きになったときに', 'のぞいてみてね'];
    }

    if (visitRecency === 'recent') {
        return depth === 0
            ? ['さっきの ぽかぽか', 'まだ みんなの ところに のこってるよ']
            : depth === 1
                ? ['また みんなに あえて', 'ふわふわ うれしいな']
                : ['また とどいたら', 'ふわふわ もっと うれしいな'];
    }

    if (visitRecency === 'returning') {
        return depth === 0
            ? ['また あえて', 'ぽかぽかも もどってきたよ']
            : depth === 1
                ? ['ひさしぶりでも', 'ちゃんと うけとったよ']
                : ['また とどいたら', 'ふわふわ もっと うれしいな'];
    }

    return depth === 0
        ? ['みんなの まほうエネルギー', 'ちゃんと うけとったよ']
        : depth === 1
            ? ['ぽかぽかが まだ', 'のこってるよ']
            : ['また とどいたら', 'ふわふわ もっと うれしいな'];
}

export function getUserAfterglowLines(
    kind: AfterglowKind,
    visitRecency: HomeVisitRecency,
    depth: number,
): string[] {
    if (kind === 'announcement') {
        if (visitRecency === 'recent') {
            return depth === 0
                ? ['さっき みてくれたこと', 'まだ おぼえてるよ']
                : depth === 1
                    ? ['また みにきてくれて', 'ふわふわ うれしいな']
                    : ['きになったときに', 'また のぞいてみてね'];
        }

        if (visitRecency === 'returning') {
            return depth === 0
                ? ['また みにきてくれて', 'ふわふわ うれしいな']
                : depth === 1
                    ? ['ひさしぶりでも', 'ちゃんと おぼえてるよ']
                    : ['また きになったら', 'のぞいてみてね'];
        }

        return depth === 0
            ? ['おすすめ みてくれて', 'ふわふわ うれしいな']
            : depth === 1
                ? ['また みにいけたら', 'いいね']
                : ['きになったときに', 'のぞいてみてね'];
    }

    if (visitRecency === 'recent') {
        return depth === 0
            ? ['さっきの ぽかぽか', 'まだ のこってるよ']
            : depth === 1
                ? ['また あえて', 'ふわふわ うれしいな']
                : ['また とどいたら', 'ふわふわ もっと うれしいな'];
    }

    if (visitRecency === 'returning') {
        return depth === 0
            ? ['また あえて', 'ぽかぽかも もどってきたよ']
            : depth === 1
                ? ['ひさしぶりでも', 'ちゃんと うけとったよ']
                : ['また とどいたら', 'ふわふわ もっと うれしいな'];
    }

    return depth === 0
        ? ['まほうエネルギー', 'ちゃんと うけとったよ']
        : depth === 1
            ? ['ぽかぽかが まだ', 'のこってるよ']
            : ['また とどいたら', 'ふわふわ もっと うれしいな'];
}
