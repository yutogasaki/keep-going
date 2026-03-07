import React, { lazy, Suspense, useEffect, useState } from 'react';
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
    const [mountedTabs, setMountedTabs] = useState({
        home: true,
        record: false,
        menu: false,
        settings: false,
    });

    useEffect(() => {
        setMountedTabs((previous) => (
            previous[currentTab]
                ? previous
                : { ...previous, [currentTab]: true }
        ));
    }, [currentTab]);

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
                <main style={{ flex: 1, height: '100%', width: '100%', overflow: 'hidden', position: 'relative' }}>
                    {tabs.map(({ key, Component }) => {
                        if (!mountedTabs[key]) {
                            return null;
                        }

                        return (
                            <div
                                key={key}
                                style={{
                                    display: currentTab === key ? 'block' : 'none',
                                    width: '100%',
                                    height: '100%',
                                }}
                            >
                                <Suspense fallback={<PageFallback />}>
                                    <Component />
                                </Suspense>
                            </div>
                        );
                    })}
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
