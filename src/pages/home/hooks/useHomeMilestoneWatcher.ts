import { useEffect } from 'react';
import type { SessionRecord } from '../../../lib/db';
import { calculateFuwafuwaStatus } from '../../../lib/fuwafuwa';
import type { FuwafuwaMilestoneEvent, UserProfileStore } from '../../../store/useAppStore';

interface UseHomeMilestoneWatcherParams {
    allSessions: SessionRecord[];
    hasKnownMilestoneEvent: (event: FuwafuwaMilestoneEvent) => boolean;
    queueMilestoneEvent: (event: FuwafuwaMilestoneEvent) => void;
    users: UserProfileStore[];
}

export function getMilestoneKindForStage(stage: number): FuwafuwaMilestoneEvent['kind'] | null {
    if (stage === 1) return 'egg';
    if (stage === 2) return 'fairy';
    if (stage === 3) return 'adult';
    return null;
}

export function getMilestoneStage(kind: FuwafuwaMilestoneEvent['kind']): number {
    if (kind === 'egg') return 1;
    if (kind === 'fairy') return 2;
    return 3;
}

export function collectPendingMilestoneEvents({
    allSessions,
    hasKnownMilestoneEvent,
    users,
}: Pick<UseHomeMilestoneWatcherParams, 'allSessions' | 'hasKnownMilestoneEvent' | 'users'>): FuwafuwaMilestoneEvent[] {
    return users.flatMap((user) => {
        if (!user.fuwafuwaBirthDate) {
            return [];
        }

        const userSessions = allSessions.filter(
            (session) => !session.userIds || session.userIds.length === 0 || session.userIds.includes(user.id),
        );
        const status = calculateFuwafuwaStatus(user.fuwafuwaBirthDate, userSessions);
        if (status.isSayonara || (user.notifiedFuwafuwaStages || []).includes(status.stage)) {
            return [];
        }

        const kind = getMilestoneKindForStage(status.stage);
        if (!kind) {
            return [];
        }

        const event: FuwafuwaMilestoneEvent = {
            kind,
            userId: user.id,
            source: 'system',
        };

        return hasKnownMilestoneEvent(event) ? [] : [event];
    });
}

export function useHomeMilestoneWatcher({
    allSessions,
    hasKnownMilestoneEvent,
    queueMilestoneEvent,
    users,
}: UseHomeMilestoneWatcherParams) {
    useEffect(() => {
        if (allSessions.length === 0 || users.length === 0) {
            return;
        }

        const nextEvents = collectPendingMilestoneEvents({
            allSessions,
            hasKnownMilestoneEvent,
            users,
        });
        nextEvents.forEach(queueMilestoneEvent);
    }, [allSessions, hasKnownMilestoneEvent, queueMilestoneEvent, users]);
}
