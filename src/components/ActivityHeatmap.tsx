import React from 'react';
import { getDateKeyOffset, type SessionRecord } from '../lib/db';

interface ActivityHeatmapProps {
    sessions: SessionRecord[];
    daysToShow?: number;
}

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ sessions, daysToShow = 14 }) => {
    // Generate array of date keys for the last `daysToShow` days
    const dates = Array.from({ length: daysToShow }, (_, i) => getDateKeyOffset(- (daysToShow - 1 - i)));

    // Map sessions to dates
    const sessionMap = sessions.reduce((acc, session) => {
        acc[session.date] = (acc[session.date] || 0) + session.totalSeconds;
        return acc;
    }, {} as Record<string, number>);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            width: '100%',
        }}>
            <div style={{
                display: 'flex',
                gap: 5,
                width: '100%',
                justifyContent: 'center'
            }}>
                {dates.map((date) => {
                    const seconds = sessionMap[date] || 0;
                    let bgColor = '#F0F3F5'; // empty (gray-100)
                    if (seconds > 0) {
                        if (seconds < 300) bgColor = '#D4F0E7'; // light (< 5 min)
                        else if (seconds < 600) bgColor = '#2BBAA0'; // medium (5-10 min)
                        else bgColor = '#1D8675'; // heavy (> 10 min)
                    }

                    return (
                        <div
                            key={date}
                            style={{
                                width: 14,
                                height: 14,
                                borderRadius: 4,
                                backgroundColor: bgColor,
                                flexShrink: 0,
                                opacity: date === getDateKeyOffset(0) && seconds === 0 ? 0.3 : 1
                            }}
                            title={`${date}: ${Math.floor(seconds / 60)} min`}
                        />
                    );
                })}
            </div>
        </div>
    );
};
