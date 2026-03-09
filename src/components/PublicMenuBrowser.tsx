import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Clock, Download, ChevronRight } from 'lucide-react';
import { dedupeMenusByIdentity, fetchPopularMenus, type PublicMenu } from '../lib/publicMenus';
import { EXERCISES } from '../data/exercises';
import { MenuDetailSheet } from './MenuDetailSheet';
import { ExerciseIcon } from './ExerciseIcon';
import { useAppStore } from '../store/useAppStore';
import { COLOR, FONT, FONT_SIZE, RADIUS, SPACE, Z } from '../lib/styles';
import { DISPLAY_TERMS } from '../lib/terminology';

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

    const handleTry = (
        exerciseIds: string[],
        metadata: { menuId: string; menuName: string; menuSource: 'public' },
    ) => {
        setSelectedMenu(null);
        onClose();
        startSessionWithExercises(exerciseIds, {
            sourceMenuId: metadata.menuId,
            sourceMenuSource: metadata.menuSource,
            sourceMenuName: metadata.menuName,
        });
    };

    return (
        <>
            {createPortal(
                <AnimatePresence>
                    {open && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{
                                position: 'fixed',
                                inset: 0,
                                zIndex: Z.modal,
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
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '20px 20px 12px',
                                    gap: 12,
                                    position: 'relative',
                                    zIndex: 1,
                                    background: '#F8F9FA',
                                    borderBottom: '1px solid rgba(0,0,0,0.05)',
                                }}>
                                    <h2 style={{
                                        fontFamily: "'Noto Sans JP', sans-serif",
                                        fontSize: 18,
                                        fontWeight: 800,
                                        color: '#2D3436',
                                        margin: 0,
                                        flex: 1,
                                    }}>
                                        {DISPLAY_TERMS.publicMenu}
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

                                <div style={{
                                    flex: 1,
                                    overflowY: 'auto',
                                    padding: '12px 20px 80px',
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
                                                まだ{DISPLAY_TERMS.publicMenu}がありません
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
                </AnimatePresence>,
                document.body,
            )}

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
    const resolveExercise = (id: string) =>
        EXERCISES.find((exercise) => exercise.id === id)
        ?? menu.customExerciseData?.find((exercise) => exercise.id === id);
    const exerciseNames = menu.exerciseIds
        .slice(0, 3)
        .map((id) => resolveExercise(id)?.name ?? id);
    const remaining = menu.exerciseIds.length - 3;
    const totalSec = menu.exerciseIds.reduce((sum, id) => {
        const exercise = resolveExercise(id);
        return sum + (exercise?.sec ?? 0);
    }, 0);
    const minutes = Math.ceil(totalSec / 60);
    const previewCopy = menu.description || `${exerciseNames.join('・')}${remaining > 0 ? ` など${menu.exerciseIds.length}種目` : ''}`;

    return (
        <div
            className="card"
            style={{
                padding: 0,
                overflow: 'hidden',
                border: '1px solid rgba(43, 186, 160, 0.08)',
                boxShadow: '0 10px 24px rgba(31, 41, 55, 0.08)',
            }}
        >
            <button
                onClick={onTap}
                style={{
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: 0,
                }}
            >
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '16px 16px 12px',
                }}>
                    <div
                        style={{
                            width: 48,
                            height: 48,
                            borderRadius: 16,
                            background: 'linear-gradient(135deg, #E8F8F0, #FFE5D9)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}
                    >
                        <ExerciseIcon id={menu.exerciseIds[0] || 'S01'} emoji={menu.emoji} size={24} color="#2BBAA0" />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                            style={{
                                fontFamily: FONT.body,
                                fontSize: 16,
                                fontWeight: 700,
                                color: COLOR.dark,
                                lineHeight: 1.4,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical' as const,
                                overflow: 'hidden',
                            }}
                        >
                            {menu.name}
                        </div>
                        <div
                            style={{
                                fontFamily: FONT.body,
                                fontSize: 12,
                                color: COLOR.muted,
                                display: 'flex',
                                gap: 8,
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                marginTop: 4,
                            }}
                        >
                            <span>👤 {menu.authorName}</span>
                            <span aria-hidden="true">·</span>
                            <span>約{minutes}分</span>
                            <span aria-hidden="true">·</span>
                            <span>{menu.exerciseIds.length}種目</span>
                        </div>
                    </div>

                    <div
                        aria-hidden="true"
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: 12,
                            background: 'rgba(43, 186, 160, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}
                    >
                        <ChevronRight size={16} color={COLOR.primary} />
                    </div>
                </div>

                <div style={{
                    borderTop: '1px solid rgba(0,0,0,0.05)',
                    padding: '12px 16px 14px',
                    background: 'rgba(248, 249, 250, 0.72)',
                }}>
                    <div style={{
                        fontFamily: FONT.body,
                        fontSize: FONT_SIZE.sm,
                        color: COLOR.text,
                        lineHeight: 1.55,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical' as const,
                        overflow: 'hidden',
                    }}>
                        {previewCopy}
                    </div>

                    <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 6,
                        marginTop: 10,
                    }}>
                        {exerciseNames.map((name) => (
                            <span
                                key={name}
                                style={{
                                    padding: '4px 10px',
                                    borderRadius: 8,
                                    background: 'rgba(43, 186, 160, 0.1)',
                                    fontFamily: FONT.body,
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: COLOR.primary,
                                }}
                            >
                                {name}
                            </span>
                        ))}
                        {remaining > 0 ? (
                            <span
                                style={{
                                    padding: '4px 10px',
                                    borderRadius: 8,
                                    background: 'rgba(0,0,0,0.04)',
                                    fontFamily: FONT.body,
                                    fontSize: 12,
                                    color: COLOR.muted,
                                }}
                            >
                                +{remaining}種目
                            </span>
                        ) : null}
                    </div>

                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: 12,
                    }}>
                        <MetaChip icon={<Download size={11} />} label={`${menu.downloadCount}回もらわれた`} />
                        <span style={{
                            fontFamily: FONT.heading,
                            fontSize: FONT_SIZE.sm,
                            fontWeight: 700,
                            color: COLOR.primary,
                        }}>
                            OPEN
                        </span>
                    </div>
                </div>
            </button>
        </div>
    );
};

const MetaChip: React.FC<{
    label: string;
    icon?: React.ReactNode;
}> = ({ label, icon }) => (
    <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 8px',
        borderRadius: RADIUS.full,
        background: 'rgba(15, 23, 42, 0.05)',
        fontFamily: FONT.body,
        fontSize: FONT_SIZE.xs + 1,
        color: COLOR.light,
    }}>
        {icon}
        {label}
    </span>
);
