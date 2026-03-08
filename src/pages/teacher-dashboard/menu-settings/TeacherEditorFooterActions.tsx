import React from 'react';
import { motion } from 'framer-motion';
import { Play, Trash2 } from 'lucide-react';
import { getEditorActionButtonStyle, getEditorSubmitButtonStyle } from '../../../components/editor/EditorShell';

interface TeacherEditorFooterActionsProps {
    canSave: boolean;
    isEditing: boolean;
    onDelete?: () => void;
    onPlay?: () => void;
    onSubmit: () => void;
    submitting: boolean;
}

export const TeacherEditorFooterActions: React.FC<TeacherEditorFooterActionsProps> = ({
    canSave,
    isEditing,
    onDelete,
    onPlay,
    onSubmit,
    submitting,
}) => (
    <>
        {isEditing && (onPlay || onDelete) ? (
            <div style={{ display: 'flex', gap: 8 }}>
                {onPlay ? (
                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        type="button"
                        onClick={onPlay}
                        style={getEditorActionButtonStyle('soft')}
                    >
                        <Play size={14} />
                        ためす
                    </motion.button>
                ) : null}
                {onDelete ? (
                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        type="button"
                        onClick={onDelete}
                        style={getEditorActionButtonStyle('danger', false)}
                    >
                        <Trash2 size={14} />
                        削除
                    </motion.button>
                ) : null}
            </div>
        ) : null}

        <motion.button
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={onSubmit}
            disabled={!canSave || submitting}
            style={getEditorSubmitButtonStyle(canSave && !submitting)}
        >
            {submitting ? '保存中...' : isEditing ? '保存' : '作成'}
        </motion.button>
    </>
);
