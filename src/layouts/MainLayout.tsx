import React, { lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
                {/* Dynamic Main Content based on Tab */}
                <main style={{ flex: 1, height: '100%', width: '100%', overflow: 'hidden', position: 'relative' }}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentTab}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                            style={{ width: '100%', height: '100%', position: 'absolute' }}
                        >
                            <Suspense fallback={<PageFallback />}>
                                {currentTab === 'home' && <HomeScreen />}
                                {currentTab === 'record' && <RecordPage />}
                                {currentTab === 'menu' && <MenuPage />}
                                {currentTab === 'settings' && <SettingsPage />}
                            </Suspense>
                        </motion.div>
                    </AnimatePresence>
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
