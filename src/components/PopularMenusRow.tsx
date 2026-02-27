import React, { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { fetchPopularMenus, type PublicMenu } from '../lib/publicMenus';
import { EXERCISES } from '../data/exercises';

interface PopularMenusRowProps {
    onOpenBrowser: () => void;
    onSelectMenu: (exerciseIds: string[]) => void;
}

export const PopularMenusRow: React.FC<PopularMenusRowProps> = ({ onOpenBrowser, onSelectMenu }) => {
    const [menus, setMenus] = useState<PublicMenu[]>([]);

    useEffect(() => {
        fetchPopularMenus(5).then(setMenus).catch(console.warn);
    }, []);

    if (menus.length === 0) return null;

    return (
        <div>
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 10,
                padding: '0 4px',
            }}>
                <span style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#636E72',
                }}>
                    みんなのメニュー
                </span>
                <button
                    onClick={onOpenBrowser}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#0984E3',
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        padding: 0,
                    }}
                >
                    もっと見る
                    <ChevronRight size={14} />
                </button>
            </div>

            {/* Horizontal scroll */}
            <div style={{
                display: 'flex',
                gap: 10,
                overflowX: 'auto',
                paddingBottom: 4,
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
            }}>
                {menus.map(menu => {
                    const exercisePreview = menu.exerciseIds
                        .slice(0, 3)
                        .map(id => EXERCISES.find(e => e.id === id)?.emoji || '🎯')
                        .join('');

                    return (
                        <button
                            key={menu.id}
                            onClick={() => onSelectMenu(menu.exerciseIds)}
                            style={{
                                minWidth: 120,
                                padding: '12px 14px',
                                borderRadius: 14,
                                border: 'none',
                                background: 'rgba(255,255,255,0.95)',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                                cursor: 'pointer',
                                textAlign: 'left',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 4,
                                flexShrink: 0,
                            }}
                        >
                            <span style={{ fontSize: 20 }}>{menu.emoji}</span>
                            <span style={{
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 12,
                                fontWeight: 700,
                                color: '#2D3436',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: 100,
                            }}>
                                {menu.name}
                            </span>
                            <span style={{
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 10,
                                color: '#8395A7',
                            }}>
                                {exercisePreview} ・ {menu.downloadCount}回
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
