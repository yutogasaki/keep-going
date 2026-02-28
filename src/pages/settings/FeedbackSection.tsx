import React from 'react';
import { MessageSquarePlus, ChevronRight } from 'lucide-react';

// ↓ ここにGoogleフォームのURLを貼ってください
const FEEDBACK_FORM_URL = 'https://forms.gle/f6DzaME1Vy2M8ANk7';

export const FeedbackSection: React.FC = () => {
    const handleOpen = () => {
        window.open(FEEDBACK_FORM_URL, '_blank', 'noopener,noreferrer');
    };

    return (
        <div
            className="card"
            onClick={handleOpen}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '16px 20px',
                cursor: 'pointer',
            }}
        >
            <div style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #FFF0F5, #FFF5E8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
            }}>
                <MessageSquarePlus size={22} color="#FF7EB3" />
            </div>
            <div style={{ flex: 1 }}>
                <div style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#2D3436',
                }}>
                    要望・バグを報告する
                </div>
                <div style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 12,
                    color: '#8395A7',
                }}>
                    ご意見・不具合はこちらから
                </div>
            </div>
            <ChevronRight size={18} color="#B2BEC3" />
        </div>
    );
};
