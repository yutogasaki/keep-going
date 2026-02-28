import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Play, Loader2, Clock } from 'lucide-react';
import { type PublicMenu, importMenu } from '../lib/publicMenus';
import { EXERCISES } from '../data/exercises';

interface MenuDetailSheetProps {
    menu: PublicMenu | null;
    onClose: () => void;
    onTry: (exerciseIds: string[]) => void;
}

export const MenuDetailSheet: React.FC<MenuDetailSheetProps> = ({ menu, onClose, onTry }) => {
    const [importing, setImporting] = useState(false);
    const [imported, setImported] = useState(false);
    const [error, setError] = useState(false);

    const handleImport = async () => {
        if (!menu || importing) return;
        setImporting(true);
        setError(false);
        setImported(false);
        try {
            await importMenu(menu);
            setImported(true);
            // 2秒後にリセット → 再度「もらう」を押せるように
            setTimeout(() => setImported(false), 2000);
        } catch (err) {
            console.warn('[MenuDetailSheet] import failed:', err);
            setError(true);
            setTimeout(() => setError(false), 3000);
        } finally {
            setImporting(false);
        }
    };

    const handleTry = () => {
        if (!menu) return;
        onClose();
        onTry(menu.exerciseIds);
    };

    // Reset state when menu changes
    React.useEffect(() => {
        setImported(false);
        setError(false);
        setImporting(false);
    }, [menu?.id]);

    const totalSec = menu ? menu.exerciseIds.reduce((total, id) => {
        const ex = EXERCISES.find(e => e.id === id)
            ?? menu.customExerciseData?.find(e => e.id === id);
        return total + (ex?.sec || 0);
    }, 0) : 0;
    const minutes = Math.ceil(totalSec / 60);

    return (
        <AnimatePresence>
            {menu && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 110,
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
                            maxHeight: '75vh',
                            background: '#FFF',
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
                            padding: '20px 20px 0',
                            gap: 12,
                        }}>
                            <span style={{ fontSize: 32 }}>{menu.emoji}</span>
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 18,
                                    fontWeight: 800,
                                    color: '#2D3436',
                                }}>
                                    {menu.name}
                                </div>
                                <div style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 12,
                                    color: '#8395A7',
                                    display: 'flex',
                                    gap: 8,
                                    alignItems: 'center',
                                    marginTop: 2,
                                }}>
                                    <span>👤 {menu.authorName}</span>
                                    <span>·</span>
                                    <span>📥 {menu.downloadCount}回</span>
                                    <span>·</span>
                                    <Clock size={11} />
                                    <span>約{minutes}分</span>
                                </div>
                            </div>
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
                                    flexShrink: 0,
                                }}
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Description */}
                        {menu.description && (
                            <p style={{
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 13,
                                color: '#636E72',
                                lineHeight: 1.6,
                                padding: '12px 20px 0',
                                margin: 0,
                            }}>
                                {menu.description}
                            </p>
                        )}

                        {/* Exercise List */}
                        <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: '16px 20px',
                        }}>
                            <div style={{
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 11,
                                fontWeight: 700,
                                color: '#8395A7',
                                marginBottom: 8,
                            }}>
                                しゅもく（{menu.exerciseIds.length}）
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {menu.exerciseIds.map((id, i) => {
                                    const ex = EXERCISES.find(e => e.id === id)
                                        ?? menu.customExerciseData?.find(e => e.id === id);
                                    if (!ex) return null;
                                    return (
                                        <span key={`${id}-${i}`} style={{
                                            padding: '6px 12px',
                                            borderRadius: 10,
                                            background: '#F0F3F5',
                                            fontFamily: "'Noto Sans JP', sans-serif",
                                            fontSize: 13,
                                            color: '#2D3436',
                                        }}>
                                            {ex.emoji} {ex.name}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{
                            padding: '12px 20px calc(24px + env(safe-area-inset-bottom, 20px))',
                            display: 'flex',
                            gap: 10,
                            borderTop: '1px solid rgba(0,0,0,0.05)',
                            paddingBottom: 80,
                        }}>
                            <button
                                onClick={handleImport}
                                disabled={importing}
                                style={{
                                    flex: 1,
                                    padding: '14px',
                                    borderRadius: 14,
                                    border: '2px solid #2BBAA0',
                                    background: error ? '#FFE0E0' : imported ? '#E8F8F0' : 'white',
                                    color: error ? '#E84393' : '#2BBAA0',
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 14,
                                    fontWeight: 700,
                                    cursor: imported ? 'default' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6,
                                }}
                            >
                                {importing ? (
                                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                                ) : error ? (
                                    '失敗…'
                                ) : imported ? (
                                    '追加済み ✓'
                                ) : (
                                    <>
                                        <Download size={16} />
                                        もらう
                                    </>
                                )}
                            </button>
                            <button
                                onClick={handleTry}
                                style={{
                                    flex: 1,
                                    padding: '14px',
                                    borderRadius: 14,
                                    border: 'none',
                                    background: '#2BBAA0',
                                    color: 'white',
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 14,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6,
                                }}
                            >
                                <Play size={16} fill="white" />
                                ためしてみる
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
