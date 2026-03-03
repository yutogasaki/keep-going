import React from 'react';
import { Loader2, Pencil, Trash2 } from 'lucide-react';
import { getTodayKey } from '../../../lib/db';
import { CLASS_EMOJI, EXERCISES } from '../../../data/exercises';
import type { Challenge } from '../../../lib/challenges';

interface ChallengeListProps {
    loading: boolean;
    challenges: Challenge[];
    onEdit: (challenge: Challenge) => void;
    onDelete: (challengeId: string) => void;
}

export const ChallengeList: React.FC<ChallengeListProps> = ({
    loading,
    challenges,
    onEdit,
    onDelete,
}) => {
    const today = getTodayKey();

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: 48, color: '#8395A7' }}>
                <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
                <p style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: 14, margin: '12px 0 0' }}>
                    読み込み中...
                </p>
            </div>
        );
    }

    if (challenges.length === 0) {
        return (
            <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                <p style={{ fontFamily: "'Noto Sans JP', sans-serif", fontSize: 14, color: '#8395A7', margin: 0 }}>
                    チャレンジがありません
                </p>
            </div>
        );
    }

    return (
        <>
            {challenges.map((challenge) => {
                const exercise = EXERCISES.find((item) => item.id === challenge.exerciseId);
                const isActive = challenge.startDate <= today && challenge.endDate >= today;
                const isPast = challenge.endDate < today;

                return (
                    <div key={challenge.id} className="card" style={{
                        padding: '14px 16px',
                        opacity: isPast ? 0.5 : 1,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 22 }}>{exercise?.emoji ?? '🎯'}</span>
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 14,
                                    fontWeight: 700,
                                    color: '#2D3436',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    flexWrap: 'wrap',
                                }}>
                                    {challenge.title}
                                    {isActive && (
                                        <span style={{
                                            fontSize: 10,
                                            padding: '2px 6px',
                                            borderRadius: 6,
                                            background: '#E8F8F0',
                                            color: '#2BBAA0',
                                            fontWeight: 700,
                                        }}>
                                            開催中
                                        </span>
                                    )}
                                </div>
                                <div style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 11,
                                    color: '#8395A7',
                                    marginTop: 2,
                                }}>
                                    {exercise?.name ?? challenge.exerciseId}を{challenge.targetCount}回 ・
                                    {challenge.startDate.slice(5).replace('-', '/')} 〜 {challenge.endDate.slice(5).replace('-', '/')}
                                </div>
                                <div style={{
                                    display: 'flex',
                                    gap: 4,
                                    flexWrap: 'wrap',
                                    marginTop: 4,
                                }}>
                                    {challenge.classLevels.length === 0 ? (
                                        <span style={{
                                            fontSize: 10,
                                            padding: '1px 6px',
                                            borderRadius: 6,
                                            background: '#F0F3F5',
                                            color: '#8395A7',
                                            fontFamily: "'Noto Sans JP', sans-serif",
                                            fontWeight: 600,
                                        }}>
                                            全クラス
                                        </span>
                                    ) : (
                                        challenge.classLevels.map((classLevel) => (
                                            <span key={classLevel} style={{
                                                fontSize: 10,
                                                padding: '1px 6px',
                                                borderRadius: 6,
                                                background: '#F3EEFF',
                                                color: '#6C5CE7',
                                                fontFamily: "'Noto Sans JP', sans-serif",
                                                fontWeight: 600,
                                            }}>
                                                {CLASS_EMOJI[classLevel] ?? ''}{classLevel}
                                            </span>
                                        ))
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => onEdit(challenge)}
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 8,
                                    border: 'none',
                                    background: '#F0F3F5',
                                    color: '#8395A7',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    flexShrink: 0,
                                }}
                            >
                                <Pencil size={14} />
                            </button>
                            <button
                                onClick={() => onDelete(challenge.id)}
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 8,
                                    border: 'none',
                                    background: '#FFF0F0',
                                    color: '#E17055',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    flexShrink: 0,
                                }}
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                );
            })}
        </>
    );
};
