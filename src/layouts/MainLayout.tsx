import React, { lazy, Suspense } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Footer } from '../components/Footer';

const HomeScreen = lazy(() =>
    import('../pages/HomeScreen').then((module) => ({ default: module.HomeScreen }))
);

const MenuPage = lazy(() =>
    import('../pages/MenuPage').then((module) => ({ default: module.MenuPage }))
);

const RecordPage = lazy(() =>
    import('../pages/RecordPage').then((module) => ({ default: module.RecordPage }))
);

const SettingsPage = lazy(() =>
    import('../pages/SettingsPage').then((module) => ({ default: module.SettingsPage }))
);

const StretchSession = lazy(() =>
    import('../pages/StretchSession').then((module) => ({ default: module.StretchSession }))
);

const PageFallback: React.FC = () => (
    <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Noto Sans JP', sans-serif",
        color: '#8395A7',
        fontSize: 14,
    }}>
        読み込み中...
    </div>
);

const tabs = [
    { key: 'home', Component: HomeScreen },
    { key: 'record', Component: RecordPage },
    { key: 'menu', Component: MenuPage },
    { key: 'settings', Component: SettingsPage },
] as const;

export const MainLayout: React.FC = () => {
    const currentTab = useAppStore((state) => state.currentTab);
    const isInSession = useAppStore((state) => state.isInSession);

    return (
        <>
            {/* Main app layout */}
            <div style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
            }}>
                {/* Tab Content — all pages stay mounted, only active one is visible */}
                <main style={{ flex: 1, height: '100%', width: '100%', overflow: 'hidden', position: 'relative' }}>
                    {tabs.map(({ key, Component }) => (
                        <div
                            key={key}
                            style={{
                                width: '100%',
                                height: '100%',
                                position: 'absolute',
                                visibility: currentTab === key ? 'visible' : 'hidden',
                                pointerEvents: currentTab === key ? 'auto' : 'none',
                            }}
                        >
                            <Suspense fallback={<PageFallback />}>
                                <Component />
                            </Suspense>
                        </div>
                    ))}
                </main>

                {/* Bottom Navigation */}
                <Footer />
            </div>

            {/* Stretch Session Overlay (triggered by FAB) */}
            {isInSession && (
                <Suspense fallback={null}>
                    <StretchSession />
                </Suspense>
            )}
        </>
    );
};
