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
    inferPersonalChallengeExerciseSource,
    inferPersonalChallengeMenuSource,
    PERSONAL_CHALLENGE_PRESET_OPTIONS,
    type PersonalChallengeExerciseSource,
    type PersonalChallengeMenuSourceOption,
    type PersonalChallengePresetId,
} from './personal-challenge/shared';
import {
    AppearanceFields,
    ChallengeLimitSummary,
    DurationPresetGrid,
    HintText,
    inputStyle,
    PreviewRow,
    Section,
    SegmentButton,
    SegmentedRow,
} from './personal-challenge/FormParts';

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
type ExerciseSource = PersonalChallengeExerciseSource;
type MenuSource = PersonalChallengeMenuSourceOption;

export interface PersonalChallengeCreateSeed {
    challengeType: ChallengeType;
    presetId?: PersonalChallengePresetId;
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

    const getExerciseOptions = useCallback((source: ExerciseSource) => {
        if (source === 'teacher') {
            return teacherExercises;
        }
        if (source === 'custom') {
            return customExercises;
        }
        return standardExercises;
    }, [customExercises, standardExercises, teacherExercises]);

    const getMenuOptions = useCallback((source: MenuSource) => {
        if (source === 'teacher') {
            return teacherMenus;
        }
        if (source === 'custom') {
            return customMenus;
        }
        return presetMenus;
    }, [customMenus, presetMenus, teacherMenus]);

    const resolveFirstExerciseId = useCallback((source: ExerciseSource): string => {
        return getExerciseOptions(source)[0]?.id ?? '';
    }, [getExerciseOptions]);

    const resolveFirstMenuId = useCallback((source: MenuSource): string => {
        return getMenuOptions(source)[0]?.id ?? '';
    }, [getMenuOptions]);

    const hasExerciseOption = useCallback((source: ExerciseSource, id: string | null | undefined) => (
        Boolean(id) && getExerciseOptions(source).some((exercise) => exercise.id === id)
    ), [getExerciseOptions]);

    const hasMenuOption = useCallback((source: MenuSource, id: string | null | undefined) => (
        Boolean(id) && getMenuOptions(source).some((menu) => menu.id === id)
    ), [getMenuOptions]);

    useEffect(() => {
        if (!open || !member) {
            return;
        }

        if (initialItem) {
            const { challenge } = initialItem;
            const nextExerciseSource = inferPersonalChallengeExerciseSource(
                challenge.exerciseId,
                teacherExercises,
                customExercises,
            );
            const nextMenuSource = inferPersonalChallengeMenuSource(
                challenge.menuSource,
                challenge.targetMenuId,
                teacherMenus,
                customMenus,
            );
            const nextPreset = findPersonalChallengePreset(challenge) ?? 'week';

            setChallengeType(challenge.challengeType === 'menu' ? 'menu' : 'exercise');
            setExerciseSource(nextExerciseSource);
            setMenuSource(nextMenuSource);
            setExerciseId(hasExerciseOption(nextExerciseSource, challenge.exerciseId) ? challenge.exerciseId ?? '' : '');
            setTargetMenuId(hasMenuOption(nextMenuSource, challenge.targetMenuId) ? challenge.targetMenuId ?? '' : '');
            setPresetId(nextPreset);
            setTitle(challenge.title);
            setDescription(challenge.description ?? '');
            setIconEmoji(challenge.iconEmoji ?? '');
            return;
        }

        if (initialSeed) {
            const nextChallengeType = initialSeed.challengeType;
            const nextExerciseSource = initialSeed.exerciseSource
                ?? inferPersonalChallengeExerciseSource(initialSeed.exerciseId, teacherExercises, customExercises);
            const nextMenuSource = initialSeed.menuSource
                ?? inferPersonalChallengeMenuSource(null, initialSeed.targetMenuId, teacherMenus, customMenus);

            setChallengeType(nextChallengeType);
            setExerciseSource(nextExerciseSource);
            setMenuSource(nextMenuSource);
            setExerciseId(
                initialSeed.exerciseId === undefined
                    ? resolveFirstExerciseId(nextExerciseSource)
                    : (hasExerciseOption(nextExerciseSource, initialSeed.exerciseId) ? initialSeed.exerciseId ?? '' : ''),
            );
            setTargetMenuId(
                initialSeed.targetMenuId === undefined
                    ? resolveFirstMenuId(nextMenuSource)
                    : (hasMenuOption(nextMenuSource, initialSeed.targetMenuId) ? initialSeed.targetMenuId ?? '' : ''),
            );
            setPresetId(initialSeed.presetId ?? 'week');
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
        hasExerciseOption,
        hasMenuOption,
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
    const selectedExerciseOptions = useMemo(
        () => getExerciseOptions(exerciseSource),
        [exerciseSource, getExerciseOptions],
    );
    const selectedMenuOptions = useMemo(
        () => getMenuOptions(menuSource),
        [getMenuOptions, menuSource],
    );
    const selectedExerciseValid = exerciseId !== ''
        && selectedExerciseOptions.some((exercise) => exercise.id === exerciseId);
    const selectedMenuValid = targetMenuId !== ''
        && selectedMenuOptions.some((menu) => menu.id === targetMenuId);
    const selectedTargetMissing = challengeType === 'exercise'
        ? !selectedExerciseValid
        : !selectedMenuValid;
    const requiresValidTarget = !isEditing || canEditSetup;
    const hasChallengeAccount = Boolean(getAccountId());
    const limitReached = !isEditing && isPersonalChallengeLimitReached(activeChallengeCount);
    const remainingSlots = getRemainingPersonalChallengeSlots(activeChallengeCount);
    const submitDisabled = !member
        || !hasChallengeAccount
        || submitting
        || (requiresValidTarget && selectedTargetMissing)
        || (!isEditing && (activeCountLoading || limitReached));
    const missingTargetMessage = challengeType === 'exercise'
        ? '前に選んだ種目が見つからないよ。保存する前に、いま使う種目をえらび直してね。'
        : '前に選んだメニューが見つからないよ。保存する前に、いま使うメニューをえらび直してね。';

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
                                onClick={() => {
                                    setChallengeType(option.id);
                                    if (option.id === 'exercise' && !hasExerciseOption(exerciseSource, exerciseId)) {
                                        setExerciseId(resolveFirstExerciseId(exerciseSource));
                                    }
                                    if (option.id === 'menu' && !hasMenuOption(menuSource, targetMenuId)) {
                                        setTargetMenuId(resolveFirstMenuId(menuSource));
                                    }
                                }}
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
                                {!selectedExerciseValid ? (
                                    <option value="">
                                        {selectedExerciseOptions.length > 0
                                            ? '見つからないので、えらび直してね'
                                            : 'えらべる種目がまだないよ'}
                                    </option>
                                ) : null}
                                {selectedExerciseOptions.map((exercise) => (
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
                                {!selectedMenuValid ? (
                                    <option value="">
                                        {selectedMenuOptions.length > 0
                                            ? '見つからないので、えらび直してね'
                                            : 'えらべるメニューがまだないよ'}
                                    </option>
                                ) : null}
                                {selectedMenuOptions.map((menu) => (
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
                    {selectedTargetMissing ? (
                        <div style={errorCardStyle}>
                            {missingTargetMessage}
                        </div>
                    ) : null}
                </Section>

                <Section title="どれくらいやる？">
                    <DurationPresetGrid
                        presetId={presetId}
                        disabled={isEditing && !canEditSetup}
                        onSelectPreset={setPresetId}
                    />
                </Section>

                <Section title="見た目">
                    <AppearanceFields
                        title={title}
                        description={description}
                        iconEmoji={iconEmoji}
                        onTitleChange={setTitle}
                        onDescriptionChange={setDescription}
                        onIconEmojiChange={setIconEmoji}
                    />
                </Section>

                <ChallengeLimitSummary
                    hasChallengeAccount={hasChallengeAccount}
                    isEditing={isEditing}
                    activeCountLoading={activeCountLoading}
                    limitReached={limitReached}
                    remainingSlots={remainingSlots}
                    activeLimit={PERSONAL_CHALLENGE_ACTIVE_LIMIT}
                />

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
