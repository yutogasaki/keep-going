import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    EditorSection,
    EditorShell,
    editorLabelStyle,
    getEditorSubmitButtonStyle,
} from '../../components/editor/EditorShell';
import {
    EXERCISE_PLACEMENTS,
    getExercisePlacementLabel,
    type ExercisePlacement,
} from '../../data/exercisePlacement';
import { saveCustomExercise, type CustomExercise } from '../../lib/db';
import { publishExercise } from '../../lib/publicExercises';
import { getAccountId } from '../../lib/sync';
import { PublishToggleCard } from './create-group/PublishToggleCard';
import { COLOR, FONT, FONT_SIZE, inputField } from '../../lib/styles';

interface SingleExerciseEditorProps {
    initial?: CustomExercise | null;
    currentUserId?: string;
    authorName?: string;
    submitLabel?: string;
    onSaveExercise?: (exercise: CustomExercise) => Promise<void> | void;
    onSave: () => void;
    onCancel: () => void;
}

export const SingleExerciseEditor: React.FC<SingleExerciseEditorProps> = ({
    initial,
    currentUserId,
    authorName,
    submitLabel,
    onSaveExercise,
    onSave,
    onCancel,
}) => {
    const [name, setName] = useState(initial?.name || '');
    const [emoji, setEmoji] = useState(initial?.emoji || '🌸');
    const [sec, setSec] = useState<number>(initial?.sec || 30);
    const [placement, setPlacement] = useState<ExercisePlacement>(initial?.placement || 'stretch');
    const [hasSplit, setHasSplit] = useState<boolean>(initial?.hasSplit || false);
    const [description, setDescription] = useState(initial?.description || '');
    const [isPublic, setIsPublic] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isLoggedIn = !!getAccountId();
    const isEditing = !!initial;

    const EMOJI_OPTIONS = [
        '🌸', '🎀', '🩰', '🦢', '🌟', '✨', '👑', '💎',
        '💖', '🦋', '🐱', '🐰', '🐻', '🌈', '🍎', '🍓',
        '🧘', '🏋️', '💪', '🦵', '🦶', '🙇', '💃', '🏃'
    ];

    const handleSave = async () => {
        if (!name.trim() || saving) return;
        setSaving(true);
        setError(null);
        try {
            const ex: CustomExercise = {
                id: initial?.id || `custom-ex-${Date.now()}`,
                name: name.trim(),
                emoji,
                sec: sec as number,
                placement,
                hasSplit,
                description: description.trim() || undefined,
                creatorId: currentUserId,
            };
            if (onSaveExercise) {
                await onSaveExercise(ex);
            } else {
                await saveCustomExercise(ex);
            }

            if (!onSaveExercise && isPublic && !isEditing && isLoggedIn && authorName) {
                try {
                    await publishExercise(ex, authorName);
                } catch (e) {
                    console.warn('[SingleExerciseEditor] publish failed:', e);
                }
            }

            onSave();
        } catch (e) {
            console.warn('[SingleExerciseEditor] save failed:', e);
            setError('ほぞんに失敗しました。もう一度お試しください。');
        } finally {
            setSaving(false);
        }
    };

    return (
        <EditorShell
            title={initial ? 'じぶん種目をへんしゅう' : 'じぶん種目をつくる'}
            onBack={onCancel}
        >
            <EditorSection label="アイコン">
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {EMOJI_OPTIONS.map(e => (
                        <motion.button
                            key={e}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setEmoji(e)}
                            style={{
                                width: 44,
                                height: 44,
                                borderRadius: 14,
                                border: emoji === e ? '2px solid #2BBAA0' : '2px solid transparent',
                                background: emoji === e ? 'rgba(43,186,160,0.08)' : '#F8F9FA',
                                cursor: 'pointer',
                                fontSize: 22,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s',
                            }}
                        >
                            {e}
                        </motion.button>
                    ))}
                </div>
            </EditorSection>

            <EditorSection label="なまえ">
                <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="新しい種目の名前"
                    style={{
                        ...inputField,
                        fontSize: FONT_SIZE.lg,
                        color: COLOR.dark,
                        transition: 'all 0.2s',
                    }}
                />
            </EditorSection>

            <EditorSection label="せつめい">
                <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="種目の説明（公開時に表示されます）"
                    rows={3}
                    style={{
                        ...inputField,
                        fontSize: FONT_SIZE.md,
                        color: COLOR.dark,
                        transition: 'all 0.2s',
                        resize: 'vertical',
                    }}
                />
            </EditorSection>

            <EditorSection label="時間（秒）">
                <div style={{ display: 'flex', gap: 10 }}>
                    {[15, 30, 60, 120].map(s => (
                        <motion.button
                            key={s}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSec(s)}
                            style={{
                                flex: 1,
                                padding: '12px 0',
                                borderRadius: 12,
                                border: sec === s ? '2px solid #2BBAA0' : '2px solid transparent',
                                background: sec === s ? 'rgba(43,186,160,0.08)' : '#F8F9FA',
                                cursor: 'pointer',
                                fontFamily: "'Outfit', sans-serif",
                                fontSize: 16,
                                fontWeight: 700,
                                color: sec === s ? '#2BBAA0' : '#8395A7',
                                transition: 'all 0.2s',
                            }}
                        >
                            {s}秒
                        </motion.button>
                    ))}
                </div>
            </EditorSection>

            <EditorSection label="どこに入れる？">
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {EXERCISE_PLACEMENTS.map((option) => {
                        const isActive = placement === option;
                        return (
                            <button
                                key={option}
                                type="button"
                                onClick={() => setPlacement(option)}
                                style={{
                                    padding: '10px 14px',
                                    borderRadius: 12,
                                    border: isActive ? '2px solid #2BBAA0' : '1px solid rgba(0,0,0,0.08)',
                                    background: isActive ? 'rgba(43,186,160,0.08)' : '#FFF',
                                    color: isActive ? '#2BBAA0' : COLOR.dark,
                                    fontFamily: FONT.body,
                                    fontSize: 13,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                }}
                            >
                                {getExercisePlacementLabel(option)}
                            </button>
                        );
                    })}
                </div>
            </EditorSection>

            <EditorSection>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <label style={{
                            ...editorLabelStyle,
                            fontSize: 15,
                            marginBottom: 4,
                        }}>
                            切替あり
                        </label>
                        <span style={{
                            fontFamily: FONT.body,
                            fontSize: 12,
                            color: '#8395A7',
                        }}>
                            半分の時間で「反対」「切り替え」の合図が鳴ります
                        </span>
                    </div>
                    <button
                        onClick={() => setHasSplit(!hasSplit)}
                        style={{
                            width: 52,
                            height: 32,
                            borderRadius: 16,
                            background: hasSplit ? '#2BBAA0' : '#E2E8F0',
                            border: 'none',
                            position: 'relative',
                            cursor: 'pointer',
                            transition: 'background 0.3s',
                            boxShadow: hasSplit ? 'inset 0 2px 4px rgba(0,0,0,0.1)' : 'inset 0 2px 4px rgba(0,0,0,0.05)',
                        }}
                    >
                        <motion.div
                            animate={{ x: hasSplit ? 22 : 2 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            style={{
                                width: 28,
                                height: 28,
                                background: 'white',
                                borderRadius: '50%',
                                position: 'absolute',
                                top: 2,
                                left: 0,
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            }}
                        />
                    </button>
                </div>
            </EditorSection>

            {isLoggedIn && !isEditing && (
                <PublishToggleCard
                    isPublic={isPublic}
                    onToggle={() => setIsPublic((prev) => !prev)}
                    subtitle="他の人がこの種目をもらえるようになります"
                />
            )}

            <div style={{ flex: 1 }} />

            {error && (
                <div style={{
                    padding: '12px 16px',
                    borderRadius: 12,
                    background: 'rgba(255,71,87,0.08)',
                    color: COLOR.danger,
                    fontFamily: FONT.body,
                    fontSize: FONT_SIZE.sm,
                }}>
                    {error}
                </div>
            )}

            <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSave}
                disabled={!name.trim() || saving}
                style={getEditorSubmitButtonStyle(Boolean(name.trim()) && !saving)}
            >
                {saving ? 'ほぞん中...' : submitLabel ?? (initial ? 'ほぞん' : 'つくる！')}
            </motion.button>
        </EditorShell>
    );
};
