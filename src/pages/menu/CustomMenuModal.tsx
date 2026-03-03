import React from 'react';
import { createPortal } from 'react-dom';
import { Lock, X } from 'lucide-react';
import { ExerciseIcon } from '../../components/ExerciseIcon';
import { EXERCISES } from '../../data/exercises';
import type { CustomExercise } from '../../lib/db';

interface CustomMenuModalProps {
    show: boolean;
    isTogetherMode: boolean;
    dailyTargetMinutes: number;
    requiredExercises: string[];
    excludedExercises: string[];
    customExercises: CustomExercise[];
    teacherExcludedExerciseIds?: Set<string>;
    teacherRequiredExerciseIds?: Set<string>;
    teacherHiddenExerciseIds?: Set<string>;
    onClose: () => void;
    onSetDailyTargetMinutes: (mins: number) => void;
    onSetExcludedExercises: (ids: string[]) => void;
    onSetRequiredExercises: (ids: string[]) => void;
}

export const CustomMenuModal: React.FC<CustomMenuModalProps> = ({
    show,
    isTogetherMode,
    dailyTargetMinutes,
    requiredExercises,
    excludedExercises,
    customExercises,
    teacherExcludedExerciseIds: _teacherExcludedExerciseIds,
    teacherRequiredExerciseIds,
    teacherHiddenExerciseIds,
    onClose,
    onSetDailyTargetMinutes,
    onSetExcludedExercises,
    onSetRequiredExercises,
}) => {
    if (!show) return null;

    return createPortal(
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgb(248, 249, 250)',
            zIndex: 200,
            display: 'flex',
            flexDirection: 'column',
        }}>
            <div style={{
                padding: '24px 24px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'white',
                borderBottom: '1px solid rgba(0,0,0,0.06)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
            }}>
                <div>
                    <h2 style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 18,
                        fontWeight: 700,
                        color: '#2D3436',
                        margin: 0,
                        marginBottom: 4,
                    }}>
                        おまかせの設定
                    </h2>
                    <p style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 12,
                        color: '#8395A7',
                        margin: 0,
                    }}>
                        毎日のルーティン内容を調整します
                    </p>
                </div>
                <button
                    onClick={onClose}
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        border: 'none',
                        background: '#F1F2F6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'background 0.2s ease',
                    }}
                >
                    <X size={20} color="#2D3436" />
                </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px', position: 'relative' }}>
                {isTogetherMode && (
                    <div style={{
                        background: '#FFF3E0',
                        border: '1px solid #FFE0B2',
                        borderRadius: 12,
                        padding: '12px 16px',
                        marginBottom: 20,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                    }}>
                        <span style={{ fontSize: 20 }}>👩‍👧‍👦</span>
                        <div style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 13,
                            color: '#E65100',
                            lineHeight: 1.5,
                        }}>
                            「みんなで！」モード中は全員のおまかせ設定が合算されます。<br />
                            <strong>個人の設定を変更するには、ホーム画面で設定したい人を選んでから開いてね。</strong>
                        </div>
                    </div>
                )}

                <div className="card" style={{ marginBottom: 24, padding: '24px 20px', opacity: isTogetherMode ? 0.6 : 1, pointerEvents: isTogetherMode ? 'none' : 'auto' }}>
                    <div style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 15,
                        fontWeight: 700,
                        color: '#2D3436',
                        marginBottom: 16,
                    }}>
                        1日の目標じかん
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        {[5, 10, 15, 20, 30].map(mins => (
                            <button
                                key={mins}
                                onClick={() => onSetDailyTargetMinutes(mins)}
                                style={{
                                    flex: 1,
                                    minWidth: '28%',
                                    padding: '14px 0',
                                    borderRadius: 14,
                                    border: dailyTargetMinutes === mins ? '2px solid #2BBAA0' : '2px solid transparent',
                                    background: dailyTargetMinutes === mins ? 'rgba(43, 186, 160, 0.08)' : '#F8F9FA',
                                    color: dailyTargetMinutes === mins ? '#2BBAA0' : '#8395A7',
                                    fontFamily: "'Outfit', sans-serif",
                                    fontSize: 16,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    boxShadow: dailyTargetMinutes !== mins ? '0 2px 4px rgba(0,0,0,0.02)' : 'none',
                                }}
                            >
                                {mins}分
                            </button>
                        ))}
                    </div>
                </div>

                <div className="card" style={{ overflow: 'hidden', opacity: isTogetherMode ? 0.6 : 1, pointerEvents: isTogetherMode ? 'none' : 'auto' }}>
                    <div style={{
                        padding: '20px 20px 12px',
                        borderBottom: '1px solid rgba(0,0,0,0.06)',
                    }}>
                        <div style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 15,
                            fontWeight: 700,
                            color: '#2D3436',
                            marginBottom: 4,
                        }}>
                            種目のカスタマイズ
                        </div>
                        <div style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 12,
                            color: '#8395A7',
                        }}>
                            ★ 必須 / ⚪ おまかせ / 🔴 除外
                        </div>
                    </div>

                    <div>
                        {[...EXERCISES, ...customExercises]
                            .filter(exercise => !teacherHiddenExerciseIds?.has(exercise.id))
                            .map(exercise => {
                            const isTeacherRequired = teacherRequiredExerciseIds?.has(exercise.id);
                            const isRequired = isTeacherRequired || requiredExercises.includes(exercise.id);
                            const isExcluded = !isRequired && excludedExercises.includes(exercise.id);

                            const handleCycle = () => {
                                if (isTeacherRequired) return; // Teacher-locked, no cycling
                                if (isRequired) {
                                    onSetRequiredExercises(requiredExercises.filter(id => id !== exercise.id));
                                } else if (!isExcluded) {
                                    onSetExcludedExercises([...excludedExercises, exercise.id]);
                                } else {
                                    onSetExcludedExercises(excludedExercises.filter(id => id !== exercise.id));
                                    onSetRequiredExercises([...requiredExercises, exercise.id]);
                                }
                            };

                            return (
                                <div key={exercise.id} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '16px 20px',
                                    borderBottom: '1px solid rgba(0,0,0,0.04)',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <ExerciseIcon id={exercise.id} emoji={exercise.emoji} size={24} color="#2D3436" />
                                        <div>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 6,
                                            }}>
                                                <div style={{
                                                    fontFamily: "'Noto Sans JP', sans-serif",
                                                    fontSize: 14,
                                                    fontWeight: 600,
                                                    color: isExcluded ? '#B2BEC3' : '#2D3436',
                                                }}>
                                                    {exercise.name}
                                                </div>
                                                {'creatorId' in exercise && (
                                                    <span style={{
                                                        fontFamily: "'Noto Sans JP', sans-serif",
                                                        fontSize: 9,
                                                        fontWeight: 700,
                                                        color: '#2BBAA0',
                                                        background: 'rgba(43, 186, 160, 0.1)',
                                                        padding: '1px 4px',
                                                        borderRadius: 6,
                                                        display: 'inline-block',
                                                        verticalAlign: 'middle',
                                                    }}>
                                                        じぶん種目
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{
                                                fontFamily: "'Outfit', sans-serif",
                                                fontSize: 11,
                                                color: '#8395A7',
                                            }}>
                                                {exercise.sec}s • {'phase' in exercise ? exercise.phase : 'main'}
                                            </div>
                                        </div>
                                    </div>

                                    {isTeacherRequired ? (
                                        <div style={{
                                            minWidth: 70,
                                            padding: '8px 12px',
                                            borderRadius: 999,
                                            background: '#E8F8F0',
                                            fontFamily: "'Noto Sans JP', sans-serif",
                                            fontSize: 12,
                                            fontWeight: 700,
                                            color: '#2BBAA0',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 4,
                                        }}>
                                            <Lock size={10} />
                                            ★ 必須
                                        </div>
                                    ) : (
                                        <button
                                            onClick={handleCycle}
                                            style={{
                                                minWidth: 70,
                                                padding: '8px 12px',
                                                borderRadius: 999,
                                                border: 'none',
                                                fontFamily: "'Noto Sans JP', sans-serif",
                                                fontSize: 12,
                                                fontWeight: 700,
                                                cursor: 'pointer',
                                                background: isRequired ? '#E8F8F0' : isExcluded ? '#FFE4E1' : '#F8F9FA',
                                                color: isRequired ? '#2BBAA0' : isExcluded ? '#E17055' : '#8395A7',
                                                transition: 'all 0.2s ease',
                                            }}
                                        >
                                            {isRequired ? '★ 必須' : isExcluded ? '🔴 除外' : '⚪ おまかせ'}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>,
        document.body,
    );
};
