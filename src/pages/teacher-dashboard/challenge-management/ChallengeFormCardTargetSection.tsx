import { PRESET_GROUPS } from '../../../data/menuGroups';
import { COLOR, FONT, FONT_SIZE } from '../../../lib/styles';
import { applyDurationPreset } from './durationPresets';
import { fieldHintStyle, optionButtonBaseStyle, optionGridStyle } from './ChallengeFormCard.styles';
import { Field, Section } from './ChallengeFormCard.parts';
import { ChallengeFormCardTargetPicker } from './ChallengeFormCardTargetPicker';
import type { ChallengeFormValues } from './types';
import type { ChallengeFormState } from './useChallengeForm';

interface ChallengeFormCardTargetSectionProps {
    values: ChallengeFormValues;
    form: ChallengeFormState;
    onChange: (patch: Partial<ChallengeFormValues>) => void;
}

const selectedOptionStyle = {
    border: '2px solid #2BBAA0',
    background: '#E8F8F0',
} as const;

export function ChallengeFormCardTargetSection({ values, form, onChange }: ChallengeFormCardTargetSectionProps) {
    const { isDurationChallenge, sortedTeacherMenus } = form;

    return (
        <>
            <Section
                title="達成の形"
                description="期間で回数を数えるか、参加してから何日できたかを数えるかを選びます。"
            >
                <Field label="チャレンジ方式">
                    <div style={optionGridStyle}>
                        {(
                            [
                                {
                                    id: 'calendar',
                                    label: '期間でチャレンジ',
                                    description: '公開中の合計回数を数える、今までの先生チャレンジ',
                                },
                                {
                                    id: 'rolling',
                                    label: '毎日チャレンジ',
                                    description: '参加した日から数えて、できた日数を集める',
                                },
                            ] as const
                        ).map((option) => {
                            const selected = values.windowType === option.id;
                            return (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => {
                                        const nextWindowType = option.id;
                                        const nextGoalType: ChallengeFormValues['goalType'] = isDurationChallenge
                                            ? 'active_day'
                                            : nextWindowType === 'rolling'
                                              ? 'active_day'
                                              : 'total_count';
                                        const basePatch: Partial<ChallengeFormValues> =
                                            nextWindowType === 'calendar'
                                                ? {
                                                      windowType: 'calendar',
                                                      goalType: nextGoalType,
                                                      dailyCap: Math.max(1, values.dailyCap || 1),
                                                  }
                                                : {
                                                      windowType: 'rolling',
                                                      goalType: nextGoalType,
                                                      dailyCap: 1,
                                                  };

                                        if (values.durationPreset === 'custom') {
                                            onChange({
                                                ...basePatch,
                                                targetCount:
                                                    nextWindowType === 'rolling'
                                                        ? Math.max(1, values.requiredDays || 5)
                                                        : Math.max(1, values.targetCount || 5),
                                            });
                                            return;
                                        }

                                        onChange({
                                            ...basePatch,
                                            ...applyDurationPreset(
                                                {
                                                    durationPreset: values.durationPreset,
                                                    windowType: nextWindowType,
                                                    goalType: nextGoalType,
                                                    startDate: values.startDate,
                                                    windowDays: values.windowDays,
                                                    publishMode: values.publishMode,
                                                    publishStartDate: values.publishStartDate,
                                                    publishEndDate: values.publishEndDate,
                                                },
                                                values.durationPreset,
                                            ),
                                        });
                                    }}
                                    style={{
                                        ...optionButtonBaseStyle,
                                        ...(selected ? selectedOptionStyle : null),
                                    }}
                                >
                                    <span
                                        style={{
                                            fontFamily: FONT.body,
                                            fontSize: FONT_SIZE.sm,
                                            fontWeight: 800,
                                            color: COLOR.dark,
                                        }}
                                    >
                                        {option.label}
                                    </span>
                                    <span
                                        style={{
                                            fontFamily: FONT.body,
                                            fontSize: FONT_SIZE.xs + 1,
                                            color: COLOR.muted,
                                            lineHeight: 1.5,
                                        }}
                                    >
                                        {option.description}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </Field>

                {isDurationChallenge ? (
                    <div style={fieldHintStyle}>
                        時間チャレンジは、期間で数える形と、参加した人ごとに毎日数える形の両方を作れます。
                    </div>
                ) : null}
            </Section>

            <Section title="対象" description="何をカウントするチャレンジかを決めます。">
                <Field label="チャレンジの種類">
                    <div style={optionGridStyle}>
                        {(
                            [
                                { id: 'exercise', label: '種目チャレンジ', description: '1つの種目を回数で数える' },
                                { id: 'menu', label: 'メニューチャレンジ', description: '1つのメニュー完走を数える' },
                                {
                                    id: 'duration',
                                    label: '時間チャレンジ',
                                    description: 'その日の合計時間が足りた日数を数える',
                                },
                            ] as const
                        ).map((option) => {
                            const selected = values.challengeType === option.id;
                            return (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => {
                                        if (option.id === 'exercise') {
                                            onChange({ challengeType: 'exercise' });
                                            return;
                                        }

                                        if (option.id === 'duration') {
                                            onChange({
                                                challengeType: 'duration',
                                                goalType: 'active_day',
                                                dailyCap: 1,
                                                dailyMinimumMinutes: Math.max(1, values.dailyMinimumMinutes || 3),
                                                requiredDays: Math.max(1, values.requiredDays || 5),
                                                targetCount: Math.max(1, values.requiredDays || 5),
                                            });
                                            return;
                                        }

                                        onChange({
                                            challengeType: 'menu',
                                            targetMenuId:
                                                values.menuSource === 'teacher'
                                                    ? values.targetMenuId || sortedTeacherMenus[0]?.id || ''
                                                    : values.targetMenuId || PRESET_GROUPS[0]?.id || '',
                                        });
                                    }}
                                    style={{
                                        ...optionButtonBaseStyle,
                                        ...(selected ? selectedOptionStyle : null),
                                    }}
                                >
                                    <span
                                        style={{
                                            fontFamily: FONT.body,
                                            fontSize: FONT_SIZE.sm,
                                            fontWeight: 800,
                                            color: COLOR.dark,
                                        }}
                                    >
                                        {option.label}
                                    </span>
                                    <span
                                        style={{
                                            fontFamily: FONT.body,
                                            fontSize: FONT_SIZE.xs + 1,
                                            color: COLOR.muted,
                                            lineHeight: 1.5,
                                        }}
                                    >
                                        {option.description}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </Field>

                <ChallengeFormCardTargetPicker values={values} form={form} onChange={onChange} />
            </Section>
        </>
    );
}
