import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Play, Loader2, Clock } from 'lucide-react';
import { type PublicMenu, importMenu } from '../lib/publicMenus';
import { EXERCISES } from '../data/exercises';
import { Z } from '../lib/styles';

interface MenuDetailSheetProps {
    menu: PublicMenu | null;
    onClose: () => void;
    onTry: (exerciseIds: string[], metadata: { menuId: string; menuName: string; menuSource: 'public' }) => void;
    onImported?: () => void;
}

export const MenuDetailSheet: React.FC<MenuDetailSheetProps> = ({ menu, onClose, onTry, onImported }) => {
    const [importing, setImporting] = useState(false);
    const [imported, setImported] = useState(false);
    const [error, setError] = useState<string | false>(false);

    const handleImport = async () => {
        if (!menu || importing) return;
        setImporting(true);
        setError(false);
        setImported(false);
        try {
            await importMenu(menu);
            setImported(true);
            onImported?.();
            setTimeout(() => setImported(false), 2000);
        } catch (err) {
            console.error('[MenuDetailSheet] import failed:', err);
            const msg = err instanceof Error ? err.message : '保存に失敗しました';
            setError(msg);
            setTimeout(() => setError(false), 5000);
        } finally {
            setImporting(false);
        }
    };

    const handleTry = () => {
        if (!menu) return;
        onClose();
        onTry(menu.exerciseIds, {
            menuId: menu.id,
            menuName: menu.name,
            menuSource: 'public',
        });
    };

    React.useEffect(() => {
        setImported(false);
        setError(false);
        setImporting(false);
    }, [menu?.id]);

    const totalSec = menu ? menu.exerciseIds.reduce((total, id) => {
        const exercise = EXERCISES.find((item) => item.id === id)
            ?? menu.customExerciseData?.find((item) => item.id === id);
        return total + (exercise?.sec || 0);
    }, 0) : 0;
    const minutes = Math.ceil(totalSec / 60);

    return createPortal(
        <AnimatePresence>
            {menu ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: Z.modal + 10,
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
                        onClick={(event) => event.stopPropagation()}
                        style={{
                            width: '100%',
                            maxWidth: 480,
                            maxHeight: '75vh',
                            background: '#FFF',
                            borderRadius: '24px 24px 0 0',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                        }}
                    >
                        <div style={{ padding: '20px 20px 0' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                                <div
                                    style={{
                                        width: 56,
                                        height: 56,
                                        borderRadius: 18,
                                        background: 'linear-gradient(135deg, #FFF6D6, #E8F8F0)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}
                                >
                                    <span style={{ fontSize: 32, lineHeight: 1 }}>{menu.emoji}</span>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div
                                        style={{
                                            fontFamily: "'Noto Sans JP', sans-serif",
                                            fontSize: 22,
                                            fontWeight: 800,
                                            color: '#2D3436',
                                            lineHeight: 1.25,
                                            paddingRight: 8,
                                        }}
                                    >
                                        {menu.name}
                                    </div>
                                    <div
                                        style={{
                                            fontFamily: "'Noto Sans JP', sans-serif",
                                            fontSize: 13,
                                            color: '#8395A7',
                                            marginTop: 6,
                                            lineHeight: 1.5,
                                        }}
                                    >
                                        👤 {menu.authorName}
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: '50%',
                                        border: 'none',
                                        background: '#F4F6F8',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        color: '#8395A7',
                                        flexShrink: 0,
                                    }}
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        <div
                            style={{
                                flex: 1,
                                overflowY: 'auto',
                                padding: '16px 20px 20px',
                            }}
                        >
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                                    gap: 10,
                                    marginBottom: 16,
                                }}
                            >
                                <MetaCard label="人気" value={`${menu.downloadCount}回`} icon="📥" />
                                <MetaCard label="時間" value={`約${minutes}分`} icon={<Clock size={14} />} />
                                <MetaCard label="種目" value={`${menu.exerciseIds.length}こ`} icon="🧩" />
                            </div>

                            {menu.description ? (
                                <p
                                    style={{
                                        fontFamily: "'Noto Sans JP', sans-serif",
                                        fontSize: 14,
                                        color: '#52606D',
                                        lineHeight: 1.7,
                                        margin: '0 0 16px',
                                    }}
                                >
                                    {menu.description}
                                </p>
                            ) : null}

                            <div
                                style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: '#8395A7',
                                    marginBottom: 8,
                                }}
                            >
                                しゅもく（{menu.exerciseIds.length}）
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {menu.exerciseIds.map((id, index) => {
                                    const exercise = EXERCISES.find((item) => item.id === id)
                                        ?? menu.customExerciseData?.find((item) => item.id === id);
                                    if (!exercise) return null;

                                    return (
                                        <span
                                            key={`${id}-${index}`}
                                            style={{
                                                padding: '8px 12px',
                                                borderRadius: 999,
                                                background: '#F7F8FA',
                                                fontFamily: "'Noto Sans JP', sans-serif",
                                                fontSize: 12,
                                                fontWeight: 700,
                                                color: '#2D3436',
                                            }}
                                        >
                                            {exercise.emoji} {exercise.name}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>

                        <div
                            style={{
                                padding: '14px 20px calc(18px + env(safe-area-inset-bottom, 16px))',
                                display: 'flex',
                                gap: 10,
                                borderTop: '1px solid rgba(0,0,0,0.05)',
                                background: '#FFF',
                            }}
                        >
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
                                    typeof error === 'string' ? `失敗: ${error.slice(0, 20)}` : '失敗…'
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
            ) : null}
        </AnimatePresence>,
        document.body,
    );
};

const metaCardBaseStyle: React.CSSProperties = {
    borderRadius: 16,
    padding: '12px 12px 10px',
    background: '#F7F8FA',
    minWidth: 0,
};

function MetaCard({
    label,
    value,
    icon,
}: {
    label: string;
    value: string;
    icon: React.ReactNode;
}) {
    return (
        <div style={metaCardBaseStyle}>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#8395A7',
                    marginBottom: 6,
                }}
            >
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
                <span>{label}</span>
            </div>
            <div
                style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 15,
                    fontWeight: 800,
                    color: '#2D3436',
                    lineHeight: 1.35,
                    wordBreak: 'keep-all',
                }}
            >
                {value}
            </div>
        </div>
    );
}
