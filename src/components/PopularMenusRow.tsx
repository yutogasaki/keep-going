import React, { useEffect, useState } from 'react';
import { ChevronRight, Clock, Download } from 'lucide-react';
import { fetchRecommendedMenus, type PublicMenu } from '../lib/publicMenus';
import { EXERCISES } from '../data/exercises';

interface PopularMenusRowProps {
    onOpenBrowser: () => void;
    onMenuTap: (menu: PublicMenu) => void;
}

export const PopularMenusRow: React.FC<PopularMenusRowProps> = ({ onOpenBrowser, onMenuTap }) => {
    const [menus, setMenus] = useState<PublicMenu[]>([]);

    useEffect(() => {
        fetchRecommendedMenus().then(setMenus).catch(console.warn);
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

            {/* Vertical stack — 3 wide cards */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
            }}>
                {menus.map(menu => {
                    const resolveEx = (id: string) =>
                        EXERCISES.find(e => e.id === id)
                        ?? menu.customExerciseData?.find(e => e.id === id);
                    const exerciseNames = menu.exerciseIds
                        .slice(0, 3)
                        .map(id => resolveEx(id)?.name ?? id);
                    const remaining = menu.exerciseIds.length - 3;
                    const totalSec = menu.exerciseIds.reduce(
                        (sum, id) => sum + (resolveEx(id)?.sec ?? 0), 0
                    );
                    const minutes = Math.ceil(totalSec / 60);

                    return (
                        <button
                            key={menu.id}
                            onClick={() => onMenuTap(menu)}
                            style={{
                                width: '100%',
                                padding: '12px 14px',
                                borderRadius: 14,
                                border: 'none',
                                background: 'rgba(255,255,255,0.95)',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                                cursor: 'pointer',
                                textAlign: 'left',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                            }}
                        >
                            <span style={{ fontSize: 24, flexShrink: 0 }}>{menu.emoji}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: '#2D3436',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}>
                                    {menu.name}
                                </div>
                                <div style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 11,
                                    color: '#8395A7',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}>
                                    {exerciseNames.join('、')}{remaining > 0 ? `、+${remaining}` : ''}
                                </div>
                            </div>
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-end',
                                gap: 2,
                                flexShrink: 0,
                            }}>
                                <span style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 10,
                                    color: '#B2BEC3',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 3,
                                }}>
                                    <Clock size={10} />
                                    {minutes}分
                                </span>
                                <span style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 10,
                                    color: '#B2BEC3',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 3,
                                }}>
                                    <Download size={10} />
                                    {menu.downloadCount}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
