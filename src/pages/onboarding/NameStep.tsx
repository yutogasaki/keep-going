import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';

interface NameStepProps {
    userName: string;
    onNameChange: (name: string) => void;
    onNext: () => void;
    onBack: () => void;
}

export const NameStep: React.FC<NameStepProps> = ({
    userName,
    onNameChange,
    onNext,
    onBack,
}) => {
    const canProceed = userName.trim().length > 0;

    return (
        <motion.div
            key="name"
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
                maxWidth: 360,
                textAlign: 'center',
                width: '100%',
            }}
        >
            <button
                onClick={onBack}
                style={{
                    alignSelf: 'flex-start',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: 0,
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
                }}
            >
                おなまえを おしえてね
            </h2>

            <input
                type="text"
                value={userName}
                onChange={(event) => onNameChange(event.target.value)}
                placeholder="ゲスト"
                autoFocus
                style={{
                    width: '100%',
                    padding: '16px 20px',
                    borderRadius: 16,
                    border: '2px solid rgba(43, 186, 160, 0.3)',
                    fontSize: 18,
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontWeight: 600,
                    textAlign: 'center',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                }}
                onFocus={(event) => {
                    event.target.style.borderColor = '#2BBAA0';
                }}
                onBlur={(event) => {
                    event.target.style.borderColor = 'rgba(43, 186, 160, 0.3)';
                }}
            />

            <button
                onClick={onNext}
                disabled={!canProceed}
                style={{
                    marginTop: 16,
                    padding: '14px 48px',
                    borderRadius: 9999,
                    border: 'none',
                    background: canProceed ? '#2BBAA0' : '#B2BEC3',
                    color: 'white',
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: canProceed ? 'pointer' : 'not-allowed',
                    boxShadow: canProceed ? '0 4px 16px rgba(43, 186, 160, 0.35)' : 'none',
                    transition: 'all 0.3s ease',
                }}
            >
                つぎへ
            </button>
        </motion.div>
    );
};
