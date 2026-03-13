import React from 'react';
import { motion } from 'framer-motion';
import { Globe } from 'lucide-react';
import { DISPLAY_TERMS } from '../../../lib/terminology';

interface PublicMenuSectionProps {
    onOpen: () => void;
}

export const PublicMenuSection: React.FC<PublicMenuSectionProps> = ({ onOpen }) => {
    return (
        <section>
            <h2 style={{
                fontFamily: "'Noto Sans JP', sans-serif",
                fontSize: 13,
                fontWeight: 700,
                color: '#8395A7',
                marginBottom: 10,
                letterSpacing: 1,
            }}>
                {DISPLAY_TERMS.publicMenu}
            </h2>
            <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={onOpen}
                className="card"
                style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '16px 20px',
                    border: 'none',
                    background: 'white',
                    cursor: 'pointer',
                    textAlign: 'left',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                }}
            >
                <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    background: 'linear-gradient(135deg, #E8F4FD, #BEE3F8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(190, 227, 248, 0.5)',
                }}>
                    <Globe size={24} color="#0984E3" />
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 15,
                        fontWeight: 700,
                        color: '#2D3436',
                        marginBottom: 4,
                    }}>
                        {DISPLAY_TERMS.publicMenu}を見る
                    </div>
                    <div style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 12,
                        color: '#8395A7',
                        lineHeight: 1.4,
                    }}>
                        ほかの人のメニューをさがして使える
                    </div>
                </div>
            </motion.button>
        </section>
    );
};
