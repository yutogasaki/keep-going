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

        let shouldTriggerModal: 'egg' | 'fairy' | 'adult' | null = null;

        users.forEach((user) => {
            if (!user.fuwafuwaBirthDate) {
                return;
            }

            const status = calculateFuwafuwaStatus(user.fuwafuwaBirthDate, allSessions);
            const currentStage = status.stage;

            if (!status.isSayonara && !(user.notifiedFuwafuwaStages || []).includes(currentStage)) {
                updateUser(user.id, { notifiedFuwafuwaStages: [...(user.notifiedFuwafuwaStages || []), currentStage] });

                if (currentStage === 1) {
                    shouldTriggerModal = 'egg';
                } else if (currentStage === 2) {
                    shouldTriggerModal = 'fairy';
                } else if (currentStage === 3) {
                    shouldTriggerModal = 'adult';
                }
            }
        });

        if (shouldTriggerModal) {
            setActiveMilestoneModal(shouldTriggerModal);
        }
    }, [allSessions, users, updateUser, setActiveMilestoneModal]);
}
