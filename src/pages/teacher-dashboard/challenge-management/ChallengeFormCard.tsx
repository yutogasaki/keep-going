import React from 'react';
import { CLASS_LEVELS, EXERCISES } from '../../../data/exercises';
import type { ChallengeFormValues } from './types';

interface ChallengeFormCardProps {
    values: ChallengeFormValues;
    submitting: boolean;
    isEditing: boolean;
    onChange: (patch: Partial<ChallengeFormValues>) => void;
    onToggleClassLevel: (level: string) => void;
    onRandomReward: () => void;
    onCancel: () => void;
    onSubmit: () => void;
}

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 10,
    border: '1px solid #E0E0E0',
    fontFamily: "'Noto Sans JP', sans-serif",
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
    fontFamily: "'Noto Sans JP', sans-serif",
    fontSize: 12,
    fontWeight: 700,
    color: '#636E72',
    marginBottom: 4,
};

export const ChallengeFormCard: React.FC<ChallengeFormCardProps> = ({
    values,
    submitting,
    isEditing,
    onChange,
    onToggleClassLevel,
    onRandomReward,
    onCancel,
    onSubmit,
}) => {
    return (
        <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ ...labelStyle }}>タイトル</div>
            <input
                value={values.title}
                onChange={(event) => onChange({ title: event.target.value })}
                placeholder="例: 前後開脚チャレンジ月間"
                style={inputStyle}
            />

            <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                    <div style={labelStyle}>エクササイズ</div>
                    <select
                        value={values.exerciseId}
                        onChange={(event) => onChange({ exerciseId: event.target.value })}
                        style={{ ...inputStyle, appearance: 'auto' }}
                    >
                        {EXERCISES.map((exercise) => (
                            <option key={exercise.id} value={exercise.id}>{exercise.emoji} {exercise.name}</option>
                        ))}
                    </select>
                </div>
                <div style={{ width: 80 }}>
                    <div style={labelStyle}>目標回数</div>
                    <input
                        type="number"
                        value={values.targetCount}
                        onChange={(event) => onChange({ targetCount: Number(event.target.value) })}
                        min={1}
                        style={inputStyle}
                    />
                </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                    <div style={labelStyle}>開始日</div>
                    <input
                        type="date"
                        value={values.startDate}
                        onChange={(event) => onChange({ startDate: event.target.value })}
                        style={inputStyle}
                    />
                </div>
                <div style={{ flex: 1 }}>
                    <div style={labelStyle}>終了日</div>
                    <input
                        type="date"
                        value={values.endDate}
                        onChange={(event) => onChange({ endDate: event.target.value })}
                        style={inputStyle}
                    />
                </div>
            </div>

            <div>
                <div style={labelStyle}>対象クラス（未選択＝全クラス）</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {CLASS_LEVELS.map((classLevel) => {
                        const selected = values.classLevels.includes(classLevel.id);
                        return (
                            <button
                                key={classLevel.id}
                                onClick={() => onToggleClassLevel(classLevel.id)}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: 20,
                                    border: selected ? '2px solid #2BBAA0' : '1px solid #E0E0E0',
                                    background: selected ? '#E8F8F0' : '#FFF',
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: selected ? '#2BBAA0' : '#8395A7',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                }}
                            >
                                {classLevel.emoji} {classLevel.id}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div>
                <div style={{ ...labelStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>バッジメダル（報酬）</span>
                    <button
                        onClick={onRandomReward}
                        style={{
                            fontSize: 11,
                            color: '#2BBAA0',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontWeight: 700,
                            padding: '2px 6px',
                        }}
                    >
                        🔀 ランダム
                    </button>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {Array.from({ length: 12 }, (_, index) => (
                        <button
                            key={index}
                            onClick={() => onChange({ rewardType: index })}
                            style={{
                                width: 48,
                                height: 48,
                                borderRadius: 12,
                                border: values.rewardType === index ? '2px solid #FFB800' : '1px solid #E0E0E0',
                                background: values.rewardType === index ? '#FFF9E6' : '#FFF',
                                padding: 2,
                                cursor: 'pointer',
                                boxShadow: values.rewardType === index ? '0 0 0 2px rgba(255,184,0,0.2)' : 'none',
                            }}
                        >
                            <img
                                src={`/medal/${index}.png`}
                                alt={`medal ${index}`}
                                style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                            />
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button
                    onClick={onCancel}
                    style={{
                        flex: 1,
                        padding: '10px 0',
                        borderRadius: 10,
                        border: '1px solid #E0E0E0',
                        background: '#FFF',
                        color: '#8395A7',
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: 'pointer',
                    }}
                >
                    キャンセル
                </button>
                <button
                    onClick={onSubmit}
                    disabled={!values.title.trim() || submitting}
                    style={{
                        flex: 1,
                        padding: '10px 0',
                        borderRadius: 10,
                        border: 'none',
                        background: values.title.trim() ? '#2BBAA0' : '#B2BEC3',
                        color: '#FFF',
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: values.title.trim() ? 'pointer' : 'default',
                    }}
                >
                    {submitting ? (isEditing ? '保存中...' : '作成中...') : (isEditing ? '保存' : '作成')}
                </button>
            </div>
        </div>
    );
};
