import type {
    SyncConflictPromptData,
    SyncConflictResolution,
    SyncDataSummary,
} from './loginSync';

function hasRecordData(summary: SyncDataSummary): boolean {
    return summary.users > 0 ||
        summary.sessions > 0 ||
        summary.customExercises > 0 ||
        summary.customGroups > 0;
}

function hasSettingsOnly(summary: SyncDataSummary): boolean {
    return !hasRecordData(summary) && summary.hasSettings;
}

function hasCloudData(summary: SyncDataSummary): boolean {
    return hasRecordData(summary) || summary.hasSettings;
}

function getRecordWeight(summary: SyncDataSummary): number {
    return summary.sessions * 100 +
        summary.users * 10 +
        summary.customExercises * 3 +
        summary.customGroups * 3 +
        (summary.hasSettings ? 1 : 0);
}

function getCustomAssetTotal(summary: SyncDataSummary): number {
    return summary.customExercises + summary.customGroups;
}

function buildSummaryDetail(summary: SyncDataSummary): string {
    if (!hasCloudData(summary)) {
        return 'まだデータはありません';
    }

    if (hasSettingsOnly(summary)) {
        return 'せっていだけがあります';
    }

    const parts: string[] = [];

    if (summary.sessions > 0) {
        parts.push(`きろく ${summary.sessions}回`);
    }

    if (summary.users > 0) {
        parts.push(`おこさま ${summary.users}人`);
    }

    if (getCustomAssetTotal(summary) > 0) {
        parts.push(`カスタム ${getCustomAssetTotal(summary)}件`);
    }

    if (summary.hasSettings) {
        parts.push('せっていあり');
    }

    return parts.join(' / ');
}

function decideRecommendedResolution({
    localSummary,
    cloudSummary,
}: {
    localSummary: SyncDataSummary;
    cloudSummary: SyncDataSummary;
}): {
    recommendedResolution: SyncConflictResolution | null;
    recommendationReason: string | null;
} {
    if (localSummary.sessions !== cloudSummary.sessions) {
        if (cloudSummary.sessions > localSummary.sessions) {
            return {
                recommendedResolution: 'cloud',
                recommendationReason: 'クラウドのほうに記録が多いので、クラウドを使うのがおすすめです。',
            };
        }

        return {
            recommendedResolution: 'merge',
            recommendationReason: 'この端末のほうに記録が多いので、この端末をベースにまとめるのがおすすめです。',
        };
    }

    if (localSummary.users !== cloudSummary.users) {
        if (cloudSummary.users > localSummary.users) {
            return {
                recommendedResolution: 'cloud',
                recommendationReason: 'クラウドのほうに登録されているおこさまが多いです。',
            };
        }

        return {
            recommendedResolution: 'merge',
            recommendationReason: 'この端末のほうに登録されているおこさまが多いです。',
        };
    }

    const localCustomTotal = getCustomAssetTotal(localSummary);
    const cloudCustomTotal = getCustomAssetTotal(cloudSummary);
    if (localCustomTotal !== cloudCustomTotal) {
        if (cloudCustomTotal > localCustomTotal) {
            return {
                recommendedResolution: 'cloud',
                recommendationReason: 'クラウドのほうにカスタム項目が多いです。',
            };
        }

        return {
            recommendedResolution: 'merge',
            recommendationReason: 'この端末のほうにカスタム項目が多いです。',
        };
    }

    if (localSummary.hasSettings !== cloudSummary.hasSettings) {
        if (cloudSummary.hasSettings) {
            return {
                recommendedResolution: 'cloud',
                recommendationReason: 'クラウド側には保存済みのせっていがあります。',
            };
        }

        return {
            recommendedResolution: 'merge',
            recommendationReason: 'この端末側には保存済みのせっていがあります。',
        };
    }

    const localWeight = getRecordWeight(localSummary);
    const cloudWeight = getRecordWeight(cloudSummary);
    if (localWeight === cloudWeight) {
        return {
            recommendedResolution: null,
            recommendationReason: null,
        };
    }

    return cloudWeight > localWeight
        ? {
            recommendedResolution: 'cloud',
            recommendationReason: 'クラウドのほうが情報量が多いです。',
        }
        : {
            recommendedResolution: 'merge',
            recommendationReason: 'この端末のほうが情報量が多いです。',
        };
}

export function buildSyncConflictPrompt({
    localSummary,
    cloudSummary,
}: {
    localSummary: SyncDataSummary;
    cloudSummary: SyncDataSummary;
}): SyncConflictPromptData {
    const recommendation = decideRecommendedResolution({
        localSummary,
        cloudSummary,
    });

    return {
        localSummary,
        cloudSummary,
        localDetail: buildSummaryDetail(localSummary),
        cloudDetail: buildSummaryDetail(cloudSummary),
        recommendedResolution: recommendation.recommendedResolution,
        recommendationReason: recommendation.recommendationReason,
    };
}
