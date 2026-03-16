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

    const title = confirmAction.title ?? (
        confirmAction.type === 'delete'
        ? 'アカウント全削除'
        : confirmAction.type === 'suspend'
            ? 'アカウント休止'
            : confirmAction.type === 'unsuspend'
                ? 'アカウント休止解除'
                : confirmAction.type === 'delete_member'
                    ? 'ユーザーだけ削除'
                    : confirmAction.type === 'bulk_suspend'
                        ? 'まとめて休止'
                        : confirmAction.type === 'bulk_unsuspend'
                            ? 'まとめて復活'
                            : confirmAction.type === 'bulk_delete'
                                ? '休止済み候補をまとめて削除'
                                : '整理候補ユーザーをまとめて削除'
    );

    const description = confirmAction.description ?? (
        confirmAction.type === 'delete'
            ? 'このアカウントの全データを完全に削除します。メンバー・セッション・メニューも消え、この操作は取り消せません。'
            : confirmAction.type === 'suspend'
                ? `休止すると${DISPLAY_TERMS.publicMenu}や先生ダッシュボードに表示されなくなります。`
                : confirmAction.type === 'unsuspend'
                    ? `休止を解除すると、再び${DISPLAY_TERMS.publicMenu}や先生ダッシュボードに表示されます。`
                    : confirmAction.type === 'delete_member'
                        ? 'このメンバーだけを削除します。アカウント自体は削除しません。'
                        : confirmAction.type === 'bulk_suspend'
                            ? '選択したアカウントをまとめて休止します。あとで休止中フィルタから見直せます。'
                            : confirmAction.type === 'bulk_unsuspend'
                                ? '選択した休止中アカウントをまとめて復活します。'
                                : confirmAction.type === 'bulk_delete'
                                    ? '休止済みの候補アカウントをまとめて完全削除します。この操作は取り消せません。'
                                    : '整理候補のメンバーだけをまとめて削除します。アカウント自体は削除しません。'
    );

    const confirmLabel = actionLoading
        ? '処理中...'
        : confirmAction.confirmLabel ?? (
            confirmAction.type === 'delete' || confirmAction.type === 'bulk_delete'
                ? '削除する'
                : confirmAction.type === 'delete_member' || confirmAction.type === 'bulk_delete_members'
                    ? 'ユーザーだけ削除'
                    : confirmAction.type === 'suspend' || confirmAction.type === 'bulk_suspend'
                        ? '休止する'
                        : confirmAction.type === 'bulk_unsuspend'
                            ? '復活する'
                            : '解除する'
        );

    const confirmColor = confirmAction.type === 'delete' || confirmAction.type === 'bulk_delete'
            ? '#ef4444'
        : confirmAction.type === 'delete_member' || confirmAction.type === 'bulk_delete_members'
            ? '#0f766e'
        : confirmAction.type === 'suspend' || confirmAction.type === 'bulk_suspend'
            ? '#f59e0b'
            : '#22c55e';

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
                    {title}
                </h3>
                <p style={{ fontSize: 13, color: '#555', margin: '0 0 8px' }}>
                    {description}
                </p>
                <p style={{ fontSize: 11, color: '#999', margin: '0 0 16px', wordBreak: 'break-word', lineHeight: 1.5 }}>
                    {confirmAction.subjectLabel}
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
                            background: confirmColor,
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: 14,
                            cursor: 'pointer',
                        }}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};
