import { formatDateKey } from '../../lib/db';
import { calculateStreak } from '../../lib/teacher';
import type { AdminAccountSummary } from '../../lib/developer';
import type { FilterType } from './types';

export const NEW_ACCOUNT_GRACE_DAYS = 14;
export const INACTIVE_DAYS = 14;
export const SUSPEND_CANDIDATE_DAYS = 30;

export interface MemberSegmentation {
    memberId: string;
    inferredSessionCount: number;
    lastActiveDate: string | null;
    streak: number;
    hasDuplicateName: boolean;
    duplicateGroupSize: number;
    hasNamedSessions: boolean;
    directSessionCount: number;
    isCleanupCandidate: boolean;
}

export interface AccountSegmentation {
    isNewGrace: boolean;
    isInactive: boolean;
    isSuspendCandidate: boolean;
    hasDuplicateNames: boolean;
    duplicateNames: string[];
    memberSignals: MemberSegmentation[];
}

export function getThresholdDateKey(daysAgo: number, now = new Date()): string {
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    return formatDateKey(date);
}

export function getMemberSessions(account: AdminAccountSummary, memberId: string) {
    const memberIds = new Set(account.members.map((member) => member.id));
    const isSingleMember = account.members.length === 1;

    return account.sessions.filter((session) => {
        if (session.userIds.length === 0) return true;
        if (session.userIds.includes(memberId)) return true;
        if (isSingleMember) return true;
        const hasAnyMatch = session.userIds.some((id) => memberIds.has(id));
        return !hasAnyMatch;
    });
}

export function analyzeAccount(account: AdminAccountSummary, now = new Date()): AccountSegmentation {
    const graceThreshold = getThresholdDateKey(NEW_ACCOUNT_GRACE_DAYS, now);
    const inactiveThreshold = getThresholdDateKey(INACTIVE_DAYS, now);
    const suspendThreshold = getThresholdDateKey(SUSPEND_CANDIDATE_DAYS, now);

    const nameGroups = new Map<string, string[]>();
    for (const member of account.members) {
        const normalizedName = member.name.trim().replace(/\s+/g, ' ');
        if (!normalizedName) continue;
        const group = nameGroups.get(normalizedName) ?? [];
        group.push(member.id);
        nameGroups.set(normalizedName, group);
    }

    const duplicateGroups = [...nameGroups.entries()].filter(([, memberIds]) => memberIds.length > 1);
    const duplicateMemberIds = new Set(duplicateGroups.flatMap(([, memberIds]) => memberIds));
    const memberSignals: MemberSegmentation[] = account.members.map((member) => {
        const memberSessions = getMemberSessions(account, member.id);
        const directSessionCount = account.sessions.filter((session) => session.userIds.includes(member.id)).length;
        const duplicateGroupSize = duplicateGroups.find(([, memberIds]) => memberIds.includes(member.id))?.[1].length ?? 0;
        const hasDuplicateName = duplicateMemberIds.has(member.id);
        const hasNamedSessions = directSessionCount > 0;

        return {
            memberId: member.id,
            inferredSessionCount: memberSessions.length,
            lastActiveDate: memberSessions[0]?.date ?? null,
            streak: calculateStreak(memberSessions),
            hasDuplicateName,
            duplicateGroupSize,
            hasNamedSessions,
            directSessionCount,
            isCleanupCandidate: hasDuplicateName && !hasNamedSessions && account.members.length > 1,
        };
    });

    const registeredAtKnown = Boolean(account.registeredAt);
    const isNewGrace = Boolean(account.registeredAt && account.registeredAt >= graceThreshold);
    const isInactive = !account.suspended
        && !isNewGrace
        && (!account.lastActiveDate || account.lastActiveDate < inactiveThreshold);
    const isSuspendCandidate = !account.suspended
        && registeredAtKnown
        && account.registeredAt! < suspendThreshold
        && (!account.lastActiveDate || account.lastActiveDate < suspendThreshold);

    return {
        isNewGrace,
        isInactive,
        isSuspendCandidate,
        hasDuplicateNames: duplicateGroups.length > 0,
        duplicateNames: duplicateGroups.map(([name]) => name),
        memberSignals,
    };
}

export function filterAccountsByType(
    accounts: AdminAccountSummary[],
    filter: FilterType,
    now = new Date(),
): AdminAccountSummary[] {
    return accounts.filter((account) => {
        const analysis = analyzeAccount(account, now);

        switch (filter) {
            case 'inactive':
                return analysis.isInactive;
            case 'new':
                return analysis.isNewGrace;
            case 'duplicate':
                return analysis.hasDuplicateNames;
            case 'multi':
                return account.members.length > 1;
            case 'suspend':
                return analysis.isSuspendCandidate;
            case 'suspended':
                return account.suspended;
            default:
                return true;
        }
    });
}
