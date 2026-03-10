import React, { useEffect, useRef } from 'react';
import { Home, BarChart3, List, Settings } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { audio } from '../lib/audio';
import { haptics } from '../lib/haptics';

type TabId = 'home' | 'record' | 'menu' | 'settings';

export const Footer: React.FC = () => {
    const currentTab = useAppStore((state) => state.currentTab);
    const setTab = useAppStore((state) => state.setTab);
    const startSession = useAppStore((state) => state.startSession);
    const navRef = useRef<HTMLElement | null>(null);
    const handleTabChange = (tabId: TabId) => {
        if (tabId === currentTab) {
            return;
        }

        haptics.tick();
        setTab(tabId);
    };

    useEffect(() => {
        const nav = navRef.current;
        if (!nav) {
            return;
        }

        const handleClick = (event: MouseEvent) => {
            const target = event.target;
            if (!(target instanceof Element)) {
                return;
            }

            const button = target.closest<HTMLButtonElement>('button[data-footer-action]');
            if (!button) {
                return;
            }

            const action = button.dataset.footerAction;
            if (action === 'start-session') {
                audio.initTTS();
                haptics.pulse();
                startSession();
                return;
            }

            const tabId = button.dataset.tabId as TabId | undefined;
            if (!tabId) {
                return;
            }

            handleTabChange(tabId);
        };

        nav.addEventListener('click', handleClick);
        return () => {
            nav.removeEventListener('click', handleClick);
        };
    }, [currentTab, setTab, startSession]);

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
            ref={navRef}
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
                    type="button"
                    aria-label={label}
                    aria-current={currentTab === id ? 'page' : undefined}
                    data-footer-action="tab"
                    data-tab-id={id}
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
                    <Icon
                        size={22}
                        strokeWidth={currentTab === id ? 2.5 : 2}
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
            ))}

            {/* Center FAB */}
            <button
                className="fab"
                type="button"
                aria-label="ストレッチを始める"
                data-footer-action="start-session"
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
                    type="button"
                    aria-label={label}
                    aria-current={currentTab === id ? 'page' : undefined}
                    data-footer-action="tab"
                    data-tab-id={id}
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
                    <Icon
                        size={22}
                        strokeWidth={currentTab === id ? 2.5 : 2}
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
            ))}
        </nav>
    );
};
