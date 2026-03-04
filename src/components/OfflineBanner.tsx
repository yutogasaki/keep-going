import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

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

    if (!isOffline) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1500,
            background: 'rgba(45, 52, 54, 0.9)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
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
        }}>
            <WifiOff size={14} />
            オフライン
        </div>
    );
};
