import React from 'react';
import { LoginBackButton } from './LoginBackButton';

interface SignUpSuccessViewProps {
    email: string;
    onBack: () => void;
}

export const SignUpSuccessView: React.FC<SignUpSuccessViewProps> = ({ email, onBack }) => {
    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            padding: '0 20px',
        }}>
            <LoginBackButton onBack={onBack} />
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 16,
                paddingBottom: 100,
            }}>
                <div style={{ fontSize: 48 }}>&#x2709;</div>
                <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
                    メールを確認してください
                </h2>
                <p style={{ color: '#8395A7', textAlign: 'center', fontSize: 14, lineHeight: 1.6 }}>
                    {email} に確認メールを送りました。<br />
                    メール内のリンクをクリックして登録を完了してください。
                </p>
            </div>
        </div>
    );
};
