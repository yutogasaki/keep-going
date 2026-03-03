import React from 'react';
import { motion } from 'framer-motion';
import { USER_CLASS_LEVELS, type ClassLevel } from '../../data/exercises';

interface ClassStepProps {
    selectedClass: ClassLevel | null;
    onClassSelect: (level: ClassLevel) => void;
    onNext: () => void;
}

export const ClassStep: React.FC<ClassStepProps> = ({
    selectedClass,
    onClassSelect,
    onNext,
}) => {
    return (
        <motion.div
            key="class"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 24,
                padding: '0 24px',
                maxWidth: 400,
                width: '100%',
                textAlign: 'center',
            }}
        >
            <h2
                style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 22,
                    fontWeight: 700,
                    color: '#2D3436',
                }}
            >
                クラスをえらんでね
            </h2>
            <p
                style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 13,
                    color: '#8395A7',
                    marginTop: -12,
                }}
            >
                あとからでも変えられるよ
            </p>

            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    width: '100%',
                }}
            >
                {USER_CLASS_LEVELS.map(({ id, label, emoji, desc }) => (
                    <motion.button
                        key={id}
                        onClick={() => onClassSelect(id)}
                        whileTap={{ scale: 0.97 }}
                        className="card card-sm"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 14,
                            padding: '16px 20px',
                            border: selectedClass === id ? '2px solid #2BBAA0' : '2px solid transparent',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'border 0.2s ease',
                        }}
                    >
                        <span style={{ fontSize: 28 }}>{emoji}</span>
                        <div>
                            <div
                                style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 16,
                                    fontWeight: 700,
                                    color: selectedClass === id ? '#2BBAA0' : '#2D3436',
                                }}
                            >
                                {label}
                            </div>
                            <div
                                style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 12,
                                    color: '#8395A7',
                                }}
                            >
                                {desc}
                            </div>
                        </div>
                        {selectedClass === id && (
                            <span
                                style={{
                                    marginLeft: 'auto',
                                    color: '#2BBAA0',
                                    fontWeight: 700,
                                    fontSize: 18,
                                }}
                            >
                                ✓
                            </span>
                        )}
                    </motion.button>
                ))}
            </div>

            <button
                onClick={onNext}
                disabled={!selectedClass}
                style={{
                    marginTop: 8,
                    padding: '14px 48px',
                    borderRadius: 9999,
                    border: 'none',
                    background: selectedClass ? '#2BBAA0' : '#B2BEC3',
                    color: 'white',
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: selectedClass ? 'pointer' : 'not-allowed',
                    boxShadow: selectedClass ? '0 4px 16px rgba(43, 186, 160, 0.35)' : 'none',
                    transition: 'all 0.3s ease',
                }}
            >
                つぎへ
            </button>
        </motion.div>
    );
};
