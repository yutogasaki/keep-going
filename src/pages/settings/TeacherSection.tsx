import React from 'react';
import { GraduationCap, ChevronRight } from 'lucide-react';

interface TeacherSectionProps {
    onEnterDashboard: () => void;
}

export const TeacherSection: React.FC<TeacherSectionProps> = ({ onEnterDashboard }) => {
    return (
        <button
            className="card"
            onClick={onEnterDashboard}
            style={{
                width: '100%',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                cursor: 'pointer',
                border: 'none',
                textAlign: 'left',
            }}
        >
            <div style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #FFEAA7, #FDCB6E)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
            }}>
                <GraduationCap size={20} color="#D68910" />
            </div>
            <div style={{ flex: 1 }}>
                <div style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#2D3436',
                }}>
                    先生ダッシュボード
                </div>
                <div style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 12,
                    color: '#8395A7',
                }}>
                    生徒の練習状況を確認
                </div>
            </div>
            <ChevronRight size={18} color="#B2BEC3" />
        </button>
    );
};
