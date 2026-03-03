import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface LoginBackButtonProps {
    onBack: () => void;
}

export const LoginBackButton: React.FC<LoginBackButtonProps> = ({ onBack }) => {
    return (
        <div style={{ padding: '16px 0' }}>
            <button
                onClick={onBack}
                style={{
                    background: 'none',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    color: '#8395A7',
                    cursor: 'pointer',
                    padding: 0,
                    fontSize: 14,
                }}
            >
                <ArrowLeft size={18} />
                もどる
            </button>
        </div>
    );
};
