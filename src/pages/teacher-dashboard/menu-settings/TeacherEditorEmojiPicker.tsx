import React from 'react';
import { motion } from 'framer-motion';

interface TeacherEditorEmojiPickerProps {
    options: string[];
    selectedEmoji: string;
    onSelect: (emoji: string) => void;
}

export const TeacherEditorEmojiPicker: React.FC<TeacherEditorEmojiPickerProps> = ({
    options,
    selectedEmoji,
    onSelect,
}) => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {options.map((emoji) => (
            <motion.button
                key={emoji}
                whileTap={{ scale: 0.9 }}
                type="button"
                onClick={() => onSelect(emoji)}
                style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    border: selectedEmoji === emoji ? '2px solid #2BBAA0' : '2px solid transparent',
                    background: selectedEmoji === emoji ? 'rgba(43,186,160,0.08)' : '#F8F9FA',
                    cursor: 'pointer',
                    fontSize: 22,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                }}
            >
                {emoji}
            </motion.button>
        ))}
    </div>
);
