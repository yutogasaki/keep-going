import { getTodayKey } from '../../../lib/db';
import type { AppState, PastFuwafuwaRecord } from '../types';
import type { AppStateSet } from './shared';

type UserSlice = Pick<
    AppState,
    | 'users'
    | 'sessionUserIds'
    | 'setSessionUserIds'
    | 'addUser'
    | 'updateUser'
    | 'updateUserSettings'
    | 'deleteUser'
    | 'consumeUserMagicEnergy'
    | 'addChibifuwa'
    | 'addChallengeStars'
    | 'resetUserFuwafuwa'
>;

export function createUserSlice(set: AppStateSet): UserSlice {
    return {
        users: [],
        sessionUserIds: [],
        setSessionUserIds: (ids) => set({ sessionUserIds: ids }),
        addUser: (user) => set((state) => ({
            users: [
                ...state.users,
                {
                    ...user,
                    id: crypto.randomUUID(),
                    dailyTargetMinutes: 10,
                    excludedExercises: [],
                    requiredExercises: [],
                    challengeStars: 0,
                    chibifuwas: [],
                },
            ],
        })),
        updateUser: (id, updates) => set((state) => ({
            users: state.users.map((user) => (user.id === id ? { ...user, ...updates } : user)),
        })),
        updateUserSettings: (id, updates) => set((state) => ({
            users: state.users.map((user) => (user.id === id ? { ...user, ...updates } : user)),
        })),
        deleteUser: (id) => set((state) => ({
            users: state.users.filter((user) => user.id !== id),
            sessionUserIds: state.sessionUserIds.filter((userId) => userId !== id),
            homeVisitMemory: {
                soloByUserId: Object.fromEntries(
                    Object.entries(state.homeVisitMemory.soloByUserId).filter(([userId]) => userId !== id),
                ),
                familyByUserSet: Object.fromEntries(
                    Object.entries(state.homeVisitMemory.familyByUserSet).filter(([key]) => !key.split('|').includes(id)),
                ),
            },
        })),
        consumeUserMagicEnergy: (id, seconds) => set((state) => ({
            users: state.users.map((user) => (
                user.id === id
                    ? { ...user, consumedMagicSeconds: (user.consumedMagicSeconds || 0) + seconds }
                    : user
            )),
        })),
        addChibifuwa: (userId, record) => set((state) => ({
            users: state.users.map((user) => (
                user.id === userId
                    ? { ...user, chibifuwas: [...(user.chibifuwas || []), { ...record, id: crypto.randomUUID() }] }
                    : user
            )),
        })),
        addChallengeStars: (userId, amount) => set((state) => ({
            users: state.users.map((user) => (
                user.id === userId
                    ? { ...user, challengeStars: Math.max(0, (user.challengeStars ?? 0) + amount) }
                    : user
            )),
        })),
        resetUserFuwafuwa: (id, newType, activeDays, finalStage) => set((state) => {
            const today = getTodayKey();
            return {
                users: state.users.map((user) => {
                    if (user.id !== id) {
                        return user;
                    }

                    const record: PastFuwafuwaRecord = {
                        id: crypto.randomUUID(),
                        name: user.fuwafuwaName,
                        type: user.fuwafuwaType,
                        activeDays,
                        finalStage,
                        sayonaraDate: today,
                    };

                    return {
                        ...user,
                        fuwafuwaBirthDate: today,
                        fuwafuwaType: newType,
                        fuwafuwaCycleCount: user.fuwafuwaCycleCount + 1,
                        fuwafuwaName: null,
                        pastFuwafuwas: [...(user.pastFuwafuwas || []), record],
                        notifiedFuwafuwaStages: [],
                    };
                }),
            };
        }),
    };
}
