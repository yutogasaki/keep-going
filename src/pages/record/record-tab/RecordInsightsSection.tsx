import React from 'react';
import { motion } from 'framer-motion';
import { BookOpenText, Clock3, Users } from 'lucide-react';
import type { RecordInsightSummary } from '../recordHistorySummary';

interface RecordInsightsSectionProps {
    loading: boolean;
    sessionsCount: number;
    insightSummary: RecordInsightSummary;
}

function formatMinutes(totalSeconds: number): string {
    const minutes = Math.max(1, Math.floor(totalSeconds / 60));
    return `${minutes}分`;
}

export const RecordInsightsSection: React.FC<RecordInsightsSectionProps> = ({
    loading,
    sessionsCount,
    insightSummary,
}) => {
    if (loading || sessionsCount === 0) {
        return null;
    }

    return (
        <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15, ease: 'easeOut' }}
        >
            <div style={{
                fontFamily: "'Noto Sans JP', sans-serif",
                fontSize: 13,
                fontWeight: 700,
                color: '#8395A7',
                marginBottom: 10,
                letterSpacing: 1,
            }}>
                いま見ている記録
            </div>

            <div className="card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{
                        width: 42,
                        height: 42,
                        borderRadius: 14,
                        background: 'rgba(43, 186, 160, 0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}>
                        <BookOpenText size={20} color="#2BBAA0" />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 16,
                            fontWeight: 700,
                            color: '#2D3436',
                            lineHeight: 1.4,
                        }}>
                            {insightSummary.focusLabel}
                        </div>
                        <p style={{
                            margin: 0,
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 13,
                            color: '#52606D',
                            lineHeight: 1.7,
                        }}>
                            {insightSummary.summaryLine}
                        </p>
                        {insightSummary.detailLine ? (
                            <p style={{
                                margin: 0,
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 12,
                                color: '#8395A7',
                                lineHeight: 1.6,
                            }}>
                                {insightSummary.detailLine}
                            </p>
                        ) : null}
                    </div>
                </div>

                {insightSummary.participants.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 12,
                            fontWeight: 700,
                            color: '#7F8C8D',
                        }}>
                            <Users size={14} />
                            参加した人
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {insightSummary.participants.map((participant) => (
                                <div
                                    key={participant.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: 12,
                                        padding: '10px 12px',
                                        borderRadius: 14,
                                        background: 'rgba(248, 250, 252, 0.95)',
                                    }}
                                >
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                        <span style={{
                                            fontFamily: "'Noto Sans JP', sans-serif",
                                            fontSize: 13,
                                            fontWeight: 700,
                                            color: '#2D3436',
                                        }}>
                                            {participant.name}
                                        </span>
                                        <span style={{
                                            fontFamily: "'Noto Sans JP', sans-serif",
                                            fontSize: 11,
                                            color: '#8395A7',
                                        }}>
                                            {participant.sessionCount}回 参加
                                        </span>
                                    </div>

                                    <span style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 4,
                                        padding: '6px 10px',
                                        borderRadius: 999,
                                        background: 'rgba(43, 186, 160, 0.10)',
                                        color: '#2B7A6E',
                                        fontFamily: "'Noto Sans JP', sans-serif",
                                        fontSize: 11,
                                        fontWeight: 700,
                                    }}>
                                        <Clock3 size={12} />
                                        {formatMinutes(participant.totalSeconds)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null}
            </div>
        </motion.section>
    );
};
