import React, { useEffect, useRef, useState } from 'react';
import { COLOR, FONT, FONT_SIZE, RADIUS } from '../../lib/styles';
import { Modal } from '../Modal';

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

    useEffect(() => {
        if (open) {
            setValue(currentName || '');
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [open, currentName]);

    const handleSubmit = () => {
        onConfirm(value.trim() || null);
    };

    return (
        <Modal
            open={open}
            onClose={onCancel}
            zIndex={2000}
            ariaLabel="なまえをつけよう"
            contentStyle={{
                background: '#fff',
                borderRadius: 20,
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
        </Modal>
    );
};
