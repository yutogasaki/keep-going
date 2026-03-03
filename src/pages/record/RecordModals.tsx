import React from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Award, X } from 'lucide-react';
import type { ChibifuwaRecord, PastFuwafuwaRecord } from '../../store/useAppStore';
import { formatDate } from './recordUtils';

interface RecordModalsProps {
    selectedFuwafuwa: PastFuwafuwaRecord | null;
    selectedBadge: ChibifuwaRecord | null;
    onCloseFuwafuwa: () => void;
    onCloseBadge: () => void;
}

export const RecordModals: React.FC<RecordModalsProps> = ({
    selectedFuwafuwa,
    selectedBadge,
    onCloseFuwafuwa,
    onCloseBadge,
}) => {
    return (
        <>
            {createPortal(
                <AnimatePresence>
                    {selectedFuwafuwa && (
                        <motion.div
                            key="fuwafuwa-modal"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onCloseFuwafuwa}
                            style={{
                                position: 'fixed',
                                inset: 0,
                                background: 'rgba(0,0,0,0.55)',
                                zIndex: 300,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: 24,
                            }}
                        >
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                                onClick={(event) => event.stopPropagation()}
                                style={{
                                    background: '#fff',
                                    borderRadius: 24,
                                    padding: '32px 28px 28px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 16,
                                    width: '100%',
                                    maxWidth: 280,
                                    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                                    position: 'relative',
                                }}
                            >
                                <button
                                    onClick={onCloseFuwafuwa}
                                    style={{
                                        position: 'absolute',
                                        top: 12,
                                        right: 12,
                                        width: 32,
                                        height: 32,
                                        borderRadius: '50%',
                                        border: 'none',
                                        background: '#F8F9FA',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <X size={16} color="#636E72" />
                                </button>
                                <div style={{
                                    width: 160,
                                    height: 160,
                                    borderRadius: '50%',
                                    overflow: 'hidden',
                                    border: '3px solid rgba(255,154,158,0.4)',
                                    boxShadow: '0 8px 24px rgba(232,67,147,0.15)',
                                    background: '#fff',
                                }}>
                                    <img
                                        src={`/ikimono/${selectedFuwafuwa.type}-${selectedFuwafuwa.finalStage}.webp`}
                                        alt={selectedFuwafuwa.name || 'ふわふわ'}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.05)', display: 'block' }}
                                    />
                                </div>
                                <div style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 20,
                                    fontWeight: 800,
                                    color: '#2D3436',
                                    textAlign: 'center',
                                }}>
                                    {selectedFuwafuwa.name || 'なまえなし'}
                                </div>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    fontSize: 13,
                                    color: '#E84393',
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontWeight: 600,
                                    background: 'rgba(232,67,147,0.08)',
                                    padding: '6px 14px',
                                    borderRadius: 20,
                                }}>
                                    <Award size={14} />
                                    頑張り度: {selectedFuwafuwa.activeDays}日
                                </div>
                                <div style={{
                                    fontSize: 12,
                                    color: '#B2BEC3',
                                    fontFamily: "'Outfit', sans-serif",
                                }}>
                                    {formatDate(selectedFuwafuwa.sayonaraDate)}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body,
            )}

            {createPortal(
                <AnimatePresence>
                    {selectedBadge && (
                        <motion.div
                            key="badge-modal"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onCloseBadge}
                            style={{
                                position: 'fixed',
                                inset: 0,
                                background: 'rgba(0,0,0,0.55)',
                                zIndex: 300,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: 24,
                            }}
                        >
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                                onClick={(event) => event.stopPropagation()}
                                style={{
                                    background: '#fff',
                                    borderRadius: 24,
                                    padding: '32px 28px 28px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 16,
                                    width: '100%',
                                    maxWidth: 280,
                                    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                                    position: 'relative',
                                }}
                            >
                                <button
                                    onClick={onCloseBadge}
                                    style={{
                                        position: 'absolute',
                                        top: 12,
                                        right: 12,
                                        width: 32,
                                        height: 32,
                                        borderRadius: '50%',
                                        border: 'none',
                                        background: '#F8F9FA',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <X size={16} color="#636E72" />
                                </button>
                                <div style={{
                                    width: 160,
                                    height: 160,
                                    borderRadius: '50%',
                                    overflow: 'hidden',
                                    border: '3px solid rgba(255,200,0,0.4)',
                                    boxShadow: '0 8px 24px rgba(255,200,0,0.2)',
                                    background: '#fff',
                                }}>
                                    <img
                                        src={`/medal/${selectedBadge.type}.webp`}
                                        alt={selectedBadge.challengeTitle}
                                        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                                    />
                                </div>
                                <div style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 16,
                                    fontWeight: 800,
                                    color: '#2D3436',
                                    textAlign: 'center',
                                    lineHeight: 1.5,
                                }}>
                                    {selectedBadge.challengeTitle}
                                </div>
                                <div style={{
                                    fontSize: 12,
                                    color: '#B2BEC3',
                                    fontFamily: "'Outfit', sans-serif",
                                }}>
                                    {formatDate(selectedBadge.earnedDate)}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body,
            )}
        </>
    );
};
