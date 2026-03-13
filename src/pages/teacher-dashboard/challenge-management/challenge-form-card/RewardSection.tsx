import type { ChallengeFormValues } from '../types';
import { Field, Section } from './FormPrimitives';
import {
    getMedalButtonStyle,
    getSelectedOptionButtonStyle,
    inputStyle,
    medalGridStyle,
    optionButtonBaseStyle,
    optionButtonDescriptionStyle,
    optionButtonTitleStyle,
    optionGridStyle,
    rewardPanelStyle,
    rewardSummaryRowStyle,
    rewardSummaryTextStyle,
} from './styles';

interface RewardSectionProps {
    values: ChallengeFormValues;
    onChange: (patch: Partial<ChallengeFormValues>) => void;
}

export function RewardSection({ values, onChange }: RewardSectionProps) {
    return (
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
                                    ...getSelectedOptionButtonStyle(selected),
                                }}
                            >
                                <span style={optionButtonTitleStyle}>{option.label}</span>
                                <span style={optionButtonDescriptionStyle}>{option.description}</span>
                            </button>
                        );
                    })}
                </div>
            </Field>

            {values.tier === 'small' ? (
                <div style={rewardPanelStyle}>
                    <Field label="もらえるほし" hint="新しく作る時の初期値は1こですが、ここで増やせます。">
                        <div style={rewardSummaryRowStyle}>
                            <input
                                type="number"
                                min={1}
                                value={Math.max(values.rewardValue, 1)}
                                onChange={(event) => onChange({ rewardValue: Math.max(Number(event.target.value), 1) })}
                                style={{ ...inputStyle, width: 120 }}
                            />
                            <div style={rewardSummaryTextStyle}>
                                クリアで ほし {Math.max(values.rewardValue, 1)}こ
                            </div>
                        </div>
                    </Field>
                </div>
            ) : (
                <div style={rewardPanelStyle}>
                    <Field label="もらえるバッジ" hint="1つ選ぶと、クリア時にそのバッジが配られます。">
                        <div style={medalGridStyle}>
                            {Array.from({ length: 12 }, (_, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => onChange({ rewardValue: index })}
                                    aria-label={`バッジ ${index + 1}`}
                                    style={getMedalButtonStyle(values.rewardValue === index)}
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
        </Section>
    );
}
