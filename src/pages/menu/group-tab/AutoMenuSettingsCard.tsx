import React from 'react';
import { motion } from 'framer-motion';
import { Settings2 } from 'lucide-react';

interface AutoMenuSettingsCardProps {
    isTogetherMode: boolean;
    dailyTargetMinutes: number;
    requiredCount: number;
    excludedCount: number;
    onOpenCustomMenu: () => void;
}

export const AutoMenuSettingsCard: React.FC<AutoMenuSettingsCardProps> = React.memo(({
    isTogetherMode,
    dailyTargetMinutes,
    requiredCount,
    excludedCount,
    onOpenCustomMenu,
}) => {
    return (
        <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onOpenCustomMenu}
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
                background: 'linear-gradient(135deg, #FFF0F5, #FFE4E1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(255, 228, 225, 0.5)',
            }}>
                <Settings2 size={24} color="#E17055" />
            </div>
            <div style={{ flex: 1 }}>
                <div style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 15,
                    fontWeight: 700,
                    color: '#2D3436',
                    marginBottom: 4,
                }}>
                    おまかせの設定
                </div>
                <div style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 12,
                    color: '#8395A7',
                    lineHeight: 1.4,
                }}>
                    {isTogetherMode
                        ? '個人モードに切りかえると設定を変更できます'
                        : `${dailyTargetMinutes}分 / ★ 必須: ${requiredCount}個 / 🔴 除外: ${excludedCount}個`
                    }
                </div>
            </div>
        </motion.button>
    );
});
