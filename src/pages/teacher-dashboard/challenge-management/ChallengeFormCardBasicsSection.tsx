import type { ChallengeFormValues } from './types';
import { inputStyle } from './ChallengeFormCard.styles';
import { Field, Section } from './ChallengeFormCard.parts';

interface ChallengeFormCardBasicsSectionProps {
    values: ChallengeFormValues;
    onChange: (patch: Partial<ChallengeFormValues>) => void;
}

export function ChallengeFormCardBasicsSection({
    values,
    onChange,
}: ChallengeFormCardBasicsSectionProps) {
    return (
        <Section title="基本情報" description="まず名前と説明だけ決めます。">
            <Field label="チャレンジ名" hint="ホームで最初に見える名前です。">
                <input
                    value={values.title}
                    onChange={(event) => onChange({ title: event.target.value })}
                    placeholder="例: 前後開脚チャレンジ"
                    style={inputStyle}
                />
            </Field>

            <Field label="説明" hint="ひとこと欄は使わず、この文章をカードや詳細の説明に回します。">
                <textarea
                    value={values.description}
                    onChange={(event) => onChange({ description: event.target.value })}
                    placeholder="例: 1日1回ゆっくり前後開脚に取り組もう"
                    style={{ ...inputStyle, minHeight: 96, resize: 'vertical' }}
                />
            </Field>
        </Section>
    );
}
