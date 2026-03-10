import { useEffect } from 'react';
import type { SessionRecord } from '../../../lib/db';
import { calculateFuwafuwaStatus } from '../../../lib/fuwafuwa';
import type { UserProfileStore } from '../../../store/useAppStore';

interface UseHomeMilestoneWatcherParams {
    allSessions: SessionRecord[];
    users: UserProfileStore[];
    updateUser: (id: string, updates: Partial<UserProfileStore>) => void;
    setActiveMilestoneModal: (modal: 'egg' | 'fairy' | 'adult' | null) => void;
}

export function useHomeMilestoneWatcher({
    allSessions,
    users,
    updateUser,
    setActiveMilestoneModal,
}: UseHomeMilestoneWatcherParams) {
    useEffect(() => {
        if (allSessions.length === 0 || users.length === 0) {
            return;
        }

        // Show one milestone modal at a time: find the first user with an
        // un-notified stage. Only mark *that* user as notified so subsequent
        // renders pick up the next user's milestone.
        for (const user of users) {
            if (!user.fuwafuwaBirthDate) {
                continue;
            }

            // Filter sessions to only include ones this user participated in.
            // Sessions with empty userIds are attributed to all users.
            const userSessions = allSessions.filter(
                (s) => !s.userIds || s.userIds.length === 0 || s.userIds.includes(user.id),
            );

            const status = calculateFuwafuwaStatus(user.fuwafuwaBirthDate, userSessions);
            const currentStage = status.stage;

            if (!status.isSayonara && !(user.notifiedFuwafuwaStages || []).includes(currentStage)) {
                updateUser(user.id, { notifiedFuwafuwaStages: [...(user.notifiedFuwafuwaStages || []), currentStage] });

                const modal: 'egg' | 'fairy' | 'adult' | null =
                    currentStage === 1 ? 'egg'
                        : currentStage === 2 ? 'fairy'
                            : currentStage === 3 ? 'adult'
                                : null;
                if (modal) {
                    setActiveMilestoneModal(modal);
                }
                // Only process one milestone per render cycle
                return;
            }
        }
    }, [allSessions, users, updateUser, setActiveMilestoneModal]);
}
