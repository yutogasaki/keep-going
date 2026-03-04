import React from 'react';
import { Home, BarChart3, List, Settings } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { audio } from '../lib/audio';
import { haptics } from '../lib/haptics';

type TabId = 'home' | 'record' | 'menu' | 'settings';

export const Footer: React.FC = () => {
    const { currentTab, setTab, startSession } = useAppStore();

    const leftTabs: { id: TabId; icon: React.ElementType; label: string }[] = [
        { id: 'home', icon: Home, label: 'ホーム' },
        { id: 'record', icon: BarChart3, label: 'きろく' },
    ];

    const rightTabs: { id: TabId; icon: React.ElementType; label: string }[] = [
        { id: 'menu', icon: List, label: 'メニュー' },
        { id: 'settings', icon: Settings, label: 'せってい' },
    ];

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
            {/* Left tabs */}
            {leftTabs.map(({ id, icon: Icon, label }) => (
                <button
                    key={id}
                    onClick={() => setTab(id)}
                    aria-label={label}
                    aria-current={currentTab === id ? 'page' : undefined}
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
                        color: currentTab === id ? '#2BBAA0' : '#B2BEC3',
                        transition: 'color 0.2s ease',
                    }}
                >
                    <Icon size={22} strokeWidth={currentTab === id ? 2.5 : 2} />
                    <span style={{
                        fontSize: 10,
                        fontWeight: 500,
                        fontFamily: "'Noto Sans JP', sans-serif",
                    }}>{label}</span>
                </button>
            ))}

            {/* Center FAB */}
            <button
                className="fab"
                onClick={() => {
                    audio.initTTS();
                    haptics.pulse();
                    startSession();
                }}
                aria-label="ストレッチを始める"
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

            {/* Right tabs */}
            {rightTabs.map(({ id, icon: Icon, label }) => (
                <button
                    key={id}
                    onClick={() => {
                        audio.playTick();
                        haptics.tick();
                        setTab(id);
                    }}
                    aria-label={label}
                    aria-current={currentTab === id ? 'page' : undefined}
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
                        color: currentTab === id ? '#2BBAA0' : '#B2BEC3',
                        transition: 'color 0.2s ease',
                    }}
                >
                    <Icon size={22} strokeWidth={currentTab === id ? 2.5 : 2} />
                    <span style={{
                        fontSize: 10,
                        fontWeight: 500,
                        fontFamily: "'Noto Sans JP', sans-serif",
                    }}>{label}</span>
                </button>
            ))}
        </nav>
    );
};
