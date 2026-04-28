import type { FuwafuwaMilestoneEvent } from '@/store/useAppStore';

type FamilyMilestoneKind = FuwafuwaMilestoneEvent['kind'];

export function getFamilyMilestoneLines(
    kind: FamilyMilestoneKind,
    userName: string,
    hasMultiple: boolean,
    depth: number,
): string[] {
    if (hasMultiple) {
        return getFamilyGroupMilestoneLines(kind, depth);
    }

    return getFamilyUserMilestoneLines(kind, userName, depth);
}

function getFamilyGroupMilestoneLines(kind: FamilyMilestoneKind, depth: number): string[] {
    if (kind === 'egg') {
        if (depth === 0) return ['みんなの ところで', 'たまごが きてるみたい'];
        if (depth === 1) return ['どんな ふわふわか', 'たのしみだね'];
        return ['あいに いくの', 'わくわくするね'];
    }

    if (kind === 'fairy') {
        if (depth === 0) return ['みんなの ところで', 'うまれた ふわふわが いるみたい'];
        if (depth === 1) return ['うまれたばかりで', 'どきどきしてるかも'];
        return ['みにいくの', 'たのしみだね'];
    }

    if (depth === 0) return ['みんなの ところで', 'おおきく なった ふわふわが いるみたい'];
    if (depth === 1) return ['ぐんと そだった', 'ふわふわが いるみたい'];
    return ['みにいくの', 'たのしみだね'];
}

function getFamilyUserMilestoneLines(kind: FamilyMilestoneKind, userName: string, depth: number): string[] {
    if (kind === 'egg') {
        if (depth === 0) return [`${userName}の ところに`, 'たまごが きたみたい'];
        if (depth === 1) return ['どんな ふわふわか', 'たのしみだね'];
        return ['あいに いくの', 'わくわくするね'];
    }

    if (kind === 'fairy') {
        if (depth === 0) return [`${userName}の ふわふわ`, 'うまれたみたい！'];
        if (depth === 1) return ['うまれたばかりで', 'どきどきしてるかも'];
        return ['みにいくの', 'たのしみだね'];
    }

    if (depth === 0) return [`${userName}の ふわふわ`, 'おおきく なったみたい'];
    if (depth === 1) return ['ぐんと そだった', 'みたいだね'];
    return ['みにいくの', 'たのしみだね'];
}
