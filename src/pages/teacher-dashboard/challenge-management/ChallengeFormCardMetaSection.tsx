import { CLASS_LEVELS } from '../../../data/exercises';
import { COLOR, FONT, FONT_SIZE, RADIUS } from '../../../lib/styles';
import {
    classLevelWrapStyle,
    fieldHintStyle,
    inputStyle,
    optionButtonBaseStyle,
    optionGridStyle,
    rewardPanelStyle,
} from './ChallengeFormCard.styles';
import { Field, Section } from './ChallengeFormCard.parts';
import type { ChallengeFormValues } from './types';

interface ChallengeFormCardMetaSectionProps {
    values: ChallengeFormValues;
    onChange: (patch: Partial<ChallengeFormValues>) => void;
    onToggleClassLevel: (level: string) => void;
}

const selectedOptionStyle = {
    border: '2px solid #2BBAA0',
    background: '#E8F8F0',
} as const;

export function ChallengeFormCardMetaSection({
    values,
    onChange,
    onToggleClassLevel,
}: ChallengeFormCardMetaSectionProps) {
    return (
        <>
            <Section title="対象クラス" description="選ばなければ全クラスに表示します。">
                <div style={classLevelWrapStyle}>
                    {CLASS_LEVELS.map((classLevel) => {
                        const selected = values.classLevels.includes(classLevel.id);
                        return (
                            <button
                                key={classLevel.id}
                                type="button"
                                onClick={() => onToggleClassLevel(classLevel.id)}
                                style={{
                                    padding: '8px 12px',
                                    borderRadius: RADIUS.full,
                                    border: selected ? '2px solid #2BBAA0' : '1px solid rgba(0,0,0,0.08)',
                                    background: selected ? '#E8F8F0' : COLOR.white,
                                    fontFamily: FONT.body,
                                    fontSize: FONT_SIZE.sm,
                                    fontWeight: 700,
                                    color: selected ? COLOR.primaryDark : COLOR.text,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 6,
                                }}
                            >
                                <span>{classLevel.emoji}</span>
                                <span>{classLevel.id}</span>
                            </button>
                        );
                    })}
                </div>
            </Section>

            <Section title="ごほうび" description="小さいチャレンジはほし、大きいチャレンジはバッジです。">
                <Field label="チャレンジの大きさ">
                    <div style={optionGridStyle}>
                        {([
                            { id: 'small', label: 'スモール', description: 'ほしを配る軽めのチャレンジ' },
                            { id: 'big', label: 'ビッグ', description: 'バッジを配るしっかり目のチャレンジ' },
                        ] as const).map((option) => {
                            const selected = values.tier === option.id;
                            return (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => {
                                        if (option.id === 'small') {
                                            onChange({
                                                tier: 'small',
                                                rewardKind: 'star',
                                                rewardValue: values.rewardKind === 'star' ? Math.max(values.rewardValue, 1) : 1,
                                            });
                                            return;
                                        }

                                        onChange({
                                            tier: 'big',
                                            rewardKind: 'medal',
                                            rewardValue: values.rewardKind === 'medal' ? values.rewardValue : 0,
                                        });
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

                {values.tier === 'small' ? (
                    <div style={rewardPanelStyle}>
                        <Field label="もらえるほし" hint="新しく作る時の初期値は1こですが、ここで増やせます。">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                                <input
                                    type="number"
                                    min={1}
                                    value={Math.max(values.rewardValue, 1)}
                                    onChange={(event) => onChange({ rewardValue: Math.max(Number(event.target.value), 1) })}
                                    style={{ ...inputStyle, width: 120 }}
                                />
                                <div style={{
                                    fontFamily: FONT.body,
                                    fontSize: FONT_SIZE.sm,
                                    color: COLOR.text,
                                    fontWeight: 700,
                                }}>
                                    クリアで ほし {Math.max(values.rewardValue, 1)}こ
                                </div>
                            </div>
                        </Field>
                    </div>
                ) : (
                    <div style={rewardPanelStyle}>
                        <Field label="もらえるバッジ" hint="1つ選ぶと、クリア時にそのバッジが配られます。">
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(56px, 1fr))',
                                gap: 8,
                            }}>
                                {Array.from({ length: 12 }, (_, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => onChange({ rewardValue: index })}
                                        aria-label={`バッジ ${index + 1}`}
                                        style={{
                                            width: '100%',
                                            aspectRatio: '1 / 1',
                                            borderRadius: 14,
                                            border: values.rewardValue === index ? '2px solid #FFB800' : '1px solid rgba(0,0,0,0.08)',
                                            background: values.rewardValue === index ? '#FFF9E6' : COLOR.white,
                                            padding: 6,
                                            cursor: 'pointer',
                                            boxShadow: values.rewardValue === index ? '0 0 0 2px rgba(255,184,0,0.16)' : 'none',
                                        }}
                                    >
                                        <img
                                            src={`/medal/${index}.webp`}
                                            alt={`バッジ ${index + 1}`}
                                            loading="lazy"
                                            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                                        />
                                    </button>
                                ))}
                            </div>
                        </Field>
                    </div>
                )}

                <div style={fieldHintStyle}>
                    アイコンは別で入力せず、選んだ種目やメニューの見た目をそのまま使います。
                </div>
            </Section>
        </>
    );
}
