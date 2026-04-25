import { countChallengeProgressFromSessions, type ChallengeProgressWindow } from '../challenge-engine';
import { getAllSessions } from '../db';
import { getChallengeActiveWindow } from './display';
import { toChallengeEngineInput } from './engine';
import type { Challenge } from './types';

export async function countChallengeProgress(
    challenge: Challenge,
    userIds: string[],
    effectiveWindow?: ChallengeProgressWindow | null,
): Promise<number> {
    const sessions = await getAllSessions();
    const window = getChallengeActiveWindow(challenge, effectiveWindow);

    return countChallengeProgressInWindow(challenge, userIds, window, sessions);
}

export async function countChallengeProgressInCustomWindow(
    challenge: Challenge,
    userIds: string[],
    window: ChallengeProgressWindow,
): Promise<number> {
    const sessions = await getAllSessions();

    return countChallengeProgressInWindow(challenge, userIds, window, sessions);
}

function countChallengeProgressInWindow(
    challenge: Challenge,
    userIds: string[],
    window: ChallengeProgressWindow,
    sessions: Awaited<ReturnType<typeof getAllSessions>>,
): number {
    return countChallengeProgressFromSessions(toChallengeEngineInput(challenge), sessions, userIds, window);
}
