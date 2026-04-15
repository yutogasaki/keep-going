import React from 'react';
import { motion } from 'framer-motion';
import { ConfirmDeleteModal } from '../../../components/ConfirmDeleteModal';
import { getEditorSubmitButtonStyle } from '../../../components/editor/EditorShell';

interface CreateGroupSaveSectionProps {
    saveError: string | null;
    canSave: boolean;
    saving: boolean;
    isEditing: boolean;
    showRepublishConfirm: boolean;
    onSave: () => void;
    onRepublishCancel: () => void;
    onRepublishConfirm: () => void;
}

export const CreateGroupSaveSection: React.FC<CreateGroupSaveSectionProps> = ({
    saveError,
    canSave,
    saving,
    isEditing,
    showRepublishConfirm,
    onSave,
    onRepublishCancel,
    onRepublishConfirm,
}) => {
    return (
        <>
            {saveError ? (
                <div style={{
                    padding: '12px 16px',
                    borderRadius: 12,
                    background: 'rgba(255,71,87,0.08)',
                    color: '#E17055',
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 12,
                }}
                >
                    {saveError}
                </div>
            ) : null}

            <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onSave}
                disabled={!canSave}
                style={{
                    ...getEditorSubmitButtonStyle(canSave),
                    zIndex: 1,
                }}
            >
                {saving ? 'ほぞん中...' : isEditing ? 'ほぞん' : 'つくる！'}
            </motion.button>

            <ConfirmDeleteModal
                open={showRepublishConfirm}
                title="公開版も更新する？"
                message="保存しました。公開版のメニューも一緒に更新しますか？"
                onCancel={onRepublishCancel}
                onConfirm={onRepublishConfirm}
                confirmLabel="更新する"
                confirmColor="#2BBAA0"
            />
        </>
    );
};
