import React from 'react';
import { Modal } from './Modal';
import { FONT, COLOR, FONT_SIZE, Z } from '../lib/styles';

interface ConfirmDeleteModalProps {
    open: boolean;
    title: string;
    message: string;
    details?: React.ReactNode;
    onCancel: () => void;
    onConfirm: () => void;
    loading?: boolean;
    confirmLabel?: string;
    loadingLabel?: string;
    confirmColor?: string;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
    open,
    title,
    message,
    details,
    onCancel,
    onConfirm,
    loading = false,
    confirmLabel = '削除する',
    loadingLabel = '削除中...',
    confirmColor = COLOR.danger,
}) => (
    <Modal open={open} onClose={onCancel} zIndex={Z.confirm} ariaLabel={title}>
        <h3
            style={{
                margin: '0 0 8px',
                fontFamily: FONT.body,
                fontSize: FONT_SIZE.lg,
                fontWeight: 700,
                color: COLOR.dark,
            }}
        >
            {title}
        </h3>
        <p
            style={{
                margin: '0 0 20px',
                fontFamily: FONT.body,
                fontSize: 13,
                color: COLOR.text,
                lineHeight: 1.6,
            }}
        >
            {message}
        </p>
        {details ? <div style={{ margin: '0 0 20px' }}>{details}</div> : null}
        <div style={{ display: 'flex', gap: 8 }}>
            <button
                onClick={onCancel}
                disabled={loading}
                style={{
                    flex: 1,
                    padding: '12px 0',
                    borderRadius: 'var(--btn-radius)',
                    border: 'var(--btn-cancel-border)',
                    background: 'var(--btn-cancel-bg)',
                    fontFamily: FONT.body,
                    fontSize: FONT_SIZE.md,
                    fontWeight: 600,
                    color: 'var(--btn-cancel-color)',
                    cursor: 'pointer',
                }}
            >
                キャンセル
            </button>
            <button
                onClick={onConfirm}
                disabled={loading}
                style={{
                    flex: 1,
                    padding: '12px 0',
                    borderRadius: 'var(--btn-radius)',
                    border: 'none',
                    background: confirmColor,
                    fontFamily: FONT.body,
                    fontSize: FONT_SIZE.md,
                    fontWeight: 700,
                    color: COLOR.white,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                }}
            >
                {loading ? loadingLabel : confirmLabel}
            </button>
        </div>
    </Modal>
);
