import React from 'react';
import { MENU_TABS, type MenuTab } from './types';

interface MenuTabsProps {
    tab: MenuTab;
    onChange: (tab: MenuTab) => void;
}

export const MenuTabs: React.FC<MenuTabsProps> = React.memo(({ tab, onChange }) => {
    return (
        <div style={{
            display: 'flex',
            gap: 4,
            background: 'rgba(0,0,0,0.04)',
            borderRadius: 12,
            padding: 3,
            margin: '0 20px 16px',
        }}>
            {MENU_TABS.map((menuTab) => (
                <button
                    key={menuTab.id}
                    onClick={() => onChange(menuTab.id)}
                    style={{
                        flex: 1,
                        padding: '8px 0',
                        borderRadius: 10,
                        border: 'none',
                        cursor: 'pointer',
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 13,
                        fontWeight: 700,
                        background: tab === menuTab.id ? 'white' : 'transparent',
                        color: tab === menuTab.id ? '#2D3436' : '#8395A7',
                        boxShadow: tab === menuTab.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                        transition: 'all 0.2s ease',
                    }}
                >
                    {menuTab.label}
                </button>
            ))}
        </div>
    );
});
