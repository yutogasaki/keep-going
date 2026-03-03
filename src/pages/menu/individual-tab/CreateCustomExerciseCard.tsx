import React from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

interface CreateCustomExerciseCardProps {
    onCreate: () => void;
}

export const CreateCustomExerciseCard: React.FC<CreateCustomExerciseCardProps> = ({ onCreate }) => {
    return (
        <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onCreate}
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
                marginTop: 4,
            }}
        >
            <div style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: 'linear-gradient(135deg, #E0F2F1, #B2DFDB)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(178, 223, 219, 0.5)',
            }}>
                <Plus size={24} color="#00796B" strokeWidth={2.5} />
            </div>
            <div style={{ flex: 1 }}>
                <div style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 15,
                    fontWeight: 700,
                    color: '#2D3436',
                    marginBottom: 4,
                }}>
                    新しくつくる
                </div>
                <div style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 12,
                    color: '#8395A7',
                    lineHeight: 1.4,
                }}>
                    オリジナル種目を追加
                </div>
            </div>
        </motion.button>
    );
};
