import type { LoginSyncPlanKind, SyncConflictResolution, SyncDataSummary } from '../../lib/sync';

interface LoginSyncMessageContext {
    action: LoginSyncPlanKind;
    localSummary?: SyncDataSummary;
    cloudSummary?: SyncDataSummary;
    resolution?: SyncConflictResolution;
}

function prefersCloudMessage(context: LoginSyncMessageContext): boolean {
    return context.resolution === 'cloud' || context.action === 'restore_from_cloud';
}

function prefersMergeMessage(context: LoginSyncMessageContext): boolean {
    return context.resolution === 'merge';
}

function hasRecordData(summary: SyncDataSummary): boolean {
    return summary.users > 0 ||
        summary.sessions > 0 ||
        summary.customExercises > 0 ||
        summary.customGroups > 0;
}

function formatSummary(summary?: SyncDataSummary): string | null {
    if (!summary) {
        return null;
    }

    if (!hasRecordData(summary) && summary.hasSettings) {
        return 'せってい';
    }

    const parts: string[] = [];
    if (summary.sessions > 0) {
        parts.push(`きろく${summary.sessions}回`);
    }
    if (summary.users > 0) {
        parts.push(`おこさま${summary.users}人`);
    }

    const customTotal = summary.customExercises + summary.customGroups;
    if (customTotal > 0) {
        parts.push(`カスタム${customTotal}件`);
    }

    if (summary.hasSettings) {
        parts.push('せってい');
    }

    return parts.length > 0 ? parts.join(' / ') : null;
}

function wrapSummary(message: string, summary?: SyncDataSummary): string {
    const detail = formatSummary(summary);
    return detail ? `${message}（${detail}）` : message;
}

export function getLoginSyncSuccessMessage(context: LoginSyncMessageContext): string {
    if (prefersCloudMessage(context)) {
        return wrapSummary('クラウドのデータを復元しました', context.cloudSummary);
    }

    if (prefersMergeMessage(context)) {
        return wrapSummary('両方のデータをまとめました', context.localSummary);
    }

    if (context.action === 'push_local') {
        return wrapSummary('この端末のデータを同期しました', context.localSummary);
    }

    if (context.action === 'merge') {
        return wrapSummary('両方のデータをまとめました', context.cloudSummary);
    }

    return 'ログインしました';
}

export function getLoginSyncFailureMessage(context: LoginSyncMessageContext): string {
    if (prefersCloudMessage(context)) {
        return 'クラウドのデータ復元に失敗しました。この端末のデータはそのままです。';
    }

    if (prefersMergeMessage(context)) {
        return '両方のデータのまとめに失敗しました。この端末のデータはそのままです。';
    }

    if (context.action === 'push_local') {
        return 'この端末のデータ同期に失敗しました。この端末のデータはそのままです。';
    }

    if (context.action === 'merge') {
        return '両方のデータのまとめに失敗しました。この端末のデータはそのままです。';
    }

    return 'ログイン後の同期に失敗しました。この端末のデータはそのままです。';
}
