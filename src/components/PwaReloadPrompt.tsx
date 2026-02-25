import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { audio } from '../lib/audio';

// Vite injects this at build time (see vite.config.ts)
// Fallback to window object if environment variables aren't available
const getAppVersion = () => {
    try {
        return import.meta.env.VITE_APP_VERSION || (window as any).__APP_VERSION__;
    } catch (e) {
        return (window as any).__APP_VERSION__;
    }
};

const APP_VERSION = getAppVersion();

export const PwaReloadPrompt: React.FC = () => {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegisteredSW(swUrl, r) {
            console.log('SW Registered:', swUrl);

            // Periodically check for updates (every 1 hour)
            if (r) {
                setInterval(() => {
                    console.log('Checking for SW updates...');
                    r.update();
                }, 60 * 60 * 1000);
            }
        },
        onRegisterError(error) {
            console.error('SW registration error', error);
        },
    });

    const close = () => {
        setOfflineReady(false);
        setNeedRefresh(false);
    };

    // Custom Version Polling (Extra Safety)
    const [hasVersionMismatch, setHasVersionMismatch] = useState(false);

    useEffect(() => {
        // Only run polling if we have an injected APP_VERSION
        if (!APP_VERSION) return;

        const checkVersion = async () => {
            try {
                // Fetch version.json from the server, adding a cache-buster query parameter
                const res = await fetch(`/version.json?t=${Date.now()}`, {
                    cache: 'no-store', // explicitly tell fetch not to cache this
                    headers: { 'Cache-Control': 'no-cache' }
                });

                if (res.ok) {
                    const data = await res.json();

                    // Add defensive checks
                    if (data && data.version && APP_VERSION) {
                        // Compare as strings to prevent type mismatch issues
                        const serverVersion = String(data.version);
                        const clientVersion = String(APP_VERSION);

                        if (serverVersion !== clientVersion) {
                            console.warn(`[PWA] Version mismatch detected! Client: ${clientVersion}, Server: ${serverVersion}`);
                            setHasVersionMismatch(true);
                        } else {
                            // Version matched, clear flag just in case
                            setHasVersionMismatch(false);
                        }
                    }
                }
            } catch (err) {
                console.warn("[PWA] Failed to check version.json (might be offline)", err);
            }
        };

        // Check immediately on mount, and then every 10 minutes
        checkVersion();
        const intervalId = setInterval(checkVersion, 10 * 60 * 1000);

        // Also check when the app returns from background (useful for iOS PWA)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                checkVersion();
                // Also poke the SW to check for updates
                navigator.serviceWorker.getRegistration().then(reg => {
                    if (reg) reg.update();
                });
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            clearInterval(intervalId);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    // Combine standard SW update flag with our custom polling flag
    const showUpdateBanner = needRefresh || hasVersionMismatch;

    useEffect(() => {
        if (showUpdateBanner) {
            // Play a soft notification sound if audio is enabled
            audio.playTransition();
        }
    }, [showUpdateBanner]);

    const handleUpdate = async () => {
        if (needRefresh) {
            // Standard vite-plugin-pwa flow: wait for the new SW to control, then reload
            updateServiceWorker(true);
        } else if (hasVersionMismatch) {
            // Manual fallback: Aggressive SW unregister and hard reload
            try {
                if ('serviceWorker' in navigator) {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    for (let registration of registrations) {
                        await registration.unregister();
                        console.log('[PWA] Unregistered service worker');
                    }
                }

                // Also clear standard caches just in case
                if ('caches' in window) {
                    const keys = await caches.keys();
                    for (const key of keys) {
                        await caches.delete(key);
                        console.log(`[PWA] Cleared cache: ${key}`);
                    }
                }
            } catch (err) {
                console.error('[PWA] Error clearing cache/sw:', err);
            } finally {
                // Force a hard reload from server
                window.location.href = window.location.href.split('?')[0] + '?v=' + Date.now();
            }
        }
    };

    return (
        <AnimatePresence>
            {(showUpdateBanner || offlineReady) && (
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
                                {showUpdateBanner ? "新しいバージョンがあります 🎉" : "オフライン対応完了 ✨"}
                            </h3>
                            <p style={{
                                margin: '4px 0 0',
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 13,
                                color: '#636E72',
                                lineHeight: 1.4
                            }}>
                                {showUpdateBanner
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

                    {showUpdateBanner && (
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
