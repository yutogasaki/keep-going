import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Clock, Download } from 'lucide-react';
import { dedupeMenusByIdentity, fetchPopularMenus, type PublicMenu } from '../lib/publicMenus';
import { EXERCISES } from '../data/exercises';
import { MenuDetailSheet } from './MenuDetailSheet';
import { useAppStore } from '../store/useAppStore';
import { COLOR, FONT, FONT_SIZE, RADIUS, SPACE } from '../lib/styles';

interface PublicMenuBrowserProps {
    open: boolean;
    onClose: () => void;
    onImported?: () => void;
}

export const PublicMenuBrowser: React.FC<PublicMenuBrowserProps> = ({ open, onClose, onImported }) => {
    const [menus, setMenus] = useState<PublicMenu[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [selectedMenu, setSelectedMenu] = useState<PublicMenu | null>(null);
    const startSessionWithExercises = useAppStore(s => s.startSessionWithExercises);

    useEffect(() => {
        if (!open) return;
        setLoading(true);
        setError(false);
        fetchPopularMenus(20).then(data => {
            setMenus(dedupeMenusByIdentity(data));
        }).catch(err => {
            console.error('[PublicMenuBrowser] fetch failed:', err);
            setError(true);
        }).finally(() => {
            setLoading(false);
        });
    }, [open]);

    const handleTry = (exerciseIds: string[]) => {
        setSelectedMenu(null);
        onClose();
        startSessionWithExercises(exerciseIds);
    };

    return (
        <>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 100,
                            background: 'rgba(0,0,0,0.4)',
                            display: 'flex',
                            alignItems: 'flex-end',
                            justifyContent: 'center',
                        }}
                        onClick={onClose}
                    >
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            onClick={e => e.stopPropagation()}
                            style={{
                                width: '100%',
                                maxWidth: 480,
                                maxHeight: '80vh',
                                background: '#F8F9FA',
                                borderRadius: '20px 20px 0 0',
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden',
                            }}
                        >
                            {/* Header */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '20px 20px 12px',
                                gap: 12,
                            }}>
                                <h2 style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 18,
                                    fontWeight: 800,
                                    color: '#2D3436',
                                    margin: 0,
                                    flex: 1,
                                }}>
                                    みんなのメニュー
                                </h2>
                                <button
                                    onClick={onClose}
                                    style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: '50%',
                                        border: 'none',
                                        background: '#F0F3F5',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        color: '#8395A7',
                                    }}
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Content */}
                            <div style={{
                                flex: 1,
                                overflowY: 'auto',
                                padding: '0 20px 80px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 10,
                            }}>
                                {loading ? (
                                    <div style={{
                                        textAlign: 'center',
                                        padding: 48,
                                        color: '#8395A7',
                                    }}>
                                        <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
                                        <p style={{
                                            fontFamily: "'Noto Sans JP', sans-serif",
                                            fontSize: 14,
                                            margin: '12px 0 0',
                                        }}>
                                            読み込み中...
                                        </p>
                                    </div>
                                ) : error ? (
                                    <div style={{
                                        textAlign: 'center',
                                        padding: 48,
                                        color: '#E84393',
                                    }}>
                                        <p style={{
                                            fontFamily: "'Noto Sans JP', sans-serif",
                                            fontSize: 14,
                                            margin: 0,
                                        }}>
                                            読み込みに失敗しました
                                        </p>
                                    </div>
                                ) : menus.length === 0 ? (
                                    <div style={{
                                        textAlign: 'center',
                                        padding: 48,
                                        color: '#8395A7',
                                    }}>
                                        <p style={{
                                            fontFamily: "'Noto Sans JP', sans-serif",
                                            fontSize: 14,
                                            margin: 0,
                                        }}>
                                            まだみんなのメニューがありません
                                        </p>
                                    </div>
                                ) : (
                                    menus.map(menu => (
                                        <BrowserMenuCard
                                            key={menu.id}
                                            menu={menu}
                                            onTap={() => setSelectedMenu(menu)}
                                        />
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Detail sheet on top */}
            <MenuDetailSheet
                menu={selectedMenu}
                onClose={() => setSelectedMenu(null)}
                onImported={onImported}
                onTry={handleTry}
            />
        </>
    );
};

// ─── Tappable menu card (no direct import button) ────

const BrowserMenuCard: React.FC<{
    menu: PublicMenu;
    onTap: () => void;
}> = ({ menu, onTap }) => {
    const exerciseNames = menu.exerciseIds
        .slice(0, 4)
        .map(id =>
            EXERCISES.find(e => e.id === id)?.name
            ?? menu.customExerciseData?.find(e => e.id === id)?.name
            ?? id
        );
    const remaining = menu.exerciseIds.length - 4;
    const totalSec = menu.exerciseIds.reduce((sum, id) => {
        const exercise = EXERCISES.find(e => e.id === id)
            ?? menu.customExerciseData?.find(e => e.id === id);
        return sum + (exercise?.sec ?? 0);
    }, 0);
    const minutes = Math.ceil(totalSec / 60);

    return (
        <button
            onClick={onTap}
            style={{
                background: COLOR.white,
                borderRadius: RADIUS.lg,
                padding: `${SPACE.lg}px`,
                boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: SPACE.sm,
            }}
        >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: SPACE.md, width: '100%' }}>
                <div style={{
                    width: 42,
                    height: 42,
                    borderRadius: RADIUS.lg,
                    background: 'rgba(43, 186, 160, 0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}>
                    <span style={{ fontSize: 24, lineHeight: 1 }}>{menu.emoji}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                        fontFamily: FONT.body,
                        fontSize: FONT_SIZE.md,
                        fontWeight: 700,
                        color: COLOR.dark,
                        lineHeight: 1.4,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical' as const,
                        overflow: 'hidden',
                    }}>
                        {menu.name}
                    </div>
                    <div style={{
                        fontFamily: FONT.body,
                        fontSize: FONT_SIZE.sm,
                        color: COLOR.muted,
                        marginTop: 2,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical' as const,
                        overflow: 'hidden',
                    }}>
                        {menu.authorName} さんのメニュー
                    </div>
                </div>
            </div>

            {menu.description ? (
                <div style={{
                    fontFamily: FONT.body,
                    fontSize: FONT_SIZE.sm,
                    color: COLOR.text,
                    lineHeight: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical' as const,
                    overflow: 'hidden',
                }}>
                    {menu.description}
                </div>
            ) : null}

            <div style={{
                fontFamily: FONT.body,
                fontSize: FONT_SIZE.sm,
                color: COLOR.muted,
                lineHeight: 1.6,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical' as const,
                overflow: 'hidden',
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
                    約{minutes}分
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
                    {menu.downloadCount}回もらわれた
                </span>
            </div>
        </button>
    );
};

