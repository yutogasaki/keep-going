export { registerStoreAccessor } from './sync/storeAccess';
export { setAccountId, getAccountId, isPulling } from './sync/authState';

export { processQueue, clearSyncQueue } from './sync/queue';

export {
    pushSession,
    pushFamilyMember,
    deleteFamilyMember,
    pushCustomExercise,
    deleteCustomExerciseRemote,
    pushMenuGroup,
    deleteMenuGroupRemote,
    pushAppSettings,
} from './sync/push';

export { initialSync, setupOnlineListener } from './sync/initial';

export {
    pullAndMerge,
    restoreFromCloud,
    fetchCloudSyncSnapshot,
    buildRestoredStoreState,
    type PullResult,
    type CloudSyncSnapshot,
} from './sync/pull';

export {
    inspectLoginSyncPlan,
    decideLoginSyncPlan,
    hasCloudData,
    type LoginSyncPlan,
    type LoginSyncPlanKind,
    type SyncDataSummary,
    type SyncConflictPromptData,
    type SyncConflictResolution,
} from './sync/loginSync';

export type { AppSettingsInput } from './sync/mappers';
