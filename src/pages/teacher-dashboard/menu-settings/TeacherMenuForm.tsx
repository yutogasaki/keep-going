import React, { useState } from 'react';
import { CLASS_LEVELS, EXERCISES } from '../../../data/exercises';
import { ExerciseIcon } from '../../../components/ExerciseIcon';
import type { TeacherMenu } from '../../../lib/teacherContent';
import type { TeacherExercise } from '../../../lib/teacherContent';

interface TeacherMenuFormProps {
    initial?: TeacherMenu | null;
    teacherExercises: TeacherExercise[];
    onSave: (data: {
        name: string;
        emoji: string;
        description: string;
        exerciseIds: string[];
        classLevels: string[];
    }) => void;
    onCancel: () => void;
    submitting: boolean;
}

const EMOJI_OPTIONS = ['🌸', '🎀', '🩰', '🦢', '🌟', '✨', '💪', '🦵', '🏋️', '💃', '⭐', '🌈', '🍎', '📋'];

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

export const TeacherMenuForm: React.FC<TeacherMenuFormProps> = ({
    initial,
    teacherExercises,
    onSave,
    onCancel,
    submitting,
}) => {
    const [name, setName] = useState(initial?.name ?? '');
    const [emoji, setEmoji] = useState(initial?.emoji ?? '📋');
    const [description, setDescription] = useState(initial?.description ?? '');
    const [exerciseIds, setExerciseIds] = useState<string[]>(initial?.exerciseIds ?? []);
    const [classLevels, setClassLevels] = useState<string[]>(initial?.classLevels ?? []);

    const toggleClassLevel = (level: string) => {
        setClassLevels(prev =>
            prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]
        );
    };

    const toggleExercise = (id: string) => {
        setExerciseIds(prev =>
            prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
        );
    };

    const handleSubmit = () => {
        if (!name.trim() || exerciseIds.length === 0) return;
        onSave({ name: name.trim(), emoji, description: description.trim(), exerciseIds, classLevels });
    };

    // All available exercises: built-in + teacher-created
    const allExercises = [
        ...EXERCISES.map(e => ({ id: e.id, name: e.name, emoji: e.emoji, isTeacher: false })),
        ...teacherExercises.map(e => ({ id: e.id, name: e.name, emoji: e.emoji, isTeacher: true })),
    ];

    return (
        <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={labelStyle}>アイコン</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {EMOJI_OPTIONS.map(e => (
                    <button
                        key={e}
                        onClick={() => setEmoji(e)}
                        style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            border: emoji === e ? '2px solid #2BBAA0' : '2px solid transparent',
                            background: emoji === e ? 'rgba(43,186,160,0.08)' : '#F8F9FA',
                            cursor: 'pointer',
                            fontSize: 18,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {e}
                    </button>
                ))}
            </div>

            <div style={labelStyle}>メニュー名</div>
            <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="例: バレエ前ウォームアップ"
                style={inputStyle}
            />

            <div style={labelStyle}>せつめい</div>
            <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="メニューの説明やコメント"
                rows={2}
                style={{ ...inputStyle, resize: 'none' }}
            />

            <div>
                <div style={{ ...labelStyle, marginBottom: 8 }}>
                    種目を選択（{exerciseIds.length}個）
                </div>
                <div style={{
                    maxHeight: 200,
                    overflowY: 'auto',
                    border: '1px solid #E0E0E0',
                    borderRadius: 10,
                }}>
                    {allExercises.map(ex => {
                        const selected = exerciseIds.includes(ex.id);
                        return (
                            <button
                                key={ex.id}
                                onClick={() => toggleExercise(ex.id)}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    padding: '10px 12px',
                                    border: 'none',
                                    borderBottom: '1px solid rgba(0,0,0,0.04)',
                                    background: selected ? 'rgba(43,186,160,0.06)' : '#FFF',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                }}
                            >
                                <div style={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: 6,
                                    border: selected ? '2px solid #2BBAA0' : '2px solid #DFE6E9',
                                    background: selected ? '#2BBAA0' : '#FFF',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    color: '#FFF',
                                    fontSize: 12,
                                    fontWeight: 700,
                                }}>
                                    {selected ? '✓' : ''}
                                </div>
                                <ExerciseIcon id={ex.id} emoji={ex.emoji} size={18} color="#2D3436" />
                                <span style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 13,
                                    fontWeight: 600,
                                    color: '#2D3436',
                                }}>
                                    {ex.name}
                                </span>
                                {ex.isTeacher && (
                                    <span style={{
                                        fontSize: 9,
                                        fontWeight: 700,
                                        color: '#0984E3',
                                        background: 'rgba(9,132,227,0.1)',
                                        padding: '1px 4px',
                                        borderRadius: 4,
                                    }}>
                                        先生
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div>
                <div style={labelStyle}>対象クラス（未選択＝全クラス）</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {CLASS_LEVELS.map(cl => {
                        const selected = classLevels.includes(cl.id);
                        return (
                            <button
                                key={cl.id}
                                onClick={() => toggleClassLevel(cl.id)}
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
                                {cl.emoji} {cl.id}
                            </button>
                        );
                    })}
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
                    onClick={handleSubmit}
                    disabled={!name.trim() || exerciseIds.length === 0 || submitting}
                    style={{
                        flex: 1,
                        padding: '10px 0',
                        borderRadius: 10,
                        border: 'none',
                        background: name.trim() && exerciseIds.length > 0 ? '#2BBAA0' : '#B2BEC3',
                        color: '#FFF',
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: name.trim() && exerciseIds.length > 0 ? 'pointer' : 'default',
                    }}
                >
                    {submitting ? '保存中...' : initial ? '保存' : '作成'}
                </button>
            </div>
        </div>
    );
};
