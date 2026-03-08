import type { LoginSyncPlanKind, SyncConflictResolution } from '../../lib/sync';

interface LoginSyncMessageContext {
    action: LoginSyncPlanKind;
    resolution?: SyncConflictResolution;
}

function prefersCloudMessage(context: LoginSyncMessageContext): boolean {
    return context.resolution === 'cloud' || context.action === 'restore_from_cloud';
}

function prefersLocalMessage(context: LoginSyncMessageContext): boolean {
    return context.resolution === 'local' || context.action === 'push_local';
}

export function getLoginSyncSuccessMessage(context: LoginSyncMessageContext): string {
    if (prefersCloudMessage(context)) {
        return 'クラウドのデータを復元しました';
    }

    if (prefersLocalMessage(context)) {
        return 'この端末のデータを同期しました';
    }

    if (context.action === 'merge') {
        return '同期が完了しました';
    }

    return 'ログインしました';
}

export function getLoginSyncFailureMessage(context: LoginSyncMessageContext): string {
    if (prefersCloudMessage(context)) {
        return 'クラウドのデータ復元に失敗しました';
    }

    if (prefersLocalMessage(context)) {
        return 'この端末のデータ同期に失敗しました';
    }

    if (context.action === 'merge') {
        return 'データの同期に失敗しました';
    }

    return 'ログイン後の同期に失敗しました';
}
