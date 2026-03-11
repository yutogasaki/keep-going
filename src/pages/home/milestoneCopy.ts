import type { FuwafuwaMilestoneEvent } from '../../store/useAppStore';

type MilestoneKind = FuwafuwaMilestoneEvent['kind'];

export function getMilestoneEmoji(kind: MilestoneKind): string {
    if (kind === 'egg') return '🥚';
    if (kind === 'fairy') return '🧚';
    return '🌟';
}

export function getMilestoneTitle(kind: MilestoneKind): string {
    if (kind === 'egg') return 'たまごが やってきた！';
    if (kind === 'fairy') return 'たまごが かえった！';
    return 'おおきく そだったね！';
}

export function getMilestoneAmbientBadge(kind: MilestoneKind): string {
    if (kind === 'egg') return 'きたよ';
    if (kind === 'fairy') return 'うまれた';
    return 'そだった';
}

export function getMilestoneAriaLabel(kind: MilestoneKind): string {
    if (kind === 'egg') return 'たまごが やってきた';
    if (kind === 'fairy') return 'たまごが かえった';
    return 'おおきく そだった';
}
