import React, { useEffect, useState } from 'react';
import { AlertTriangle, WifiOff } from 'lucide-react';
import { useSyncStatus } from '../store/useSyncStatus';
import { FLOATING_UI_BOTTOM } from '../lib/styles';

export const OfflineBanner: React.FC = () => {
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const failedCount = useSyncStatus((s) => s.failedCount);
    const clearFailure = useSyncStatus((s) => s.clearFailure);

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const showSyncError = !isOffline && failedCount > 0;

    if (!isOffline && !showSyncError) return null;

    return (
        <div
            onClick={showSyncError ? clearFailure : undefined}
            style={{
                position: 'fixed',
                bottom: FLOATING_UI_BOTTOM,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1500,
                background: isOffline ? 'rgba(45, 52, 54, 0.9)' : 'rgba(225, 112, 85, 0.9)',
                backdropFilter: 'blur(var(--blur-sm))',
                WebkitBackdropFilter: 'blur(var(--blur-sm))',
                color: '#fff',
                padding: '8px 16px',
                borderRadius: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                fontFamily: "'Noto Sans JP', sans-serif",
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                cursor: showSyncError ? 'pointer' : 'default',
            }}
        >
            {isOffline ? (
                <>
                    <WifiOff size={14} />
                    オフライン
                </>
            ) : (
                <>
                    <AlertTriangle size={14} />
                    同期に失敗しました（タップで消す）
                </>
            )}
        </div>
    );
};
