import React from 'react';
import { motion } from 'framer-motion';

interface EmojiSelectorCardProps {
    options: string[];
    selectedEmoji: string;
    onSelect: (emoji: string) => void;
}

export const EmojiSelectorCard: React.FC<EmojiSelectorCardProps> = ({
    options,
    selectedEmoji,
    onSelect,
}) => {
    return (
        <div className="card" style={{ padding: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.03)', border: 'none' }}>
            <label style={{
                fontFamily: "'Noto Sans JP', sans-serif",
                fontSize: 13,
                fontWeight: 700,
                color: '#2D3436',
                display: 'block',
                marginBottom: 12,
            }}>
                アイコン
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {options.map((emoji) => (
                    <motion.button
                        key={emoji}
                        whileTap={{ scale: 0.9 }}
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
        </div>
    );
};
