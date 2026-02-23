import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { Footer } from '../components/Footer';
import { HomeScreen } from '../pages/HomeScreen';
import { MenuPage } from '../pages/MenuPage';
import { RecordPage } from '../pages/RecordPage';
import { SettingsPage } from '../pages/SettingsPage';
import { StretchSession } from '../pages/StretchSession';

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
                            {currentTab === 'home' && <HomeScreen />}
                            {currentTab === 'record' && <RecordPage />}
                            {currentTab === 'menu' && <MenuPage />}
                            {currentTab === 'settings' && <SettingsPage />}
                        </motion.div>
                    </AnimatePresence>
                </main>

                {/* Bottom Navigation */}
                <Footer />
            </div>

            {/* Stretch Session Overlay (triggered by FAB) */}
            {isInSession && <StretchSession />}
        </>
    );
};
