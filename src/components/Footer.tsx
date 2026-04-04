import React from 'react';
import { Home, BarChart3, List, Settings } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { audio } from '../lib/audio';
import { haptics } from '../lib/haptics';
import {
    BOTTOM_NAV_HEIGHT,
    COLOR,
    FONT,
    FONT_SIZE,
    SAFE_AREA_BOTTOM,
    SPACE,
    Z,
} from '../lib/styles';

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
                    gap: 1,
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    width: '100%',
                    height: '100%',
                    padding: `${SPACE.xs + 1}px ${SPACE.md}px ${SPACE.xs - 1}px`,
                    color: isActive ? COLOR.primary : COLOR.light,
                    transition: 'color 0.2s ease',
                }}
            >
                <Icon
                    size={20}
                    strokeWidth={isActive ? 2.5 : 2}
                    style={{ pointerEvents: 'none' }}
                    aria-hidden="true"
                />
                <span style={{
                    fontSize: FONT_SIZE.xs,
                    lineHeight: 1.1,
                    fontWeight: isActive ? 700 : 500,
                    fontFamily: FONT.body,
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
                minHeight: `calc(${BOTTOM_NAV_HEIGHT}px + ${SAFE_AREA_BOTTOM})`,
                paddingBottom: SAFE_AREA_BOTTOM,
                background: 'var(--toolbar-bg)',
                backdropFilter: 'blur(var(--blur-lg))',
                WebkitBackdropFilter: 'blur(var(--blur-lg))',
                borderTop: '1px solid rgba(0,0,0,0.06)',
                boxShadow: 'var(--toolbar-shadow)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                zIndex: Z.footer,
            }}
        >
            <div
                style={{
                    height: BOTTOM_NAV_HEIGHT,
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr auto 1fr 1fr',
                    alignItems: 'stretch',
                    width: '100%',
                    padding: `0 ${SPACE.sm}px`,
                    columnGap: SPACE.xs,
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
            </div>
        </nav>
    );
};
