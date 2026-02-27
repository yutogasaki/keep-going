import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Loader2 } from 'lucide-react';
import { fetchPopularMenus, importMenu, type PublicMenu } from '../lib/publicMenus';
import { EXERCISES } from '../data/exercises';

interface PublicMenuBrowserProps {
    open: boolean;
    onClose: () => void;
}

export const PublicMenuBrowser: React.FC<PublicMenuBrowserProps> = ({ open, onClose }) => {
    const [menus, setMenus] = useState<PublicMenu[]>([]);
    const [loading, setLoading] = useState(true);
    const [importingId, setImportingId] = useState<string | null>(null);
    const [importedIds, setImportedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!open) return;
        setLoading(true);
        fetchPopularMenus(20).then(data => {
            setMenus(data);
            setLoading(false);
        });
    }, [open]);

    const handleImport = async (menu: PublicMenu) => {
        setImportingId(menu.id);
        try {
            await importMenu(menu);
            setImportedIds(prev => new Set([...prev, menu.id]));
        } catch (err) {
            console.warn('[publicMenus] import failed:', err);
        } finally {
            setImportingId(null);
        }
    };

    return (
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
                            padding: '0 20px 20px',
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
                                    <PublicMenuCard
                                        key={menu.id}
                                        menu={menu}
                                        importing={importingId === menu.id}
                                        imported={importedIds.has(menu.id)}
                                        onImport={() => handleImport(menu)}
                                    />
                                ))
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// ─── Individual menu card ────────────────────────────

const PublicMenuCard: React.FC<{
    menu: PublicMenu;
    importing: boolean;
    imported: boolean;
    onImport: () => void;
}> = ({ menu, importing, imported, onImport }) => {
    // Resolve exercise names for preview
    const exerciseNames = menu.exerciseIds
        .slice(0, 4)
        .map(id => EXERCISES.find(e => e.id === id)?.name || id);
    const remaining = menu.exerciseIds.length - 4;

    return (
        <div style={{
            background: '#FFF',
            borderRadius: 14,
            padding: '14px 16px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
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
                        {menu.authorName} ・ {menu.downloadCount}回もらわれた
                    </div>
                </div>
                <button
                    onClick={onImport}
                    disabled={importing || imported}
                    style={{
                        padding: '8px 14px',
                        borderRadius: 10,
                        border: 'none',
                        background: imported ? '#E8F8F0' : '#2BBAA0',
                        color: imported ? '#2BBAA0' : '#FFF',
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: imported ? 'default' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        flexShrink: 0,
                    }}
                >
                    {importing ? (
                        <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                    ) : imported ? (
                        '追加済み'
                    ) : (
                        <>
                            <Download size={12} />
                            もらう
                        </>
                    )}
                </button>
            </div>

            {/* Exercise preview */}
            <div style={{
                fontFamily: "'Noto Sans JP', sans-serif",
                fontSize: 11,
                color: '#636E72',
                lineHeight: 1.6,
            }}>
                {exerciseNames.join('、')}{remaining > 0 ? `、+${remaining}` : ''}
            </div>
        </div>
    );
};
