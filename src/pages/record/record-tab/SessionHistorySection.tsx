import React from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import type { RecordSessionHistoryDay } from '../recordHistorySummary';
import { formatDate } from '../recordUtils';

interface SessionHistorySectionProps {
    loading: boolean;
    sessionsCount: number;
    historyDays: RecordSessionHistoryDay[];
}

function formatDuration(totalSeconds: number): string {
    return `${Math.floor(totalSeconds / 60)}分${totalSeconds % 60}秒`;
}

function DetailChips({
    label,
    items,
    accentColor,
    background,
}: {
    label: string;
    items: { id: string; name: string; emoji: string; count: number }[];
    accentColor: string;
    background: string;
}) {
    if (items.length === 0) {
        return null;
    }

    return (
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <span style={{
                fontFamily: "'Noto Sans JP', sans-serif",
                fontSize: 11,
                fontWeight: 700,
                color: accentColor,
                minWidth: 44,
                paddingTop: 4,
            }}>
                {label}
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, flex: 1 }}>
                {items.map((item) => (
                    <span
                        key={`${label}-${item.id}`}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '4px 8px',
                            borderRadius: 999,
                            background,
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 11,
                            color: '#2D3436',
                        }}
                    >
                        <span>{item.emoji}</span>
                        <span>{item.name}</span>
                        <strong style={{ color: accentColor }}>{item.count}回</strong>
                    </span>
                ))}
            </div>
        </div>
    );
}

export const SessionHistorySection: React.FC<SessionHistorySectionProps> = ({
    loading,
    sessionsCount,
    historyDays,
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

    if (sessionsCount === 0) {
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
            {historyDays.map((day, index) => (
                <motion.div
                    key={day.date}
                    className="card card-sm"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                >
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        marginBottom: 8,
                    }}>
                        <div style={{
                            fontFamily: "'Outfit', sans-serif",
                            fontSize: 13,
                            fontWeight: 600,
                            color: '#2BBAA0',
                        }}>
                            {formatDate(day.date)}
                        </div>
                        <div style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 11,
                            color: '#8395A7',
                        }}>
                            {day.sessionCount}回 · {day.completedTotal}種目 · おやすみ{day.skippedTotal}回 · {formatDuration(day.totalSeconds)}
                        </div>
                    </div>
                    {day.items.map((record) => (
                        <div
                            key={record.id}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 8,
                                padding: '10px 0',
                                borderTop: '1px solid rgba(0,0,0,0.04)',
                            }}
                        >
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                flexWrap: 'wrap',
                            }}>
                                <Clock size={14} color="#B2BEC3" />
                                <span style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 13,
                                    color: '#2D3436',
                                    flex: 1,
                                }}>
                                    {record.completedTotal}種目 · {formatDuration(record.totalSeconds)}
                                </span>
                                <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    padding: '4px 8px',
                                    borderRadius: 999,
                                    background: 'rgba(116, 185, 255, 0.14)',
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: '#2D6EA3',
                                }}>
                                    {record.sessionLabel}
                                </span>
                                {record.skippedTotal > 0 ? (
                                    <span style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        padding: '4px 8px',
                                        borderRadius: 999,
                                        background: 'rgba(225, 112, 85, 0.10)',
                                        fontFamily: "'Noto Sans JP', sans-serif",
                                        fontSize: 11,
                                        fontWeight: 700,
                                        color: '#E17055',
                                    }}>
                                        おやすみ {record.skippedTotal}回
                                    </span>
                                ) : null}
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

                            {record.userNames.length > 0 && (
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                    <span style={{
                                        fontFamily: "'Noto Sans JP', sans-serif",
                                        fontSize: 11,
                                        fontWeight: 700,
                                        color: '#7F8C8D',
                                        minWidth: 44,
                                    }}>
                                        だれ
                                    </span>
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                        {record.userNames.map((name) => (
                                            <span
                                                key={`${record.id}-${name}`}
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    padding: '4px 8px',
                                                    borderRadius: 999,
                                                    background: 'rgba(43, 186, 160, 0.10)',
                                                    fontFamily: "'Noto Sans JP', sans-serif",
                                                    fontSize: 11,
                                                    color: '#2B7A6E',
                                                }}
                                            >
                                                {name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <DetailChips
                                label="やった"
                                items={record.completedExercises}
                                accentColor="#2BBAA0"
                                background="rgba(43, 186, 160, 0.10)"
                            />

                            <DetailChips
                                label="おやすみ"
                                items={record.skippedExercises}
                                accentColor="#E17055"
                                background="rgba(225, 112, 85, 0.10)"
                            />
                        </div>
                    ))}
                </motion.div>
            ))}
        </div>
    );
};
