import React from 'react';
import { motion } from 'framer-motion';
import { ActivityHeatmap } from '../../../components/ActivityHeatmap';
import type { SessionRecord } from '../../../lib/db';

interface ActivitySectionProps {
    sessions: SessionRecord[];
}

export const ActivitySection: React.FC<ActivitySectionProps> = ({ sessions }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
        >
            <div style={{
                fontFamily: "'Noto Sans JP', sans-serif",
                fontSize: 13,
                fontWeight: 700,
                color: '#8395A7',
                marginBottom: 10,
                letterSpacing: 1,
            }}>
                アクティビティ
            </div>
            <div className="card" style={{ padding: '20px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <ActivityHeatmap sessions={sessions} daysToShow={14} />
                <p style={{
                    fontSize: 11,
                    color: '#B2BEC3',
                    marginTop: 10,
                    fontFamily: "'Noto Sans JP', sans-serif",
                    letterSpacing: 1,
                }}>
                    LAST 14 DAYS
                </p>
            </div>
        </motion.div>
    );
};
