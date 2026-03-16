import React from 'react';
import { Home, BarChart3, List, Settings } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { audio } from '../lib/audio';
import { haptics } from '../lib/haptics';

type TabId = 'home' | 'record' | 'menu' | 'settings';
type FooterTab = { id: TabId; icon: React.ElementType; label: string };

const leftTabs: FooterTab[] = [
    { id: 'home', icon: Home, label: 'ホーム' },
    { id: 'record', icon: BarChart3, label: 'きろく' },
];

const rightTabs: FooterTab[] = [
    { id: 'menu', icon: List, label: 'メニュー' },
    { id: 'settings', icon: Settings, label: 'せってい' },
];

export const Footer: React.FC = () => {
    const currentTab = useAppStore((state) => state.currentTab);
    const setTab = useAppStore((state) => state.setTab);
    const startSession = useAppStore((state) => state.startSession);

    const handleTabChange = (tabId: TabId) => {
        if (tabId === currentTab) {
            return;
        }

        haptics.tick();
        setTab(tabId);
    };

    const handleStartSession = () => {
        audio.initTTS();
        haptics.pulse();
        startSession();
    };

    const renderTabButton = ({ id, icon: Icon, label }: FooterTab) => {
        const isActive = currentTab === id;

        return (
            <button
                key={id}
                type="button"
                aria-label={label}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => handleTabChange(id)}
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    padding: '8px 16px',
                    color: isActive ? '#2BBAA0' : '#B2BEC3',
                    transition: 'color 0.2s ease',
                }}
            >
                <Icon
                    size={22}
                    strokeWidth={isActive ? 2.5 : 2}
                    style={{ pointerEvents: 'none' }}
                    aria-hidden="true"
                />
                <span style={{
                    fontSize: 10,
                    fontWeight: 500,
                    fontFamily: "'Noto Sans JP', sans-serif",
                    pointerEvents: 'none',
                }}>{label}</span>
            </button>
        );
    };

    return (
        <nav
            className="footer-nav"
            style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 'calc(56px + env(safe-area-inset-bottom, 0px))',
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                background: 'var(--toolbar-bg)',
                backdropFilter: 'blur(var(--blur-lg))',
                WebkitBackdropFilter: 'blur(var(--blur-lg))',
                borderTop: '1px solid rgba(0,0,0,0.06)',
                boxShadow: 'var(--toolbar-shadow)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-around',
                zIndex: 50,
            }}
        >
            {leftTabs.map(renderTabButton)}

            <button
                className="fab"
                type="button"
                aria-label="ストレッチを始める"
                onClick={handleStartSession}
            >
                <div style={{
                    width: 0,
                    height: 0,
                    borderTop: '10px solid transparent',
                    borderBottom: '10px solid transparent',
                    borderLeft: '16px solid white',
                    marginLeft: 4,
                }} />
            </button>

            {rightTabs.map(renderTabButton)}
        </nav>
    );
};
