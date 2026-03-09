import React from 'react';
import type { ConfirmAction } from './types';
import { DISPLAY_TERMS } from '../../lib/terminology';

interface ConfirmActionDialogProps {
    confirmAction: ConfirmAction | null;
    actionLoading: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

export const ConfirmActionDialog: React.FC<ConfirmActionDialogProps> = ({
    confirmAction,
    actionLoading,
    onCancel,
    onConfirm,
}) => {
    if (!confirmAction) {
        return null;
    }

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2000,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
        }}>
            <div style={{
                background: '#fff',
                borderRadius: 16,
                padding: 24,
                maxWidth: 340,
                width: '100%',
            }}>
                <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>
                    {confirmAction.type === 'delete' ? 'アカウントデータ削除'
                        : confirmAction.type === 'suspend' ? 'アカウント休止'
                            : 'アカウント休止解除'}
                </h3>
                <p style={{ fontSize: 13, color: '#555', margin: '0 0 8px' }}>
                    {confirmAction.type === 'delete'
                        ? 'このアカウントの全データ（メンバー・セッション・メニュー等）を完全に削除します。この操作は取り消せません。'
                        : confirmAction.type === 'suspend'
                            ? `休止すると${DISPLAY_TERMS.publicMenu}や先生ダッシュボードに表示されなくなります。`
                            : `休止を解除すると、再び${DISPLAY_TERMS.publicMenu}や先生ダッシュボードに表示されます。`}
                </p>
                <p style={{ fontSize: 11, color: '#999', margin: '0 0 16px', wordBreak: 'break-all' }}>
                    ID: {confirmAction.accountId.slice(0, 8)}...
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button
                        onClick={onCancel}
                        disabled={actionLoading}
                        style={{
                            flex: 1,
                            padding: '12px 0',
                            borderRadius: 14,
                            border: '1px solid #E0E0E0',
                            background: '#fff',
                            color: '#636E72',
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        キャンセル
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={actionLoading}
                        style={{
                            flex: 1,
                            padding: '12px 0',
                            borderRadius: 14,
                            border: 'none',
                            background: confirmAction.type === 'delete' ? '#ef4444'
                                : confirmAction.type === 'suspend' ? '#f59e0b' : '#22c55e',
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: 14,
                            cursor: 'pointer',
                        }}
                    >
                        {actionLoading ? '処理中...'
                            : confirmAction.type === 'delete' ? '削除する'
                                : confirmAction.type === 'suspend' ? '休止する'
                                    : '解除する'}
                    </button>
                </div>
            </div>
        </div>
    );
};
