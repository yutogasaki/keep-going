import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getCustomGroups } from '../../../lib/customGroups';
import { getAllSessions, getCustomExercises } from '../../../lib/db';
import { getSyncQueueSnapshot, type SyncQueueSnapshot } from '../../../lib/sync/queue';
import { useAppStore } from '../../../store/useAppStore';
import { useSyncStatus } from '../../../store/useSyncStatus';
import { getAppSettingsSnapshot } from '../../../contexts/auth/settingsSnapshot';
import { SYNCED_ACCOUNT_KEY } from '../../../contexts/auth/constants';

interface LocalSyncSnapshot {
    syncedAccountId: string | null;
    sessionCount: number;
    latestSessionDate: string | null;
    latestSessionStartedAt: string | null;
    customExerciseCount: number;
    customGroupCount: number;
    queue: SyncQueueSnapshot;
    settings: ReturnType<typeof getAppSettingsSnapshot>;
}

function formatAccountId(accountId: string | null): string {
    if (!accountId) {
        return '未同期';
    }

    if (accountId.length <= 12) {
        return accountId;
    }

    return `${accountId.slice(0, 8)}...${accountId.slice(-4)}`;
}

function formatQueueSummary(queue: SyncQueueSnapshot): string {
    if (queue.count === 0) {
        return '待機なし';
    }

    const tableSummary = Object.entries(queue.byTable)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([table, count]) => `${table} ${count}`)
        .join(' / ');

    const retrying = queue.retryingCount > 0 ? ` / retry ${queue.retryingCount}` : '';
    return `${queue.count}件${retrying}${tableSummary ? ` / ${tableSummary}` : ''}`;
}

function formatSettingsSummary(settings: ReturnType<typeof getAppSettingsSnapshot>): string {
    return [
        settings.onboardingCompleted ? 'onboarding 完了' : 'onboarding 未完了',
        settings.notificationsEnabled ? `通知 ON ${settings.notificationTime}` : '通知 OFF',
        settings.ttsEnabled ? 'TTS ON' : 'TTS OFF',
        settings.bgmEnabled ? 'BGM ON' : 'BGM OFF',
        settings.hapticEnabled ? '振動 ON' : '振動 OFF',
    ].join(' / ');
}

export const SyncDebugSection: React.FC = () => {
    const users = useAppStore((state) => state.users);
    const failedCount = useSyncStatus((state) => state.failedCount);
    const lastError = useSyncStatus((state) => state.lastError);
    const [snapshot, setSnapshot] = useState<LocalSyncSnapshot | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');

    const loadSnapshot = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const [sessions, customExercises, customGroups, queue] = await Promise.all([
                getAllSessions(),
                getCustomExercises(),
                getCustomGroups(),
                getSyncQueueSnapshot(),
            ]);

            setSnapshot({
                syncedAccountId: localStorage.getItem(SYNCED_ACCOUNT_KEY),
                sessionCount: sessions.length,
                latestSessionDate: sessions[0]?.date ?? null,
                latestSessionStartedAt: sessions[0]?.startedAt ?? null,
                customExerciseCount: customExercises.length,
                customGroupCount: customGroups.length,
                queue,
                settings: getAppSettingsSnapshot(),
            });
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : String(loadError));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSnapshot();
    }, [loadSnapshot]);

    const snapshotJson = useMemo(() => {
        if (!snapshot) {
            return null;
        }

        return JSON.stringify({
            syncedAccountId: snapshot.syncedAccountId,
            users: users.map((user) => ({
                id: user.id,
                name: user.name,
                classLevel: user.classLevel,
            })),
            sessionCount: snapshot.sessionCount,
            latestSessionDate: snapshot.latestSessionDate,
            latestSessionStartedAt: snapshot.latestSessionStartedAt,
            customExerciseCount: snapshot.customExerciseCount,
            customGroupCount: snapshot.customGroupCount,
            queue: snapshot.queue,
            syncFailures: {
                failedCount,
                lastError,
            },
            settings: snapshot.settings,
        }, null, 2);
    }, [failedCount, lastError, snapshot, users]);

    const handleCopy = useCallback(async () => {
        if (!snapshotJson || !navigator.clipboard) {
            setCopyState('error');
            return;
        }

        try {
            await navigator.clipboard.writeText(snapshotJson);
            setCopyState('copied');
        } catch {
            setCopyState('error');
        }
    }, [snapshotJson]);

    return (
        <div style={{ marginTop: '12px', borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '12px' }}>
            <p style={{ fontSize: 12, color: '#2D3436', margin: '0 0 8px', fontWeight: 700 }}>Sync snapshot</p>
            <p style={{ fontSize: 11, color: '#8395A7', margin: '0 0 10px', lineHeight: 1.6 }}>
                restore の前後で、ローカルの users / sessions / custom data / settings / queue を見比べるための簡易 snapshot
            </p>

            {snapshot && (
                <div style={{ fontSize: 11, color: '#2D3436', display: 'grid', gap: 6, marginBottom: 10 }}>
                    <div>synced account: {formatAccountId(snapshot.syncedAccountId)}</div>
                    <div>users: {users.length}人{users.length > 0 ? ` / ${users.map((user) => user.name).join(', ')}` : ''}</div>
                    <div>sessions: {snapshot.sessionCount}件 / 最新 {snapshot.latestSessionDate ?? 'なし'}</div>
                    <div>custom exercises: {snapshot.customExerciseCount}件</div>
                    <div>custom groups: {snapshot.customGroupCount}件</div>
                    <div>settings: {formatSettingsSummary(snapshot.settings)}</div>
                    <div>sync queue: {formatQueueSummary(snapshot.queue)}</div>
                    <div>
                        sync error: {failedCount > 0 ? `${failedCount}件 / ${lastError ?? 'unknown error'}` : 'なし'}
                    </div>
                </div>
            )}

            {error && (
                <div style={{ fontSize: 11, color: '#E17055', marginBottom: 10 }}>
                    snapshot 読み込み失敗: {error}
                </div>
            )}

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                    type="button"
                    onClick={() => {
                        setCopyState('idle');
                        loadSnapshot();
                    }}
                    disabled={loading}
                    style={{
                        padding: '4px 12px',
                        fontSize: 11,
                        borderRadius: 6,
                        border: '1px solid #2BBAA0',
                        background: '#fff',
                        color: '#2BBAA0',
                        cursor: loading ? 'default' : 'pointer',
                    }}
                >
                    {loading ? '読込中...' : 'snapshot 再読み込み'}
                </button>

                <button
                    type="button"
                    onClick={handleCopy}
                    disabled={!snapshotJson}
                    style={{
                        padding: '4px 12px',
                        fontSize: 11,
                        borderRadius: 6,
                        border: '1px solid #8395A7',
                        background: '#fff',
                        color: '#636E72',
                        cursor: snapshotJson ? 'pointer' : 'default',
                    }}
                >
                    {copyState === 'copied' ? 'JSON コピー済み' : copyState === 'error' ? 'コピー失敗' : 'JSON をコピー'}
                </button>
            </div>
        </div>
    );
};
