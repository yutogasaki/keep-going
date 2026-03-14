import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getExercisesByClass } from '../data/exercises';
import { getPresetsForClass, type MenuGroup } from '../data/menuGroups';
import type { CustomExercise } from '../lib/db';
import {
    PERSONAL_CHALLENGE_ACCOUNT_REQUIRED_ERROR,
    createPersonalChallenge,
    fetchMyActivePersonalChallengeCount,
    getRemainingPersonalChallengeSlots,
    isPersonalChallengeLimitReached,
    PERSONAL_CHALLENGE_ACTIVE_LIMIT,
    PERSONAL_CHALLENGE_LIMIT_REACHED_ERROR,
    updatePersonalChallengeMeta,
    updatePersonalChallengeSetup,
} from '../lib/personalChallenges';
import { getAccountId } from '../lib/sync/authState';
import type { TeacherExercise, TeacherMenu } from '../lib/teacherContent';
import { COLOR, FONT, FONT_SIZE, RADIUS, SPACE } from '../lib/styles';
import type { PersonalChallengeProgressItem } from '../pages/home/hooks/usePersonalChallenges';
import type { UserProfileStore } from '../store/useAppStore';
import { Modal } from './Modal';
import {
    buildDefaultPersonalChallengeTitle,
    findPersonalChallengePreset,
    PERSONAL_CHALLENGE_PRESET_OPTIONS,
    type PersonalChallengePresetId,
} from './personal-challenge/shared';

interface PersonalChallengeFormSheetProps {
    open: boolean;
    member: UserProfileStore | null;
    teacherExercises: TeacherExercise[];
    teacherMenus: TeacherMenu[];
    customExercises?: CustomExercise[];
    customMenus?: MenuGroup[];
    initialItem?: PersonalChallengeProgressItem | null;
    initialSeed?: PersonalChallengeCreateSeed | null;
    onClose: () => void;
    onSaved: () => void;
}

type ChallengeType = 'exercise' | 'menu';
type ExerciseSource = 'standard' | 'teacher' | 'custom';
type MenuSource = 'preset' | 'teacher' | 'custom';

export interface PersonalChallengeCreateSeed {
    challengeType: ChallengeType;
    exerciseSource?: ExerciseSource;
    menuSource?: MenuSource;
    exerciseId?: string | null;
    targetMenuId?: string | null;
    title?: string;
    description?: string | null;
    iconEmoji?: string | null;
}

export const PersonalChallengeFormSheet: React.FC<PersonalChallengeFormSheetProps> = ({
    open,
    member,
    teacherExercises,
    teacherMenus,
    customExercises = [],
    customMenus = [],
    initialItem = null,
    initialSeed = null,
    onClose,
    onSaved,
}) => {
    const isEditing = Boolean(initialItem);
    const canEditSetup = initialItem?.canEditSetup ?? true;
    const standardExercises = useMemo(
        () => (member ? getExercisesByClass(member.classLevel) : []),
        [member],
    );
    const presetMenus = useMemo(
        () => (member ? getPresetsForClass(member.classLevel) : []),
        [member],
    );

    const [challengeType, setChallengeType] = useState<ChallengeType>('exercise');
    const [exerciseSource, setExerciseSource] = useState<ExerciseSource>('standard');
    const [menuSource, setMenuSource] = useState<MenuSource>('preset');
    const [exerciseId, setExerciseId] = useState('');
    const [targetMenuId, setTargetMenuId] = useState('');
    const [presetId, setPresetId] = useState<PersonalChallengePresetId>('week');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [iconEmoji, setIconEmoji] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [activeChallengeCount, setActiveChallengeCount] = useState(0);
    const [activeCountLoading, setActiveCountLoading] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    const resolveFirstExerciseId = useCallback((source: ExerciseSource): string => {
        if (source === 'teacher') {
            return teacherExercises[0]?.id ?? customExercises[0]?.id ?? standardExercises[0]?.id ?? '';
        }
        if (source === 'custom') {
            return customExercises[0]?.id ?? teacherExercises[0]?.id ?? standardExercises[0]?.id ?? '';
        }
        return standardExercises[0]?.id ?? teacherExercises[0]?.id ?? customExercises[0]?.id ?? '';
    }, [customExercises, standardExercises, teacherExercises]);

    const resolveFirstMenuId = useCallback((source: MenuSource): string => {
        if (source === 'teacher') {
            return teacherMenus[0]?.id ?? customMenus[0]?.id ?? presetMenus[0]?.id ?? '';
        }
        if (source === 'custom') {
            return customMenus[0]?.id ?? teacherMenus[0]?.id ?? presetMenus[0]?.id ?? '';
        }
        return presetMenus[0]?.id ?? teacherMenus[0]?.id ?? customMenus[0]?.id ?? '';
    }, [customMenus, presetMenus, teacherMenus]);

    useEffect(() => {
        if (!open || !member) {
            return;
        }

        if (initialItem) {
            const { challenge } = initialItem;
            const nextExerciseSource: ExerciseSource = teacherExercises.some((item) => item.id === challenge.exerciseId)
                ? 'teacher'
                : customExercises.some((item) => item.id === challenge.exerciseId)
                    ? 'custom'
                    : 'standard';
            const nextMenuSource: MenuSource = challenge.menuSource === 'teacher'
                ? 'teacher'
                : challenge.menuSource === 'custom'
                    ? 'custom'
                    : 'preset';
            const nextPreset = findPersonalChallengePreset(challenge) ?? 'week';

            setChallengeType(challenge.challengeType === 'menu' ? 'menu' : 'exercise');
            setExerciseSource(nextExerciseSource);
            setMenuSource(nextMenuSource);
            setExerciseId(challenge.exerciseId ?? resolveFirstExerciseId(nextExerciseSource));
            setTargetMenuId(challenge.targetMenuId ?? resolveFirstMenuId(nextMenuSource));
            setPresetId(nextPreset);
            setTitle(challenge.title);
            setDescription(challenge.description ?? '');
            setIconEmoji(challenge.iconEmoji ?? '');
            return;
        }

        if (initialSeed) {
            const nextChallengeType = initialSeed.challengeType;
            const nextExerciseSource = initialSeed.exerciseSource ?? 'standard';
            const nextMenuSource = initialSeed.menuSource ?? 'preset';

            setChallengeType(nextChallengeType);
            setExerciseSource(nextExerciseSource);
            setMenuSource(nextMenuSource);
            setExerciseId(initialSeed.exerciseId ?? resolveFirstExerciseId(nextExerciseSource));
            setTargetMenuId(initialSeed.targetMenuId ?? resolveFirstMenuId(nextMenuSource));
            setPresetId('week');
            setTitle(initialSeed.title ?? '');
            setDescription(initialSeed.description ?? '');
            setIconEmoji(initialSeed.iconEmoji ?? '');
            return;
        }

        setChallengeType('exercise');
        setExerciseSource('standard');
        setMenuSource('preset');
        setExerciseId(resolveFirstExerciseId('standard'));
        setTargetMenuId(resolveFirstMenuId('preset'));
        setPresetId('week');
        setTitle('');
        setDescription('');
        setIconEmoji('');
    }, [
        customExercises,
        customMenus,
        initialItem,
        initialSeed,
        member,
        open,
        presetMenus,
        resolveFirstExerciseId,
        resolveFirstMenuId,
        standardExercises,
        teacherExercises,
        teacherMenus,
    ]);

    useEffect(() => {
        if (!open || !member || isEditing) {
            setActiveChallengeCount(0);
            setActiveCountLoading(false);
            return;
        }

        let cancelled = false;
        setActiveCountLoading(true);
        setSaveError(null);

        fetchMyActivePersonalChallengeCount(member.id)
            .then((count) => {
                if (!cancelled) {
                    setActiveChallengeCount(count);
                }
            })
            .catch((error) => {
                console.warn('[personalChallenges] active count load failed:', error);
                if (!cancelled) {
                    setActiveChallengeCount(0);
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setActiveCountLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [isEditing, member, open]);

    const selectedPreset = PERSONAL_CHALLENGE_PRESET_OPTIONS.find((option) => option.id === presetId)
        ?? PERSONAL_CHALLENGE_PRESET_OPTIONS[0];
    const selectedTargetMissing = challengeType === 'exercise'
        ? !exerciseId
        : !targetMenuId;
    const hasChallengeAccount = Boolean(getAccountId());
    const limitReached = !isEditing && isPersonalChallengeLimitReached(activeChallengeCount);
    const remainingSlots = getRemainingPersonalChallengeSlots(activeChallengeCount);
    const submitDisabled = !member
        || !hasChallengeAccount
        || submitting
        || selectedTargetMissing
        || (!isEditing && (activeCountLoading || limitReached));

    const handleSubmit = async () => {
        if (!member || submitDisabled) {
            return;
        }

        const trimmedTitle = title.trim();
        const trimmedDescription = description.trim();
        const nextTitle = trimmedTitle || buildDefaultPersonalChallengeTitle({
            challengeType,
            exerciseId: challengeType === 'exercise' ? exerciseId : null,
            targetMenuId: challengeType === 'menu' ? targetMenuId : null,
            menuSource: challengeType === 'menu' ? menuSource : null,
            windowDays: selectedPreset.windowDays,
            requiredDays: selectedPreset.requiredDays,
            teacherExercises,
            teacherMenus,
            customExercises,
            customMenus,
        });

        setSubmitting(true);
        setSaveError(null);
        try {
            if (initialItem) {
                if (canEditSetup) {
                    await updatePersonalChallengeSetup(initialItem.challenge, {
                        challengeType,
                        exerciseId: challengeType === 'exercise' ? exerciseId : null,
                        targetMenuId: challengeType === 'menu' ? targetMenuId : null,
                        menuSource: challengeType === 'menu' ? menuSource : null,
                        targetCount: selectedPreset.requiredDays,
                        dailyCap: 1,
                        countUnit: challengeType === 'menu' ? 'menu_completion' : 'exercise_completion',
                        goalType: 'active_day',
                        windowDays: selectedPreset.windowDays,
                        requiredDays: selectedPreset.requiredDays,
                        effectiveStartDate: initialItem.challenge.effectiveStartDate,
                    });
                }

                await updatePersonalChallengeMeta(initialItem.challenge.id, {
                    title: nextTitle,
                    summary: null,
                    description: trimmedDescription || null,
                    iconEmoji: iconEmoji.trim() || null,
                });
            } else {
                await createPersonalChallenge({
                    memberId: member.id,
                    title: nextTitle,
                    summary: null,
                    description: trimmedDescription || null,
                    challengeType,
                    exerciseId: challengeType === 'exercise' ? exerciseId : null,
                    targetMenuId: challengeType === 'menu' ? targetMenuId : null,
                    menuSource: challengeType === 'menu' ? menuSource : null,
                    targetCount: selectedPreset.requiredDays,
                    dailyCap: 1,
                    countUnit: challengeType === 'menu' ? 'menu_completion' : 'exercise_completion',
                    goalType: 'active_day',
                    windowDays: selectedPreset.windowDays,
                    requiredDays: selectedPreset.requiredDays,
                    iconEmoji: iconEmoji.trim() || null,
                });
            }

            onSaved();
            onClose();
        } catch (error) {
            console.warn('[personalChallenges] save failed:', error);
            if (error instanceof Error && error.message === PERSONAL_CHALLENGE_LIMIT_REACHED_ERROR) {
                setSaveError(`いまは${PERSONAL_CHALLENGE_ACTIVE_LIMIT}つ進めているよ。どれか終わったら新しくつくれるよ。`);
                setActiveChallengeCount(PERSONAL_CHALLENGE_ACTIVE_LIMIT);
            } else if (error instanceof Error && error.message === PERSONAL_CHALLENGE_ACCOUNT_REQUIRED_ERROR) {
                setSaveError('じぶんチャレンジは アカウントをつないでから使えるよ。');
            } else {
                setSaveError('ほぞんに失敗したよ。もう一度ためしてみてね。');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            align="bottom"
            maxWidth={440}
            ariaLabel={isEditing ? 'じぶんチャレンジを編集' : 'じぶんチャレンジをつくる'}
            contentStyle={{
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
                padding: 20,
                maxHeight: '88vh',
                overflowY: 'auto',
            }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE.lg }}>
                <div>
                    <div style={titleStyle}>{isEditing ? 'じぶんチャレンジをへんしゅう' : 'じぶんチャレンジをつくる'}</div>
                    <div style={subtitleStyle}>
                        {member ? `${member.name} の ちいさな目標をつくれるよ。` : 'チャレンジをつくるよ。'}
                    </div>
                </div>

                <Section title="だれのチャレンジ？">
                    <PreviewRow icon="🙂" title={member?.name ?? 'ユーザー'} description="保存すると すぐにはじまるよ" />
                </Section>

                <Section title="何をやる？">
                    <SegmentedRow>
                        {([
                            { id: 'exercise', label: '種目' },
                            { id: 'menu', label: 'メニュー' },
                        ] as const).map((option) => (
                            <SegmentButton
                                key={option.id}
                                active={challengeType === option.id}
                                disabled={isEditing && !canEditSetup}
                                onClick={() => setChallengeType(option.id)}
                            >
                                {option.label}
                            </SegmentButton>
                        ))}
                    </SegmentedRow>

                    {challengeType === 'exercise' ? (
                        <>
                            <SegmentedRow>
                                {([
                                    { id: 'standard', label: 'いつもの種目' },
                                    { id: 'teacher', label: '先生の種目' },
                                    { id: 'custom', label: 'もらった種目' },
                                ] as const).map((option) => (
                                    <SegmentButton
                                        key={option.id}
                                        active={exerciseSource === option.id}
                                        disabled={
                                            (isEditing && !canEditSetup)
                                            || (option.id === 'teacher' && teacherExercises.length === 0)
                                            || (option.id === 'custom' && customExercises.length === 0)
                                        }
                                        onClick={() => {
                                            setExerciseSource(option.id);
                                            if (option.id === 'teacher' && teacherExercises[0]) {
                                                setExerciseId((current) => (
                                                    teacherExercises.some((exercise) => exercise.id === current)
                                                        ? current
                                                        : teacherExercises[0].id
                                                ));
                                            }
                                            if (option.id === 'standard' && standardExercises[0]) {
                                                setExerciseId((current) => (
                                                    standardExercises.some((exercise) => exercise.id === current)
                                                        ? current
                                                        : standardExercises[0].id
                                                ));
                                            }
                                            if (option.id === 'custom' && customExercises[0]) {
                                                setExerciseId((current) => (
                                                    customExercises.some((exercise) => exercise.id === current)
                                                        ? current
                                                        : customExercises[0].id
                                                ));
                                            }
                                        }}
                                    >
                                        {option.label}
                                    </SegmentButton>
                                ))}
                            </SegmentedRow>
                            <select
                                value={exerciseId}
                                disabled={isEditing && !canEditSetup}
                                onChange={(event) => setExerciseId(event.target.value)}
                                style={inputStyle}
                            >
                                {(exerciseSource === 'teacher'
                                    ? teacherExercises
                                    : exerciseSource === 'custom'
                                        ? customExercises
                                        : standardExercises).map((exercise) => (
                                    <option key={exercise.id} value={exercise.id}>
                                        {exercise.emoji} {exercise.name}
                                    </option>
                                ))}
                            </select>
                        </>
                    ) : (
                        <>
                            <SegmentedRow>
                                {([
                                    { id: 'preset', label: 'いつものメニュー' },
                                    { id: 'teacher', label: '先生のメニュー' },
                                    { id: 'custom', label: 'もらったメニュー' },
                                ] as const).map((option) => (
                                    <SegmentButton
                                        key={option.id}
                                        active={menuSource === option.id}
                                        disabled={
                                            (isEditing && !canEditSetup)
                                            || (option.id === 'teacher' && teacherMenus.length === 0)
                                            || (option.id === 'custom' && customMenus.length === 0)
                                        }
                                        onClick={() => {
                                            setMenuSource(option.id);
                                            if (option.id === 'teacher' && teacherMenus[0]) {
                                                setTargetMenuId((current) => (
                                                    teacherMenus.some((menu) => menu.id === current)
                                                        ? current
                                                        : teacherMenus[0].id
                                                ));
                                            }
                                            if (option.id === 'preset' && presetMenus[0]) {
                                                setTargetMenuId((current) => (
                                                    presetMenus.some((menu) => menu.id === current)
                                                        ? current
                                                        : presetMenus[0].id
                                                ));
                                            }
                                            if (option.id === 'custom' && customMenus[0]) {
                                                setTargetMenuId((current) => (
                                                    customMenus.some((menu) => menu.id === current)
                                                        ? current
                                                        : customMenus[0].id
                                                ));
                                            }
                                        }}
                                    >
                                        {option.label}
                                    </SegmentButton>
                                ))}
                            </SegmentedRow>
                            <select
                                value={targetMenuId}
                                disabled={isEditing && !canEditSetup}
                                onChange={(event) => setTargetMenuId(event.target.value)}
                                style={inputStyle}
                            >
                                {(menuSource === 'teacher'
                                    ? teacherMenus
                                    : menuSource === 'custom'
                                        ? customMenus
                                        : presetMenus).map((menu) => (
                                    <option key={menu.id} value={menu.id}>
                                        {menu.emoji} {menu.name}
                                    </option>
                                ))}
                            </select>
                        </>
                    )}
                    {isEditing && !canEditSetup ? (
                        <HintText>もう進みはじめているので、対象や日数は変えずにタイトルだけ直せます。</HintText>
                    ) : null}
                </Section>

                <Section title="どれくらいやる？">
                    <div style={presetGridStyle}>
                        {PERSONAL_CHALLENGE_PRESET_OPTIONS.map((option) => (
                            <button
                                key={option.id}
                                type="button"
                                disabled={isEditing && !canEditSetup}
                                onClick={() => setPresetId(option.id)}
                                style={{
                                    ...optionButtonStyle,
                                    ...(presetId === option.id ? selectedOptionButtonStyle : {}),
                                    ...((isEditing && !canEditSetup) ? disabledOptionButtonStyle : {}),
                                }}
                            >
                                <div style={optionTitleStyle}>{option.label}</div>
                                <div style={optionDescriptionStyle}>{option.description}</div>
                            </button>
                        ))}
                    </div>
                </Section>

                <Section title="見た目">
                    <label style={fieldStyle}>
                        <span style={fieldLabelStyle}>タイトル</span>
                        <input
                            type="text"
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            placeholder="空のままなら自動でつくるよ"
                            style={inputStyle}
                        />
                    </label>
                    <label style={fieldStyle}>
                        <span style={fieldLabelStyle}>ひとこと</span>
                        <textarea
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            placeholder="がんばることを一言だけ"
                            style={{ ...inputStyle, minHeight: 92, resize: 'vertical' }}
                        />
                    </label>
                    <label style={fieldStyle}>
                        <span style={fieldLabelStyle}>カードの絵文字</span>
                        <input
                            type="text"
                            value={iconEmoji}
                            onChange={(event) => setIconEmoji(event.target.value)}
                            placeholder="空なら種目やメニューの絵文字を使うよ"
                            style={inputStyle}
                        />
                    </label>
                </Section>

                <div style={summaryCardStyle}>
                    <div style={{ fontWeight: 800, color: COLOR.dark }}>ほし 1こ</div>
                    <div style={{ marginTop: 4 }}>
                        {!hasChallengeAccount
                            ? 'じぶんチャレンジは アカウントをつなぐと保存して続きから使えるよ。'
                            : isEditing
                            ? '軽い目標だけど、1日では終わらないように 7日以上から選べるよ。'
                            : activeCountLoading
                                ? 'いま進めているチャレンジ数を確認しているよ。'
                                : limitReached
                                    ? `いまは${PERSONAL_CHALLENGE_ACTIVE_LIMIT}つ進めているよ。どれか終わったら新しくつくれるよ。`
                                    : remainingSlots === PERSONAL_CHALLENGE_ACTIVE_LIMIT
                                        ? `軽い目標だけど、1日では終わらないように 7日以上から選べるよ。${PERSONAL_CHALLENGE_ACTIVE_LIMIT}つまで進められるよ。`
                                        : `いま進められるのは あと${remainingSlots}つ。${PERSONAL_CHALLENGE_ACTIVE_LIMIT}つまで同時に進められるよ。`}
                    </div>
                </div>

                {saveError ? (
                    <div style={errorCardStyle}>
                        {saveError}
                    </div>
                ) : null}

                <div style={{ display: 'grid', gap: SPACE.sm }}>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitDisabled}
                        style={{
                            ...primaryButtonStyle,
                            ...(submitDisabled ? disabledButtonStyle : {}),
                        }}
                    >
                        {submitting
                            ? 'ほぞん中...'
                            : isEditing
                                ? 'この内容でなおす'
                                : 'このチャレンジではじめる'}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        style={secondaryButtonStyle}
                    >
                        とじる
                    </button>
                </div>
            </div>
        </Modal>
    );
};

function Section({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section style={sectionStyle}>
            <div style={sectionTitleStyle}>{title}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE.sm }}>
                {children}
            </div>
        </section>
    );
}

function PreviewRow({
    icon,
    title,
    description,
}: {
    icon: string;
    title: string;
    description: string;
}) {
    return (
        <div style={previewRowStyle}>
            <div style={previewIconStyle}>{icon}</div>
            <div>
                <div style={{ fontFamily: FONT.body, fontSize: FONT_SIZE.sm, fontWeight: 800, color: COLOR.dark }}>{title}</div>
                <div style={{ fontFamily: FONT.body, fontSize: FONT_SIZE.xs + 1, color: COLOR.muted }}>{description}</div>
            </div>
        </div>
    );
}

function SegmentedRow({ children }: { children: React.ReactNode }) {
    return <div style={{ display: 'flex', gap: SPACE.sm, flexWrap: 'wrap' }}>{children}</div>;
}

function SegmentButton({
    active,
    disabled,
    onClick,
    children,
}: {
    active: boolean;
    disabled?: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            style={{
                ...segmentedButtonStyle,
                ...(active ? selectedSegmentButtonStyle : {}),
                ...(disabled ? disabledButtonStyle : {}),
            }}
        >
            {children}
        </button>
    );
}

function HintText({ children }: { children: React.ReactNode }) {
    return (
        <div style={{ fontFamily: FONT.body, fontSize: FONT_SIZE.xs + 1, color: COLOR.muted, lineHeight: 1.6 }}>
            {children}
        </div>
    );
}

const titleStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.xl,
    fontWeight: 800,
    color: COLOR.dark,
};

const subtitleStyle: React.CSSProperties = {
    marginTop: 6,
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.sm,
    color: COLOR.muted,
    lineHeight: 1.7,
};

const sectionStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: SPACE.sm,
    padding: '16px',
    borderRadius: RADIUS.xl,
    background: 'rgba(255,255,255,0.74)',
    border: '1px solid rgba(0,0,0,0.05)',
};

const sectionTitleStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.sm,
    fontWeight: 800,
    color: COLOR.dark,
};

const fieldStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
};

const fieldLabelStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.sm,
    fontWeight: 700,
    color: COLOR.dark,
};

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    borderRadius: RADIUS.lg,
    border: '1px solid rgba(0,0,0,0.08)',
    background: COLOR.white,
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.md,
    outline: 'none',
    boxSizing: 'border-box',
};

const previewRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: SPACE.md,
    padding: '12px 14px',
    borderRadius: RADIUS.lg,
    background: 'rgba(43,186,160,0.08)',
};

const previewIconStyle: React.CSSProperties = {
    width: 42,
    height: 42,
    borderRadius: 14,
    display: 'grid',
    placeItems: 'center',
    background: 'rgba(255,255,255,0.85)',
    fontSize: 22,
};

const segmentedButtonStyle: React.CSSProperties = {
    padding: '9px 12px',
    borderRadius: RADIUS.full,
    border: '1px solid rgba(0,0,0,0.08)',
    background: COLOR.white,
    cursor: 'pointer',
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.sm,
    fontWeight: 700,
    color: COLOR.text,
};

const selectedSegmentButtonStyle: React.CSSProperties = {
    border: '2px solid #2BBAA0',
    background: '#E8F8F0',
    color: COLOR.primaryDark,
};

const presetGridStyle: React.CSSProperties = {
    display: 'grid',
    gap: SPACE.sm,
};

const optionButtonStyle: React.CSSProperties = {
    padding: '12px 14px',
    borderRadius: RADIUS.lg,
    border: '1px solid rgba(0,0,0,0.08)',
    background: COLOR.white,
    cursor: 'pointer',
    textAlign: 'left',
};

const selectedOptionButtonStyle: React.CSSProperties = {
    border: '2px solid #2BBAA0',
    background: '#E8F8F0',
};

const optionTitleStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.sm,
    fontWeight: 800,
    color: COLOR.dark,
};

const optionDescriptionStyle: React.CSSProperties = {
    marginTop: 4,
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.xs + 1,
    color: COLOR.muted,
    lineHeight: 1.5,
};

const summaryCardStyle: React.CSSProperties = {
    padding: SPACE.md,
    borderRadius: RADIUS.lg,
    background: 'rgba(255, 243, 204, 0.56)',
    border: '1px solid rgba(255, 184, 0, 0.18)',
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.sm,
    color: COLOR.text,
};

const errorCardStyle: React.CSSProperties = {
    padding: SPACE.md,
    borderRadius: RADIUS.lg,
    background: 'rgba(255, 237, 235, 0.86)',
    border: '1px solid rgba(225, 112, 85, 0.24)',
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.sm,
    color: '#C0392B',
    lineHeight: 1.7,
    fontWeight: 700,
};

const primaryButtonStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 0',
    borderRadius: RADIUS.lg,
    border: 'none',
    background: 'linear-gradient(135deg, #2BBAA0, #0984E3)',
    color: COLOR.white,
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.md,
    fontWeight: 700,
    cursor: 'pointer',
};

const secondaryButtonStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 0',
    borderRadius: RADIUS.lg,
    border: '1px solid rgba(0,0,0,0.08)',
    background: 'rgba(255,255,255,0.7)',
    color: COLOR.text,
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.md,
    fontWeight: 700,
    cursor: 'pointer',
};

const disabledButtonStyle: React.CSSProperties = {
    opacity: 0.5,
    cursor: 'not-allowed',
};

const disabledOptionButtonStyle: React.CSSProperties = {
    opacity: 0.55,
    cursor: 'not-allowed',
};
