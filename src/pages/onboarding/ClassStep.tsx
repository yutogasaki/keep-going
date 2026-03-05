import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { USER_CLASS_LEVELS, type ClassLevel } from '../../data/exercises';

interface ClassStepProps {
    onClassSelect: (level: ClassLevel) => void;
    onBack: () => void;
}

export const ClassStep: React.FC<ClassStepProps> = ({
    onClassSelect,
    onBack,
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
                width: '100%',
                height: '100%',
                padding: '0 24px',
                maxWidth: 400,
            }}
        >
            <button
                onClick={onBack}
                style={{
                    alignSelf: 'flex-start',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '16px 0',
                    background: 'none',
                    border: 'none',
                    color: '#8395A7',
                    fontSize: 14,
                    fontFamily: "'Noto Sans JP', sans-serif",
                    cursor: 'pointer',
                }}
            >
                <ChevronLeft size={18} />
                もどる
            </button>

            <h2
                style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 22,
                    fontWeight: 700,
                    color: '#2D3436',
                    textAlign: 'center',
                }}
            >
                クラスをえらんでね
            </h2>
            <p
                style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 13,
                    color: '#8395A7',
                    marginTop: 4,
                    textAlign: 'center',
                }}
            >
                あとからでも変えられるよ
            </p>

            <div
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    width: '100%',
                    marginTop: 20,
                    paddingBottom: 32,
                    WebkitOverflowScrolling: 'touch',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
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
                                border: '2px solid transparent',
                                cursor: 'pointer',
                                textAlign: 'left',
                            }}
                        >
                            <span style={{ fontSize: 28 }}>{emoji}</span>
                            <div>
                                <div
                                    style={{
                                        fontFamily: "'Noto Sans JP', sans-serif",
                                        fontSize: 16,
                                        fontWeight: 700,
                                        color: '#2D3436',
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
                        </motion.button>
                    ))}
                </div>
            </div>
        </motion.div>
    );
};
