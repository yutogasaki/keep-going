import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { fetchPopularMenus, type PublicMenu } from '../lib/publicMenus';
import { EXERCISES } from '../data/exercises';
import { MenuDetailSheet } from './MenuDetailSheet';
import { useAppStore } from '../store/useAppStore';

interface PublicMenuBrowserProps {
    open: boolean;
    onClose: () => void;
}

export const PublicMenuBrowser: React.FC<PublicMenuBrowserProps> = ({ open, onClose }) => {
    const [menus, setMenus] = useState<PublicMenu[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMenu, setSelectedMenu] = useState<PublicMenu | null>(null);
    const startSessionWithExercises = useAppStore(s => s.startSessionWithExercises);

    useEffect(() => {
        if (!open) return;
        setLoading(true);
        fetchPopularMenus(20).then(data => {
            // Deduplicate by name + exerciseIds
            const seen = new Set<string>();
            const deduped = data.filter(menu => {
                const key = `${menu.name}|${menu.exerciseIds.join(',')}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });
            setMenus(deduped);
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
                                            まだ公開メニューがありません
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
        .map(id => EXERCISES.find(e => e.id === id)?.name || id);
    const remaining = menu.exerciseIds.length - 4;

    return (
        <button
            onClick={onTap}
            style={{
                background: '#FFF',
                borderRadius: 14,
                padding: '14px 16px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 24 }}>{menu.emoji}</span>
                <div style={{ flex: 1 }}>
                    <div style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 14,
                        fontWeight: 700,
                        color: '#2D3436',
                    }}>
                        {menu.name}
                    </div>
                    <div style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 11,
                        color: '#8395A7',
                    }}>
                        {menu.authorName} · {menu.downloadCount}回もらわれた
                    </div>
                </div>
            </div>

            {menu.description ? (
                <div style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 12,
                    color: '#636E72',
                    lineHeight: 1.5,
                    marginBottom: 4,
                }}>
                    {menu.description}
                </div>
            ) : null}

            <div style={{
                fontFamily: "'Noto Sans JP', sans-serif",
                fontSize: 11,
                color: '#8395A7',
                lineHeight: 1.6,
            }}>
                {exerciseNames.join('、')}{remaining > 0 ? `、+${remaining}` : ''}
            </div>
        </button>
    );
};
