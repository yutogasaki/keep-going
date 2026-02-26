import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import type { HelpItemData } from './helpData';

interface HelpItemProps {
    item: HelpItemData;
    isOpen: boolean;
    onToggle: () => void;
}

export const HelpItem: React.FC<HelpItemProps> = ({ item, isOpen, onToggle }) => (
    <div style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
        <button
            onClick={onToggle}
            style={{
                width: '100%',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                padding: '14px 0',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                color: '#2D3436',
            }}
        >
            <span style={{
                fontFamily: "'Noto Sans JP', sans-serif",
                fontSize: 13,
                fontWeight: 700,
                color: '#2BBAA0',
                flexShrink: 0,
                marginTop: 1,
            }}>Q:</span>
            <span style={{
                fontFamily: "'Noto Sans JP', sans-serif",
                fontSize: 13,
                fontWeight: 600,
                color: '#2D3436',
                flex: 1,
                lineHeight: 1.5,
            }}>{item.q}</span>
            <ChevronDown
                size={16}
                color="#B2BEC3"
                style={{
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                    flexShrink: 0,
                    marginTop: 2,
                }}
            />
        </button>
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ overflow: 'hidden' }}
                >
                    <div style={{
                        padding: '0 0 14px 22px',
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 13,
                        color: '#636E72',
                        lineHeight: 1.7,
                        whiteSpace: 'pre-line',
                    }}>
                        {item.a}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
);
