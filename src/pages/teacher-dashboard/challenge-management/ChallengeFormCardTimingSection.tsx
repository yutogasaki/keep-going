import { COLOR, FONT, FONT_SIZE, SPACE } from '../../../lib/styles';
import { applyDurationPreset, CHALLENGE_DURATION_PRESET_OPTIONS } from './durationPresets';
import {
    inputStyle,
    metricGridStyle,
    optionButtonBaseStyle,
    optionGridStyle,
    previewIconStyle,
    segmentedButtonBaseStyle,
    segmentedRowStyle,
    selectionPreviewStyle,
} from './ChallengeFormCard.styles';
import { Field, Section, formatShortDateLabel } from './ChallengeFormCard.parts';
import type { ChallengeFormValues } from './types';
import type { ChallengeFormState } from './useChallengeForm';

interface ChallengeFormCardTimingSectionProps {
    values: ChallengeFormValues;
    form: ChallengeFormState;
    onChange: (patch: Partial<ChallengeFormValues>) => void;
}

const selectedOptionStyle = {
    border: '2px solid #2BBAA0',
    background: '#E8F8F0',
} as const;

export function ChallengeFormCardTimingSection({
    values,
    form,
    onChange,
}: ChallengeFormCardTimingSectionProps) {
    const {
        canStartPreviewToday,
        dateError,
        durationSummary,
        isCustomDuration,
        isShowingPreviewBeforeStart,
        publishDateError,
        todayKey,
    } = form;

    return (
        <>
            <Section
                title="期間"
                description={values.windowType === 'rolling'
                    ? 'まずはおすすめの期間を選ぶだけで作れます。細かく決めたいときだけカスタムを開きます。'
                    : 'まずはおすすめの期間を選ぶだけで作れます。開始日や終了日を細かく決めたいときだけカスタムを開きます。'}
            >
                <Field label="期間プリセット">
                    <div style={optionGridStyle}>
                        {CHALLENGE_DURATION_PRESET_OPTIONS.map((option) => {
                            const selected = values.durationPreset === option.id;
                            return (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => {
                                        if (option.id === 'custom') {
                                            onChange({ durationPreset: 'custom' });
                                            return;
                                        }

                                        onChange(applyDurationPreset({
                                            durationPreset: values.durationPreset,
                                            windowType: values.windowType,
                                            goalType: values.goalType,
                                            startDate: values.startDate,
                                            windowDays: values.windowDays,
                                            publishMode: values.publishMode,
                                            publishStartDate: values.publishStartDate,
                                            publishEndDate: values.publishEndDate,
                                        }, option.id));
                                    }}
                                    style={{
                                        ...optionButtonBaseStyle,
                                        ...(selected ? selectedOptionStyle : null),
                                    }}
                                >
                                    <span style={{
                                        fontFamily: FONT.body,
                                        fontSize: FONT_SIZE.sm,
                                        fontWeight: 800,
                                        color: COLOR.dark,
                                    }}>
                                        {option.label}
                                    </span>
                                    <span style={{
                                        fontFamily: FONT.body,
                                        fontSize: FONT_SIZE.xs + 1,
                                        color: COLOR.muted,
                                        lineHeight: 1.5,
                                    }}>
                                        {option.description}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </Field>

                {!isCustomDuration ? (
                    <div style={selectionPreviewStyle}>
                        <div style={previewIconStyle}>🗓️</div>
                        <div style={{ minWidth: 0 }}>
                            <div style={{
                                fontFamily: FONT.body,
                                fontSize: FONT_SIZE.sm,
                                fontWeight: 800,
                                color: COLOR.dark,
                            }}>
                                {values.durationPreset === 'week' ? '1週間' : values.durationPreset === 'two_weeks' ? '2週間' : '1ヶ月'}で作成
                            </div>
                            <div style={{
                                fontFamily: FONT.body,
                                fontSize: FONT_SIZE.xs + 1,
                                color: COLOR.muted,
                                lineHeight: 1.6,
                            }}>
                                {durationSummary}
                            </div>
                        </div>
                    </div>
                ) : null}

                {isCustomDuration ? (
                    <div style={metricGridStyle}>
                        {values.windowType === 'rolling' ? (
                            <Field label="チャレンジ日数">
                                <input
                                    type="number"
                                    min={1}
                                    value={values.windowDays}
                                    onChange={(event) => onChange({ windowDays: Number(event.target.value) })}
                                    style={inputStyle}
                                />
                            </Field>
                        ) : (
                            <>
                                <Field label="開始日">
                                    <input
                                        type="date"
                                        value={values.startDate}
                                        onChange={(event) => onChange({
                                            startDate: event.target.value,
                                            ...(values.publishMode === 'seasonal' ? { publishStartDate: event.target.value } : {}),
                                        })}
                                        style={inputStyle}
                                    />
                                </Field>
                                <Field label="終了日">
                                    <input
                                        type="date"
                                        value={values.endDate}
                                        onChange={(event) => onChange({
                                            endDate: event.target.value,
                                            ...(values.publishMode === 'seasonal' ? { publishEndDate: event.target.value } : {}),
                                        })}
                                        style={{
                                            ...inputStyle,
                                            ...(dateError ? { border: '1px solid #E17055' } : {}),
                                        }}
                                    />
                                </Field>
                            </>
                        )}
                    </div>
                ) : null}

                {dateError ? (
                    <div style={{
                        fontFamily: FONT.body,
                        fontSize: FONT_SIZE.xs + 1,
                        color: COLOR.danger,
                        fontWeight: 700,
                    }}>
                        {dateError}
                    </div>
                ) : null}
            </Section>

            <Section
                title="ホームでの見せ方"
                description="今だけ出すか、いつでも出しておくかを決めます。"
            >
                <Field label="掲載方法">
                    <div style={optionGridStyle}>
                        {([
                            { id: 'seasonal', label: '今だけ出す', description: '表示する期間を決める' },
                            { id: 'always_on', label: 'いつでも出す', description: '定番やはじめて用に置いておく' },
                        ] as const).map((option) => {
                            const selected = values.publishMode === option.id;
                            return (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => onChange({
                                        publishMode: option.id,
                                        ...(option.id === 'seasonal'
                                            ? {
                                                publishStartDate: values.publishStartDate || values.startDate,
                                                publishEndDate: values.publishEndDate || values.endDate,
                                            }
                                            : {}),
                                    })}
                                    style={{
                                        ...optionButtonBaseStyle,
                                        ...(selected ? selectedOptionStyle : null),
                                    }}
                                >
                                    <span style={{
                                        fontFamily: FONT.body,
                                        fontSize: FONT_SIZE.sm,
                                        fontWeight: 800,
                                        color: COLOR.dark,
                                    }}>
                                        {option.label}
                                    </span>
                                    <span style={{
                                        fontFamily: FONT.body,
                                        fontSize: FONT_SIZE.xs + 1,
                                        color: COLOR.muted,
                                        lineHeight: 1.5,
                                    }}>
                                        {option.description}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </Field>

                {values.publishMode === 'seasonal' ? (
                    <div style={{ display: 'grid', gap: SPACE.sm }}>
                        <div style={metricGridStyle}>
                            <Field label="表示開始日">
                                <input
                                    type="date"
                                    value={values.publishStartDate}
                                    onChange={(event) => onChange({ publishStartDate: event.target.value })}
                                    style={inputStyle}
                                />
                            </Field>
                            <Field label="表示終了日">
                                <input
                                    type="date"
                                    value={values.publishEndDate}
                                    onChange={(event) => onChange({ publishEndDate: event.target.value })}
                                    style={{
                                        ...inputStyle,
                                        ...(publishDateError ? { border: '1px solid #E17055' } : {}),
                                    }}
                                />
                            </Field>
                        </div>

                        {canStartPreviewToday ? (
                            <div style={segmentedRowStyle}>
                                <button
                                    type="button"
                                    onClick={() => onChange({ publishStartDate: todayKey })}
                                    style={{
                                        ...segmentedButtonBaseStyle,
                                        ...(values.publishStartDate === todayKey
                                            ? {
                                                border: '2px solid #2BBAA0',
                                                background: '#E8F8F0',
                                                color: COLOR.primaryDark,
                                            }
                                            : null),
                                    }}
                                >
                                    今日から予告する
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onChange({ publishStartDate: values.startDate })}
                                    style={{
                                        ...segmentedButtonBaseStyle,
                                        ...(values.publishStartDate === values.startDate
                                            ? {
                                                border: '2px solid rgba(45, 52, 54, 0.18)',
                                                background: COLOR.white,
                                                color: COLOR.dark,
                                            }
                                            : null),
                                    }}
                                >
                                    本番の日から出す
                                </button>
                            </div>
                        ) : null}

                        <div style={selectionPreviewStyle}>
                            <div style={previewIconStyle}>📣</div>
                            <div style={{ minWidth: 0 }}>
                                <div style={{
                                    fontFamily: FONT.body,
                                    fontSize: FONT_SIZE.sm,
                                    fontWeight: 800,
                                    color: COLOR.dark,
                                }}>
                                    {isShowingPreviewBeforeStart
                                        ? `${formatShortDateLabel(values.publishStartDate)}から予告、${formatShortDateLabel(values.startDate)}から本番`
                                        : '表示開始日を本番より前にすると、ホームで予告中として出せます'}
                                </div>
                                <div style={{
                                    fontFamily: FONT.body,
                                    fontSize: FONT_SIZE.xs + 1,
                                    color: COLOR.muted,
                                    lineHeight: 1.6,
                                }}>
                                    期間チャレンジを早めに見せておきたい時は、表示開始日を本番開始日より前にしてください。
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div style={selectionPreviewStyle}>
                        <div style={previewIconStyle}>∞</div>
                        <div style={{ minWidth: 0 }}>
                            <div style={{
                                fontFamily: FONT.body,
                                fontSize: FONT_SIZE.sm,
                                fontWeight: 800,
                                color: COLOR.dark,
                            }}>
                                いつでもチャレンジ
                            </div>
                            <div style={{
                                fontFamily: FONT.body,
                                fontSize: FONT_SIZE.xs + 1,
                                color: COLOR.muted,
                                lineHeight: 1.6,
                            }}>
                                定番やはじめて用として、ホームに出し続けます。
                            </div>
                        </div>
                    </div>
                )}

                {publishDateError ? (
                    <div style={{
                        fontFamily: FONT.body,
                        fontSize: FONT_SIZE.xs + 1,
                        color: COLOR.danger,
                        fontWeight: 700,
                    }}>
                        {publishDateError}
                    </div>
                ) : null}
            </Section>
        </>
    );
}
