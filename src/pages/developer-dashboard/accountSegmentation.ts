import { formatDateKey } from '../../lib/db';
import { calculateStreak } from '../../lib/teacher';
import type { AdminAccountSummary } from '../../lib/developer';
import type { FilterType } from './types';

export const NEW_ACCOUNT_GRACE_DAYS = 7;
export const INACTIVE_DAYS = 7;
export const SUSPEND_CANDIDATE_DAYS = 7;
export const MEMBER_CLEANUP_DAYS = 14;
export const LONG_DORMANT_LABEL = `${SUSPEND_CANDIDATE_DAYS}日以上ほぼ未利用`;
export const UNUSED_CLEANUP_LABEL = '未使用整理候補';
export const DUPLICATE_UNREFERENCED_LABEL = '同名未参照';

export type SuspendReason = 'inactive_30d' | 'never_started' | 'reroll';

export interface MemberSegmentation {
    memberId: string;
    inferredSessionCount: number;
    lastActiveDate: string | null;
    streak: number;
    hasDuplicateName: boolean;
    duplicateGroupSize: number;
    hasNamedSessions: boolean;
    directSessionCount: number;
    createdDate: string | null;
    isStaleUnused: boolean;
    isRerollLike: boolean;
    isCleanupCandidate: boolean;
    cleanupReasonLabels: string[];
}

export interface AccountSegmentation {
    isNewGrace: boolean;
    isInactive: boolean;
    isSuspendCandidate: boolean;
    hasLongDormantRisk: boolean;
    hasUnusedCleanupRisk: boolean;
    hasNeverStartedRisk: boolean;
    isRerollCandidate: boolean;
    suspendReasons: SuspendReason[];
    suspendReasonLabels: string[];
    hasDuplicateNames: boolean;
    duplicateNames: string[];
    cleanupCandidateMemberCount: number;
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

function toDateKey(value: string | null | undefined): string | null {
    if (!value) return null;
    return value.slice(0, 10);
}

function toSuspendReasonLabels(reasons: SuspendReason[]): string[] {
    return [...new Set(reasons.map((reason) => {
        switch (reason) {
            case 'inactive_30d':
                return LONG_DORMANT_LABEL;
            case 'never_started':
                return UNUSED_CLEANUP_LABEL;
            case 'reroll':
                return UNUSED_CLEANUP_LABEL;
            default:
                return reason;
        }
    }))];
}

export function analyzeAccount(account: AdminAccountSummary, now = new Date()): AccountSegmentation {
    const graceThreshold = getThresholdDateKey(NEW_ACCOUNT_GRACE_DAYS, now);
    const inactiveThreshold = getThresholdDateKey(INACTIVE_DAYS, now);
    const suspendThreshold = getThresholdDateKey(SUSPEND_CANDIDATE_DAYS, now);
    const memberCleanupThreshold = getThresholdDateKey(MEMBER_CLEANUP_DAYS, now);

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
        const createdDate = toDateKey(member.createdAt);
        const hasAnyUsage = memberSessions.length > 0 || hasNamedSessions;
        const isDuplicateUnreferenced = hasDuplicateName && !hasNamedSessions && account.members.length > 1;
        const isStaleUnused = account.members.length > 1
            && !hasAnyUsage
            && createdDate !== null
            && createdDate < memberCleanupThreshold;
        const isRerollLike = account.totalSessions === 0 && isDuplicateUnreferenced;
        const cleanupReasonLabels = [
            (isStaleUnused || isRerollLike) ? UNUSED_CLEANUP_LABEL : null,
            !isRerollLike && isDuplicateUnreferenced ? DUPLICATE_UNREFERENCED_LABEL : null,
        ].filter((value): value is string => value !== null);

        return {
            memberId: member.id,
            inferredSessionCount: memberSessions.length,
            lastActiveDate: memberSessions[0]?.date ?? null,
            streak: calculateStreak(memberSessions),
            hasDuplicateName,
            duplicateGroupSize,
            hasNamedSessions,
            directSessionCount,
            createdDate,
            isStaleUnused,
            isRerollLike,
            isCleanupCandidate: cleanupReasonLabels.length > 0,
            cleanupReasonLabels,
        };
    });

    const registeredAtKnown = Boolean(account.registeredAt);
    const isNewGrace = Boolean(account.registeredAt && account.registeredAt >= graceThreshold);
    const isInactive = !account.suspended
        && !isNewGrace
        && (!account.lastActiveDate || account.lastActiveDate < inactiveThreshold);
    const hasLongDormantRisk = registeredAtKnown
        && account.registeredAt! < suspendThreshold
        && (!account.lastActiveDate || account.lastActiveDate < suspendThreshold);
    const hasNeverStartedRisk = registeredAtKnown
        && !isNewGrace
        && account.totalSessions === 0
        && account.registeredAt! < inactiveThreshold;
    const rerollLikeMemberCount = memberSignals.filter((signal) => signal.isRerollLike).length;
    const isRerollCandidate = !isNewGrace
        && account.totalSessions === 0
        && rerollLikeMemberCount >= 2;
    const hasUnusedCleanupRisk = hasNeverStartedRisk || isRerollCandidate;
    const suspendReasons: SuspendReason[] = [];
    if (hasLongDormantRisk) suspendReasons.push('inactive_30d');
    if (hasNeverStartedRisk) suspendReasons.push('never_started');
    if (isRerollCandidate) suspendReasons.push('reroll');
    const cleanupCandidateMemberCount = memberSignals.filter((signal) => signal.isCleanupCandidate).length;

    return {
        isNewGrace,
        isInactive,
        isSuspendCandidate: !account.suspended && suspendReasons.length > 0,
        hasLongDormantRisk,
        hasUnusedCleanupRisk,
        hasNeverStartedRisk,
        isRerollCandidate,
        suspendReasons,
        suspendReasonLabels: toSuspendReasonLabels(suspendReasons),
        hasDuplicateNames: duplicateGroups.length > 0,
        duplicateNames: duplicateGroups.map(([name]) => name),
        cleanupCandidateMemberCount,
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
            case 'cleanup':
                return analysis.cleanupCandidateMemberCount > 0;
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
