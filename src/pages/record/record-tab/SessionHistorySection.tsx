import React from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import type { SessionRecord } from '../../../lib/db';
import { getSessionCompletedExerciseTotal } from '../../../lib/sessionRecords';
import { formatDate } from '../recordUtils';

interface SessionHistorySectionProps {
    loading: boolean;
    sessions: SessionRecord[];
    groupedEntries: [string, SessionRecord[]][];
}

export const SessionHistorySection: React.FC<SessionHistorySectionProps> = ({
    loading,
    sessions,
    groupedEntries,
}) => {
    if (loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 40,
                color: '#B2BEC3',
                fontFamily: "'Noto Sans JP', sans-serif",
                fontSize: 14,
            }}>
                よみこみ中...
            </div>
        );
    }

    if (sessions.length === 0) {
        return (
            <motion.div
                className="card"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                style={{
                    textAlign: 'center',
                    padding: '40px 24px',
                }}
            >
                <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ fontSize: 48, display: 'block', marginBottom: 16 }}
                >
                    🌱
                </motion.div>
                <h3 style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 18,
                    fontWeight: 700,
                    color: '#2D3436',
                    marginBottom: 12,
                }}>
                    最初のきろくを作ろう！
                </h3>
                <p style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 14,
                    color: '#8395A7',
                    lineHeight: 1.6,
                }}>
                    下の まんなかの みどりの丸ボタンから ストレッチを始めると<br />
                    ここに草（きろく）が生えていきます。<br />
                    まずは1日目、いってみよう！
                </p>
            </motion.div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {groupedEntries.map(([date, dayRecords], index) => (
                <motion.div
                    key={date}
                    className="card card-sm"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                >
                    <div style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#2BBAA0',
                        marginBottom: 8,
                    }}>
                        {formatDate(date)}
                    </div>
                    {dayRecords.map((record) => (
                        <div
                            key={record.id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '6px 0',
                                borderTop: '1px solid rgba(0,0,0,0.04)',
                            }}
                        >
                            <Clock size={14} color="#B2BEC3" />
                            <span style={{
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 13,
                                color: '#2D3436',
                                flex: 1,
                            }}>
                                {getSessionCompletedExerciseTotal(record)}種目 · {Math.floor(record.totalSeconds / 60)}分{record.totalSeconds % 60}秒
                            </span>
                            <span style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: 11,
                                color: '#B2BEC3',
                            }}>
                                {new Date(record.startedAt).toLocaleTimeString('ja-JP', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </span>
                        </div>
                    ))}
                </motion.div>
            ))}
        </div>
    );
};


