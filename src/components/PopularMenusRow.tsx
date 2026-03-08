import React, { useEffect, useState } from 'react';
import { ChevronRight, Clock, Download } from 'lucide-react';
import { fetchRecommendedMenus, type PublicMenu } from '../lib/publicMenus';
import { EXERCISES } from '../data/exercises';
import { COLOR, FONT, FONT_SIZE, RADIUS, SPACE } from '../lib/styles';

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
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 10,
                padding: '0 4px',
            }}>
                <span style={{
                    fontFamily: FONT.body,
                    fontSize: FONT_SIZE.sm + 1,
                    fontWeight: 700,
                    color: COLOR.text,
                }}>
                    みんなのメニュー
                </span>
                <button
                    onClick={onOpenBrowser}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: COLOR.info,
                        fontFamily: FONT.body,
                        fontSize: FONT_SIZE.sm,
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

            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: SPACE.sm,
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
                                padding: `${SPACE.lg}px`,
                                borderRadius: RADIUS.lg,
                                border: '1px solid rgba(255,255,255,0.55)',
                                background: 'rgba(255,255,255,0.96)',
                                boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
                                cursor: 'pointer',
                                textAlign: 'left',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: SPACE.sm,
                                minHeight: 92,
                            }}
                        >
                            <div style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: SPACE.md,
                                width: '100%',
                            }}>
                                <div style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: RADIUS.lg,
                                    background: 'rgba(43, 186, 160, 0.12)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}>
                                    <span style={{ fontSize: 22, lineHeight: 1 }}>{menu.emoji}</span>
                                </div>
                                <div style={{
                                    flex: 1,
                                    minWidth: 0,
                                }}>
                                    <div style={{
                                        fontFamily: FONT.body,
                                        fontSize: FONT_SIZE.md,
                                        fontWeight: 700,
                                        color: COLOR.dark,
                                        lineHeight: 1.35,
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical' as const,
                                        overflow: 'hidden',
                                    }}>
                                        {menu.name}
                                    </div>
                                    <div style={{
                                        fontFamily: FONT.body,
                                        fontSize: FONT_SIZE.xs + 1,
                                        color: COLOR.muted,
                                        marginTop: 2,
                                    }}>
                                        {menu.authorName} さんのメニュー
                                    </div>
                                </div>
                            </div>

                            <div style={{
                                fontFamily: FONT.body,
                                fontSize: FONT_SIZE.sm,
                                color: COLOR.muted,
                                lineHeight: 1.5,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical' as const,
                                overflow: 'hidden',
                                minHeight: 36,
                            }}>
                                {exerciseNames.join('、')}{remaining > 0 ? `、+${remaining}` : ''}
                            </div>

                            <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: SPACE.sm,
                            }}>
                                <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    padding: '4px 8px',
                                    borderRadius: RADIUS.full,
                                    background: 'rgba(0,0,0,0.04)',
                                    fontFamily: FONT.body,
                                    fontSize: FONT_SIZE.xs + 1,
                                    color: COLOR.light,
                                }}>
                                    <Clock size={11} />
                                    {minutes}分
                                </span>
                                <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    padding: '4px 8px',
                                    borderRadius: RADIUS.full,
                                    background: 'rgba(0,0,0,0.04)',
                                    fontFamily: FONT.body,
                                    fontSize: FONT_SIZE.xs + 1,
                                    color: COLOR.light,
                                }}>
                                    <Download size={11} />
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
