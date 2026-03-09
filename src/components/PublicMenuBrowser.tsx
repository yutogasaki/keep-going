import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Clock, Download } from 'lucide-react';
import { dedupeMenusByIdentity, fetchPopularMenus, type PublicMenu } from '../lib/publicMenus';
import { EXERCISES } from '../data/exercises';
import { MenuDetailSheet } from './MenuDetailSheet';
import { useAppStore } from '../store/useAppStore';
import { COLOR, FONT, FONT_SIZE, RADIUS, SPACE, Z } from '../lib/styles';
import { CANONICAL_TERMS, DISPLAY_TERMS } from '../lib/terminology';

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
                                            <PublicMenuListCard
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

const PublicMenuListCard: React.FC<{
    menu: PublicMenu;
    onTap: () => void;
}> = ({ menu, onTap }) => {
    const resolveExercise = (id: string) =>
        EXERCISES.find((exercise) => exercise.id === id)
        ?? menu.customExerciseData.find((exercise) => exercise.id === id);
    const exerciseNames = menu.exerciseIds
        .slice(0, 3)
        .map((id) => resolveExercise(id)?.name ?? id);
    const remaining = menu.exerciseIds.length - 3;
    const totalSec = menu.exerciseIds.reduce(
        (sum, id) => sum + (resolveExercise(id)?.sec ?? 0),
        0,
    );
    const minutes = Math.max(1, Math.ceil(totalSec / 60));

    return (
        <button
            type="button"
            onClick={onTap}
            style={menuCardStyle}
        >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: SPACE.md, width: '100%' }}>
                <div style={iconContainerStyle}>
                    <span style={{ fontSize: 24, lineHeight: 1 }}>{menu.emoji}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={titleStyle}>{menu.name}</div>
                    <div style={subtitleStyle}>{menu.authorName} さんのメニュー</div>
                </div>
                <span style={kindBadgeStyle}>{CANONICAL_TERMS.menu}</span>
            </div>

            <div style={descriptionStyle}>
                {menu.description || `${exerciseNames.join('、')}${remaining > 0 ? `、+${remaining}` : ''}`}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACE.sm }}>
                <span style={metaChipStyle}>
                    <Clock size={11} />
                    約{minutes}分
                </span>
                <span style={metaChipStyle}>
                    {menu.exerciseIds.length}種目
                </span>
                <span style={metaChipStyle}>
                    <Download size={11} />
                    {menu.downloadCount}
                </span>
            </div>
        </button>
    );
};

const menuCardStyle: React.CSSProperties = {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: SPACE.sm,
    padding: `${SPACE.lg}px`,
    border: `1px solid ${COLOR.border}`,
    background: COLOR.white,
    cursor: 'pointer',
    textAlign: 'left',
    boxShadow: '0 8px 24px rgba(31, 41, 55, 0.08)',
    borderRadius: RADIUS['2xl'],
    appearance: 'none',
    WebkitAppearance: 'none',
};

const iconContainerStyle: React.CSSProperties = {
    width: 44,
    height: 44,
    borderRadius: RADIUS.lg,
    background: 'linear-gradient(135deg, #E8F8F0, #FFE5D9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
};

const titleStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.lg,
    fontWeight: 700,
    color: COLOR.dark,
    lineHeight: 1.35,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
};

const subtitleStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.xs + 1,
    color: COLOR.muted,
    marginTop: 2,
};

const descriptionStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.sm,
    color: COLOR.text,
    lineHeight: 1.5,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    minHeight: 36,
};

const kindBadgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4px 8px',
    borderRadius: RADIUS.full,
    background: 'rgba(43, 186, 160, 0.10)',
    color: COLOR.primaryDark,
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.xs + 1,
    fontWeight: 700,
    flexShrink: 0,
};

const metaChipStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '4px 8px',
    borderRadius: RADIUS.full,
    background: 'rgba(0,0,0,0.04)',
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.xs + 1,
    color: COLOR.light,
};
