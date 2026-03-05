import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { COLOR, FONT, FONT_SIZE, RADIUS } from '../../lib/styles';

interface FuwafuwaNameModalProps {
    open: boolean;
    currentName: string | null;
    onCancel: () => void;
    onConfirm: (name: string | null) => void;
}

export const FuwafuwaNameModal: React.FC<FuwafuwaNameModalProps> = ({
    open,
    currentName,
    onCancel,
    onConfirm,
}) => {
    const [value, setValue] = useState(currentName || '');
    const inputRef = useRef<HTMLInputElement>(null);
    const trapRef = useFocusTrap<HTMLDivElement>(open);

    useEffect(() => {
        if (open) {
            setValue(currentName || '');
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [open, currentName]);

    const handleSubmit = () => {
        onConfirm(value.trim() || null);
    };

    return createPortal(
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 2000,
                        background: 'rgba(0,0,0,0.45)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 20,
                    }}
                    onClick={onCancel}
                >
                    <motion.div
                        ref={trapRef}
                        role="dialog"
                        aria-modal="true"
                        aria-label="なまえをつけよう"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: '#fff',
                            borderRadius: 20,
                            padding: 24,
                            maxWidth: 320,
                            width: '100%',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                        }}
                    >
                        <h3 style={{
                            margin: '0 0 4px',
                            fontFamily: FONT.body,
                            fontSize: FONT_SIZE.lg,
                            fontWeight: 700,
                            color: COLOR.dark,
                            textAlign: 'center',
                        }}>
                            🌟 なまえをつけよう
                        </h3>
                        <p style={{
                            margin: '0 0 16px',
                            fontFamily: FONT.body,
                            fontSize: 13,
                            color: COLOR.text,
                            lineHeight: 1.6,
                            textAlign: 'center',
                        }}>
                            パートナーに名前をつけてあげよう！
                        </p>
                        <input
                            ref={inputRef}
                            type="text"
                            value={value}
                            onChange={e => setValue(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') handleSubmit();
                            }}
                            placeholder="なまえを入力"
                            maxLength={20}
                            style={{
                                width: '100%',
                                padding: '14px 18px',
                                borderRadius: RADIUS.lg,
                                border: '2px solid rgba(0,0,0,0.08)',
                                fontFamily: FONT.body,
                                fontSize: FONT_SIZE.lg,
                                fontWeight: 600,
                                color: COLOR.dark,
                                textAlign: 'center',
                                outline: 'none',
                                boxSizing: 'border-box',
                                transition: 'border-color 0.2s',
                            }}
                            onFocus={e => { e.target.style.borderColor = '#6C5CE7'; }}
                            onBlur={e => { e.target.style.borderColor = 'rgba(0,0,0,0.08)'; }}
                        />
                        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                            <button
                                onClick={onCancel}
                                style={{
                                    flex: 1,
                                    padding: '12px 0',
                                    borderRadius: RADIUS.lg,
                                    border: 'none',
                                    background: COLOR.bgMuted,
                                    fontFamily: FONT.body,
                                    fontSize: FONT_SIZE.md,
                                    fontWeight: 600,
                                    color: COLOR.text,
                                    cursor: 'pointer',
                                }}
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={handleSubmit}
                                style={{
                                    flex: 1,
                                    padding: '12px 0',
                                    borderRadius: RADIUS.lg,
                                    border: 'none',
                                    background: '#6C5CE7',
                                    fontFamily: FONT.body,
                                    fontSize: FONT_SIZE.md,
                                    fontWeight: 700,
                                    color: COLOR.white,
                                    cursor: 'pointer',
                                }}
                            >
                                けってい
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body,
    );
};
