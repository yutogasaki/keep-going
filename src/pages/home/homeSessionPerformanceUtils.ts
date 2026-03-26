import type { SessionRecord } from '../../lib/db';

function buildUserIdSet(userIds: string[] | ReadonlySet<string>): ReadonlySet<string> {
    return userIds instanceof Set ? userIds : new Set(userIds);
}

export function sessionMatchesAnyUser(
    session: Pick<SessionRecord, 'userIds'>,
    userIds: string[] | ReadonlySet<string>,
): boolean {
    const userIdSet = buildUserIdSet(userIds);
    if (!session.userIds || session.userIds.length === 0) {
        return true;
    }

    return session.userIds.some((userId) => userIdSet.has(userId));
}

export function filterSessionsForUsers(
    sessions: SessionRecord[],
    userIds: string[] | ReadonlySet<string>,
): SessionRecord[] {
    const userIdSet = buildUserIdSet(userIds);
    return sessions.filter((session) => sessionMatchesAnyUser(session, userIdSet));
}

export function filterSessionsByDate(
    sessions: SessionRecord[],
    date: string,
): SessionRecord[] {
    return sessions.filter((session) => session.date === date);
}

export function buildSessionsByUserId(
    sessions: SessionRecord[],
    visibleUserIds: string[],
): Map<string, SessionRecord[]> {
    const uniqueUserIds = [...new Set(visibleUserIds)];
    const userIdSet = new Set(uniqueUserIds);
    const sessionsByUserId = new Map<string, SessionRecord[]>();

    for (const userId of uniqueUserIds) {
        sessionsByUserId.set(userId, []);
    }

    for (const session of sessions) {
        const targetUserIds = session.userIds && session.userIds.length > 0
            ? session.userIds.filter((userId) => userIdSet.has(userId))
            : uniqueUserIds;

        for (const userId of targetUserIds) {
            const userSessions = sessionsByUserId.get(userId);
            if (userSessions) {
                userSessions.push(session);
            }
        }
    }

    return sessionsByUserId;
}
