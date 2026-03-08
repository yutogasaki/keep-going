export function getStageLabel(stage: number) {
    if (stage === 1) return 'たまご';
    if (stage === 2) return 'ようせい';
    return 'おとな';
}

export function getSoftProgress(percent: number) {
    if (percent >= 100) return 'まんたん！✨';
    if (percent >= 90) return 'もうすこしで まんたん！';
    if (percent >= 61) return 'けっこう たまった！';
    if (percent >= 31) return 'いいかんじ！';
    if (percent >= 1) return 'すこし たまってきた';
    return 'からっぽ';
}

export function getSoftProgressShort(percent: number) {
    if (percent >= 100) return 'まんたん✨';
    if (percent >= 90) return 'あとすこし';
    if (percent >= 61) return 'いっぱい';
    if (percent >= 31) return 'いいかんじ';
    if (percent >= 1) return 'すこし';
    return 'からっぽ';
}

export function getFamilyMessage(activeCount: number, displaySeconds: number, targetSeconds: number) {
    const percent = Math.round((displaySeconds / Math.max(1, targetSeconds)) * 100);
    const peopleLabel = activeCount === 2 ? 'ふたりで' : `${activeCount}にんで`;

    if (percent >= 100) {
        return 'みんな すごい！ まんたんだよ';
    }

    if (displaySeconds === 0) {
        return `${peopleLabel} ちからを あわせよう！`;
    }

    if (percent >= 90) {
        return `${peopleLabel} もうすこしで まんたん！`;
    }

    return 'みんなの まほう、たまってきたよ！';
}

export function getUserMessage(displaySeconds: number, targetSeconds: number, stage: number, activeDays: number) {
    const percent = Math.round((displaySeconds / Math.max(1, targetSeconds)) * 100);

    if (percent >= 100) {
        return 'わあ！ まほうが いっぱいだよ';
    }

    if (displaySeconds === 0) {
        if (stage === 1) {
            return 'きょうも まってたよ';
        }
        return 'いっしょに まほうを あつめよう？';
    }

    if (stage === 2 && activeDays >= 6) {
        return 'もうすぐ おおきくなれそう！';
    }

    if (percent >= 90) {
        return 'もうすこしで まんたん！';
    }

    return 'いいかんじ！ まほうが たまってきたよ';
}
