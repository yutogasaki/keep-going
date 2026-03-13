import { getFamilyVisitMemoryKey } from '../../../pages/home/homeVisitMemory';
import type { AppState } from '../types';
import type { AppStateSet } from './shared';

type HomeSlice = Pick<
    AppState,
    | 'dismissedHomeAnnouncementIds'
    | 'dismissHomeAnnouncement'
    | 'homeVisitMemory'
    | 'markSoloHomeVisit'
    | 'markFamilyHomeVisit'
    | 'joinedChallengeIds'
    | 'joinChallenge'
>;

export function createHomeSlice(set: AppStateSet): HomeSlice {
    return {
        dismissedHomeAnnouncementIds: [],
        dismissHomeAnnouncement: (announcementId) => set((state) => {
            if (!announcementId || state.dismissedHomeAnnouncementIds.includes(announcementId)) {
                return state;
            }

            return {
                dismissedHomeAnnouncementIds: [...state.dismissedHomeAnnouncementIds, announcementId],
            };
        }),
        homeVisitMemory: {
            soloByUserId: {},
            familyByUserSet: {},
        },
        markSoloHomeVisit: (userId, visitedAt) => set((state) => {
            if (!userId || !visitedAt || state.homeVisitMemory.soloByUserId[userId] === visitedAt) {
                return state;
            }

            return {
                homeVisitMemory: {
                    ...state.homeVisitMemory,
                    soloByUserId: {
                        ...state.homeVisitMemory.soloByUserId,
                        [userId]: visitedAt,
                    },
                },
            };
        }),
        markFamilyHomeVisit: (userIds, visitedAt) => set((state) => {
            const key = getFamilyVisitMemoryKey(userIds);
            if (!key || !visitedAt || state.homeVisitMemory.familyByUserSet[key] === visitedAt) {
                return state;
            }

            return {
                homeVisitMemory: {
                    ...state.homeVisitMemory,
                    familyByUserSet: {
                        ...state.homeVisitMemory.familyByUserSet,
                        [key]: visitedAt,
                    },
                },
            };
        }),
        joinedChallengeIds: {},
        joinChallenge: (userId, challengeId) => set((state) => {
            const joinedForUser = state.joinedChallengeIds[userId] || [];
            if (joinedForUser.includes(challengeId)) {
                return state;
            }

            return {
                joinedChallengeIds: {
                    ...state.joinedChallengeIds,
                    [userId]: [...joinedForUser, challengeId],
                },
            };
        }),
    };
}
