import React from 'react';
import { Modal } from '../../../components/Modal';

interface DevPasswordModalProps {
    isOpen: boolean;
    passwordInput: string;
    onAppendDigit: (digit: string) => void;
    onClose: () => void;
    onBackspace: () => void;
}

export const DevPasswordModal: React.FC<DevPasswordModalProps> = ({
    isOpen,
    passwordInput,
    onAppendDigit,
    onClose,
    onBackspace,
}) => {
    return (
        <Modal
            open={isOpen}
            onClose={onClose}
            zIndex={200}
            maxWidth={280}
            ariaLabel="パスワードを入力"
            contentStyle={{
                textAlign: 'center',
                padding: '32px 24px',
            }}
        >
            <h3 style={{
                fontFamily: "'Noto Sans JP', sans-serif",
                fontSize: 16,
                fontWeight: 700,
                color: '#2D3436',
                marginBottom: 16,
            }}>
                パスワードを入力
            </h3>
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 8,
                marginBottom: 20,
            }}>
                {[0, 1, 2, 3].map((index) => (
                    <div key={index} style={{
                        width: 40,
                        height: 48,
                        borderRadius: 8,
                        border: '2px solid #DFE6E9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 24,
                        fontWeight: 700,
                        color: '#2D3436',
                        background: passwordInput[index] ? '#F0FDFA' : '#fff',
                    }}>
                        {passwordInput[index] ? '●' : ''}
                    </div>
                ))}
            </div>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 8,
                maxWidth: 220,
                margin: '0 auto',
            }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
                    <button
                        key={number}
                        onClick={() => onAppendDigit(String(number))}
                        style={{
                            width: '100%',
                            aspectRatio: '1',
                            borderRadius: 12,
                            border: '1px solid #DFE6E9',
                            background: '#fff',
                            fontSize: 20,
                            fontWeight: 700,
                            color: '#2D3436',
                            cursor: 'pointer',
                        }}
                    >
                        {number}
                    </button>
                ))}
                <button
                    onClick={onClose}
                    style={{
                        width: '100%',
                        aspectRatio: '1',
                        borderRadius: 12,
                        border: '1px solid #DFE6E9',
                        background: '#fff',
                        fontSize: 14,
                        color: '#8395A7',
                        cursor: 'pointer',
                    }}
                >
                    ✕
                </button>
                <button
                    onClick={() => onAppendDigit('0')}
                    style={{
                        width: '100%',
                        aspectRatio: '1',
                        borderRadius: 12,
                        border: '1px solid #DFE6E9',
                        background: '#fff',
                        fontSize: 20,
                        fontWeight: 700,
                        color: '#2D3436',
                        cursor: 'pointer',
                    }}
                >
                    0
                </button>
                <button
                    onClick={onBackspace}
                    style={{
                        width: '100%',
                        aspectRatio: '1',
                        borderRadius: 12,
                        border: '1px solid #DFE6E9',
                        background: '#fff',
                        fontSize: 14,
                        color: '#8395A7',
                        cursor: 'pointer',
                    }}
                >
                    ←
                </button>
            </div>
        </Modal>
    );
};
