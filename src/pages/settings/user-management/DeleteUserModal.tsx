import React from 'react';
import { Modal } from '../../../components/Modal';

interface DeleteUserModalProps {
    userId: string | null;
    onCancel: () => void;
    onConfirm: (userId: string) => void;
}

export const DeleteUserModal: React.FC<DeleteUserModalProps> = ({ userId, onCancel, onConfirm }) => {
    return (
        <Modal
            open={!!userId}
            onClose={onCancel}
            zIndex={100000}
            ariaLabel="ユーザーの削除"
        >
            <h3 style={{
                margin: '0 0 12px 0',
                fontFamily: "'Noto Sans JP', sans-serif",
                fontSize: 18,
                fontWeight: 700,
                color: '#2D3436',
                textAlign: 'center',
            }}>
                ユーザーの削除
            </h3>
            <p style={{
                margin: '0 0 24px 0',
                fontFamily: "'Noto Sans JP', sans-serif",
                fontSize: 14,
                color: '#636E72',
                textAlign: 'center',
                lineHeight: 1.5,
            }}>
                本当に削除しますか？<br />この操作は取り消せません。
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
                <button
                    onClick={onCancel}
                    style={{
                        flex: 1,
                        padding: '14px',
                        borderRadius: 16,
                        border: 'none',
                        background: '#F0F3F5',
                        color: '#636E72',
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 15,
                        fontWeight: 700,
                        cursor: 'pointer',
                    }}
                >
                    キャンセル
                </button>
                <button
                    onClick={() => userId && onConfirm(userId)}
                    style={{
                        flex: 1,
                        padding: '14px',
                        borderRadius: 16,
                        border: 'none',
                        background: '#E74C3C',
                        color: 'white',
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 15,
                        fontWeight: 700,
                        cursor: 'pointer',
                    }}
                >
                    削除する
                </button>
            </div>
        </Modal>
    );
};
