import type { FuwafuwaDailyGroup, FuwafuwaDailySelection, FuwafuwaDailyTopic } from './fuwafuwaHomeCardCopy';

export interface DailyConversationCandidate {
    selection: FuwafuwaDailySelection;
    replyId: string;
}

export interface DailyConversationState {
    currentGroup: FuwafuwaDailyGroup | null;
    currentTopic: FuwafuwaDailyTopic | null;
    currentReplyId: string | null;
    recentGroups: FuwafuwaDailyGroup[];
    recentTopics: FuwafuwaDailyTopic[];
    recentReplyIds: string[];
    ambientGap: number;
    turn: number;
}

export interface DailyConversationContext {
    ambientAvailable: boolean;
    percent: number;
    hasGrowthLite: boolean;
    candidates: DailyConversationCandidate[];
}

export type DailyConversationReason = 'initial' | 'tap' | 'tick';

export const EMPTY_DAILY_CONVERSATION_STATE: DailyConversationState = {
    currentGroup: null,
    currentTopic: null,
    currentReplyId: null,
    recentGroups: [],
    recentTopics: [],
    recentReplyIds: [],
    ambientGap: 0,
    turn: 0,
};

function getGroupPriority(
    turn: number,
): FuwafuwaDailyGroup[] {
    switch (turn % 4) {
    case 1:
        return ['magic', 'everyday', 'ambient'];
    case 2:
        return ['everyday', 'ambient', 'magic'];
    case 3:
        return ['magic', 'ambient', 'everyday'];
    default:
        return ['everyday', 'magic', 'ambient'];
    }
}

function getDistinctCount<T>(items: readonly T[]): number {
    return new Set(items).size;
}

function getGroupScores(
    state: DailyConversationState,
    context: DailyConversationContext,
): Map<FuwafuwaDailyGroup, number> {
    const scores = new Map<FuwafuwaDailyGroup, number>([
        ['everyday', 1.0],
        ['magic', 1.0],
        ['ambient', context.ambientAvailable ? 0.35 : -Infinity],
    ]);

    const [latestGroup, secondLatestGroup] = state.recentGroups;

    if (latestGroup && secondLatestGroup && latestGroup === secondLatestGroup) {
        if (latestGroup === 'everyday') {
            scores.set('magic', (scores.get('magic') ?? 0) + 0.6);
        }

        if (latestGroup === 'magic') {
            scores.set('everyday', (scores.get('everyday') ?? 0) + 0.6);
        }
    }

    if (context.ambientAvailable && state.ambientGap >= 4) {
        scores.set('ambient', (scores.get('ambient') ?? 0) + 0.4);
    }

    if (context.percent >= 30) {
        scores.set('magic', (scores.get('magic') ?? 0) + 0.3);
    }

    if (context.percent >= 90) {
        scores.set('magic', (scores.get('magic') ?? 0) + 0.5);
    }

    if (context.hasGrowthLite) {
        scores.set('magic', (scores.get('magic') ?? 0) + 0.25);
    }

    if (state.recentGroups.length >= 2 && state.recentGroups[0] === state.recentGroups[1]) {
        const repeatedGroup = state.recentGroups[0];
        scores.set(repeatedGroup, -Infinity);
    }

    if (state.currentGroup === 'ambient') {
        scores.set('ambient', -Infinity);
    }

    return scores;
}

function sortGroupsByScore(
    scores: Map<FuwafuwaDailyGroup, number>,
    turn: number,
): FuwafuwaDailyGroup[] {
    const priority = getGroupPriority(turn);
    const groups: FuwafuwaDailyGroup[] = ['everyday', 'magic', 'ambient'];

    return groups.sort((left, right) => {
        const scoreDiff = (scores.get(right) ?? -Infinity) - (scores.get(left) ?? -Infinity);
        if (scoreDiff !== 0) {
            return scoreDiff;
        }

        return priority.indexOf(left) - priority.indexOf(right);
    });
}

function pickCandidateByTurn(
    candidates: DailyConversationCandidate[],
    turn: number,
): DailyConversationCandidate | null {
    if (candidates.length === 0) {
        return null;
    }

    return candidates[Math.abs(turn) % candidates.length];
}

function filterCandidates(
    candidates: DailyConversationCandidate[],
    state: DailyConversationState,
): DailyConversationCandidate[] {
    const withoutRecentReply = candidates.filter((candidate) => !state.recentReplyIds.includes(candidate.replyId));
    if (withoutRecentReply.length > 0) {
        return withoutRecentReply;
    }

    const withoutCurrentReply = candidates.filter((candidate) => candidate.replyId !== state.currentReplyId);
    if (withoutCurrentReply.length > 0) {
        return withoutCurrentReply;
    }

    return candidates;
}

function filterTapCandidates(
    candidates: DailyConversationCandidate[],
    state: DailyConversationState,
): DailyConversationCandidate[] {
    const distinctCandidates = candidates.filter((candidate) => candidate.replyId !== state.currentReplyId);
    if (distinctCandidates.length === 0) {
        return [];
    }

    const freshCandidates = distinctCandidates.filter((candidate) => !state.recentReplyIds.includes(candidate.replyId));
    return freshCandidates.length > 0 ? freshCandidates : distinctCandidates;
}

function getCandidatesForGroup(
    candidates: DailyConversationCandidate[],
    group: FuwafuwaDailyGroup,
): DailyConversationCandidate[] {
    return candidates.filter((candidate) => candidate.selection.group === group);
}

function getCandidatesForTopic(
    candidates: DailyConversationCandidate[],
    topic: FuwafuwaDailyTopic,
): DailyConversationCandidate[] {
    return candidates.filter((candidate) => candidate.selection.topic === topic);
}

function getCandidateTopicScore(
    candidate: DailyConversationCandidate,
    state: DailyConversationState,
    context: DailyConversationContext,
): number {
    let score = 1;

    if (candidate.selection.topic === state.currentTopic) {
        score -= 0.35;
    }

    if (state.recentTopics[0] === candidate.selection.topic) {
        score -= 0.3;
    }

    if (state.recentTopics[0] === candidate.selection.topic && state.recentTopics[1] === candidate.selection.topic) {
        return -Infinity;
    }

    if (candidate.selection.topic === 'growth') {
        score += context.hasGrowthLite ? 0.2 : -Infinity;
    }

    if (candidate.selection.topic === 'omen' && context.percent >= 90) {
        score += 0.25;
    }

    if (candidate.selection.topic === 'progress' && context.percent >= 30) {
        score += 0.2;
    }

    return score;
}

function pickTopicCandidate(
    groupCandidates: DailyConversationCandidate[],
    state: DailyConversationState,
    context: DailyConversationContext,
    reason: DailyConversationReason = 'tick',
): DailyConversationCandidate | null {
    const groupedByTopic = new Map<FuwafuwaDailyTopic, DailyConversationCandidate[]>();
    groupCandidates.forEach((candidate) => {
        const bucket = groupedByTopic.get(candidate.selection.topic) ?? [];
        bucket.push(candidate);
        groupedByTopic.set(candidate.selection.topic, bucket);
    });

    const topicEntries = [...groupedByTopic.entries()]
        .map(([topic, topicCandidates]) => ({
            topic,
            score: getCandidateTopicScore(topicCandidates[0], state, context),
            candidates: topicCandidates,
        }))
        .filter((entry) => Number.isFinite(entry.score))
        .sort((left, right) => {
            const scoreDiff = right.score - left.score;
            if (scoreDiff !== 0) {
                return scoreDiff;
            }

            return getDistinctCount(left.candidates.map((candidate) => candidate.replyId))
                - getDistinctCount(right.candidates.map((candidate) => candidate.replyId));
        });

    for (const entry of topicEntries) {
        const filteredCandidates = reason === 'tap'
            ? filterTapCandidates(entry.candidates, state)
            : filterCandidates(entry.candidates, state);
        const candidate = pickCandidateByTurn(filteredCandidates, state.turn);
        if (candidate) {
            return candidate;
        }
    }

    return null;
}

function pickCrossGroupCandidate(
    state: DailyConversationState,
    context: DailyConversationContext,
    reason: DailyConversationReason = 'tick',
): DailyConversationCandidate | null {
    const groupScores = getGroupScores(state, context);
    const orderedGroups = sortGroupsByScore(groupScores, state.turn);

    for (const group of orderedGroups) {
        const score = groupScores.get(group) ?? -Infinity;
        if (!Number.isFinite(score)) {
            continue;
        }

        const groupCandidates = getCandidatesForGroup(context.candidates, group);
        const candidate = pickTopicCandidate(groupCandidates, state, context, reason);
        if (candidate) {
            return candidate;
        }
    }

    const fallbackCandidates = reason === 'tap'
        ? filterTapCandidates(context.candidates, state)
        : filterCandidates(context.candidates, state);
    return pickCandidateByTurn(fallbackCandidates, state.turn);
}

function updateState(
    state: DailyConversationState,
    candidate: DailyConversationCandidate,
): DailyConversationState {
    return {
        currentGroup: candidate.selection.group,
        currentTopic: candidate.selection.topic,
        currentReplyId: candidate.replyId,
        recentGroups: [candidate.selection.group, ...state.recentGroups].slice(0, 2),
        recentTopics: [candidate.selection.topic, ...state.recentTopics].slice(0, 3),
        recentReplyIds: [candidate.replyId, ...state.recentReplyIds].slice(0, 2),
        ambientGap: candidate.selection.group === 'ambient' ? 0 : state.ambientGap + 1,
        turn: state.turn + 1,
    };
}

export function chooseNextDailyConversation(
    state: DailyConversationState,
    context: DailyConversationContext,
    reason: DailyConversationReason,
): { candidate: DailyConversationCandidate | null; nextState: DailyConversationState } {
    if (context.candidates.length === 0) {
        return { candidate: null, nextState: state };
    }

    if (reason === 'tap' && state.currentTopic) {
        const sameTopicCandidates = filterTapCandidates(
            getCandidatesForTopic(context.candidates, state.currentTopic),
            state,
        );
        const sameTopicCandidate = pickCandidateByTurn(sameTopicCandidates, state.turn + 1);
        if (sameTopicCandidate) {
            return {
                candidate: sameTopicCandidate,
                nextState: updateState(state, sameTopicCandidate),
            };
        }

        if (state.currentGroup) {
            const sameGroupCandidates = getCandidatesForGroup(context.candidates, state.currentGroup)
                .filter((candidate) => candidate.selection.topic !== state.currentTopic);
            const sameGroupCandidate = pickTopicCandidate(sameGroupCandidates, state, context, 'tap');
            if (sameGroupCandidate) {
                return {
                    candidate: sameGroupCandidate,
                    nextState: updateState(state, sameGroupCandidate),
                };
            }
        }
    }

    const candidate = pickCrossGroupCandidate(state, context, reason);
    if (!candidate) {
        return { candidate: null, nextState: state };
    }

    return {
        candidate,
        nextState: updateState(state, candidate),
    };
}
