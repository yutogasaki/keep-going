import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { audio } from '../lib/audio';

export const PwaReloadPrompt: React.FC = () => {
    const registrationRef = useRef<ServiceWorkerRegistration | undefined>();
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegisteredSW(_swUrl, r) {
            registrationRef.current = r;
        },
        onRegisterError(error) {
            console.error('SW registration error', error);
        },
    });

    // Single unified update check: periodic (10 min) + visibilitychange
    useEffect(() => {
        const checkForUpdate = () => {
            registrationRef.current?.update();
        };

        const intervalId = window.setInterval(checkForUpdate, 10 * 60 * 1000);

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                checkForUpdate();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.clearInterval(intervalId);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    const close = () => {
        setOfflineReady(false);
        setNeedRefresh(false);
    };

    useEffect(() => {
        if (needRefresh) {
            audio.playTransition();
        }
    }, [needRefresh]);

    const handleUpdate = () => {
        updateServiceWorker(true);
    };

    return (
        <AnimatePresence>
            {(needRefresh || offlineReady) && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    style={{
                        position: 'fixed',
                        bottom: 80, // Above bottom nav
                        left: 20,
                        right: 20,
                        zIndex: 9999,
                        background: 'white',
                        borderRadius: 16,
                        padding: '16px 20px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.04)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                        border: '1px solid rgba(43,186,160,0.1)'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                            <h3 style={{
                                margin: 0,
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 15,
                                fontWeight: 700,
                                color: '#2D3436'
                            }}>
                                {needRefresh ? "新しいバージョンがあります 🎉" : "オフライン対応完了 ✨"}
                            </h3>
                            <p style={{
                                margin: '4px 0 0',
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 13,
                                color: '#636E72',
                                lineHeight: 1.4
                            }}>
                                {needRefresh
                                    ? "最新の機能を使うためにアプリを更新してください。"
                                    : "このアプリはオフラインでも動作するようになりました。"}
                            </p>
                        </div>
                        <button
                            onClick={close}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 4,
                                color: '#B2BEC3',
                                display: 'flex'
                            }}
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {needRefresh && (
                        <button
                            onClick={handleUpdate}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: 12,
                                border: 'none',
                                background: '#2BBAA0',
                                color: 'white',
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 14,
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 8
                            }}
                        >
                            <RefreshCw size={16} />
                            今すぐ更新する
                        </button>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};
