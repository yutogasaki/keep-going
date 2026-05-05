import { useCallback, useEffect, useState } from 'react';
import {
    fetchMyActivePersonalChallengeCount,
    getRemainingPersonalChallengeSlots,
    isPersonalChallengeLimitReached,
    PERSONAL_CHALLENGE_ACTIVE_LIMIT,
} from '@/lib/personalChallenges';
import { getAccountId } from '@/lib/sync/authState';
import type { UserProfileStore } from '@/store/useAppStore';

export function usePersonalChallengeLimit({
    open,
    member,
    isEditing,
}: {
    open: boolean;
    member: UserProfileStore | null;
    isEditing: boolean;
}) {
    const [activeChallengeCount, setActiveChallengeCount] = useState(0);
    const [activeCountLoading, setActiveCountLoading] = useState(false);

    useEffect(() => {
        if (!open || !member || isEditing) {
            setActiveChallengeCount(0);
            setActiveCountLoading(false);
            return;
        }

        let cancelled = false;
        setActiveCountLoading(true);

        fetchMyActivePersonalChallengeCount(member.id)
            .then((count) => {
                if (!cancelled) {
                    setActiveChallengeCount(count);
                }
            })
            .catch((error) => {
                console.warn('[personalChallenges] active count load failed:', error);
                if (!cancelled) {
                    setActiveChallengeCount(0);
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setActiveCountLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [isEditing, member, open]);

    const markLimitReached = useCallback(() => {
        setActiveChallengeCount(PERSONAL_CHALLENGE_ACTIVE_LIMIT);
    }, []);

    return {
        activeCountLoading,
        hasChallengeAccount: Boolean(getAccountId()),
        limitReached: !isEditing && isPersonalChallengeLimitReached(activeChallengeCount),
        markLimitReached,
        remainingSlots: getRemainingPersonalChallengeSlots(activeChallengeCount),
    };
}
