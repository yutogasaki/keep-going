import React from 'react';
import { Bug } from 'lucide-react';
import { FuwafuwaDebugSection } from './FuwafuwaDebugSection';
import { MilestoneDebugSection } from './MilestoneDebugSection';
import { ChibifuwaDebugSection } from './ChibifuwaDebugSection';
import { ChallengeDebugSection } from './ChallengeDebugSection';

export const DeveloperDebugPanel: React.FC = () => {
    return (
        <div className="card card-sm" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            marginTop: 24,
            border: '1px dashed #E17055',
        }}>
            <div style={{
                fontFamily: "'Noto Sans JP', sans-serif",
                fontSize: 14,
                fontWeight: 700,
                color: '#E17055',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
            }}>
                <Bug size={16} />
                デバッグ機能 (開発専用)
            </div>

            <FuwafuwaDebugSection />
            <MilestoneDebugSection />
            <ChibifuwaDebugSection />
            <ChallengeDebugSection />
        </div>
    );
};
