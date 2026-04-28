import type { CSSProperties, ReactNode } from 'react';
import { COLOR, FONT, FONT_SIZE, RADIUS, SPACE } from '@/lib/styles';
import {
    PERSONAL_CHALLENGE_PRESET_OPTIONS,
    type PersonalChallengePresetId,
} from './shared';

export function Section({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
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

export function PreviewRow({
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
                <div style={previewTitleStyle}>{title}</div>
                <div style={previewDescriptionStyle}>{description}</div>
            </div>
        </div>
    );
}

export function SegmentedRow({ children }: { children: ReactNode }) {
    return <div style={{ display: 'flex', gap: SPACE.sm, flexWrap: 'wrap' }}>{children}</div>;
}

export function SegmentButton({
    active,
    disabled,
    onClick,
    children,
}: {
    active: boolean;
    disabled?: boolean;
    onClick: () => void;
    children: ReactNode;
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

export function HintText({ children }: { children: ReactNode }) {
    return (
        <div style={hintTextStyle}>
            {children}
        </div>
    );
}

export function DurationPresetGrid({
    presetId,
    disabled,
    onSelectPreset,
}: {
    presetId: PersonalChallengePresetId;
    disabled: boolean;
    onSelectPreset: (presetId: PersonalChallengePresetId) => void;
}) {
    return (
        <div style={presetGridStyle}>
            {PERSONAL_CHALLENGE_PRESET_OPTIONS.map((option) => (
                <button
                    key={option.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => onSelectPreset(option.id)}
                    style={{
                        ...optionButtonStyle,
                        ...(presetId === option.id ? selectedOptionButtonStyle : {}),
                        ...(disabled ? disabledOptionButtonStyle : {}),
                    }}
                >
                    <div style={optionTitleStyle}>{option.label}</div>
                    <div style={optionDescriptionStyle}>{option.description}</div>
                </button>
            ))}
        </div>
    );
}

export function AppearanceFields({
    title,
    description,
    iconEmoji,
    onTitleChange,
    onDescriptionChange,
    onIconEmojiChange,
}: {
    title: string;
    description: string;
    iconEmoji: string;
    onTitleChange: (title: string) => void;
    onDescriptionChange: (description: string) => void;
    onIconEmojiChange: (iconEmoji: string) => void;
}) {
    return (
        <>
            <label style={fieldStyle}>
                <span style={fieldLabelStyle}>タイトル</span>
                <input
                    type="text"
                    value={title}
                    onChange={(event) => onTitleChange(event.target.value)}
                    placeholder="空のままなら自動でつくるよ"
                    style={inputStyle}
                />
            </label>
            <label style={fieldStyle}>
                <span style={fieldLabelStyle}>ひとこと</span>
                <textarea
                    value={description}
                    onChange={(event) => onDescriptionChange(event.target.value)}
                    placeholder="がんばることを一言だけ"
                    style={{ ...inputStyle, minHeight: 92, resize: 'vertical' }}
                />
            </label>
            <label style={fieldStyle}>
                <span style={fieldLabelStyle}>カードの絵文字</span>
                <input
                    type="text"
                    value={iconEmoji}
                    onChange={(event) => onIconEmojiChange(event.target.value)}
                    placeholder="空なら種目やメニューの絵文字を使うよ"
                    style={inputStyle}
                />
            </label>
        </>
    );
}

export function ChallengeLimitSummary({
    hasChallengeAccount,
    isEditing,
    activeCountLoading,
    limitReached,
    remainingSlots,
    activeLimit,
}: {
    hasChallengeAccount: boolean;
    isEditing: boolean;
    activeCountLoading: boolean;
    limitReached: boolean;
    remainingSlots: number;
    activeLimit: number;
}) {
    return (
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
                            ? `いまは${activeLimit}つ進めているよ。どれか終わったら新しくつくれるよ。`
                            : remainingSlots === activeLimit
                                ? `軽い目標だけど、1日では終わらないように 7日以上から選べるよ。${activeLimit}つまで進められるよ。`
                                : `いま進められるのは あと${remainingSlots}つ。${activeLimit}つまで同時に進められるよ。`}
            </div>
        </div>
    );
}

const sectionStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: SPACE.sm,
    padding: '16px',
    borderRadius: RADIUS.xl,
    background: 'rgba(255,255,255,0.74)',
    border: '1px solid rgba(0,0,0,0.05)',
};

const sectionTitleStyle: CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.sm,
    fontWeight: 800,
    color: COLOR.dark,
};

const previewRowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: SPACE.md,
    padding: '12px 14px',
    borderRadius: RADIUS.lg,
    background: 'rgba(43,186,160,0.08)',
};

const previewIconStyle: CSSProperties = {
    width: 42,
    height: 42,
    borderRadius: 14,
    display: 'grid',
    placeItems: 'center',
    background: 'rgba(255,255,255,0.85)',
    fontSize: 22,
};

const previewTitleStyle: CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.sm,
    fontWeight: 800,
    color: COLOR.dark,
};

const previewDescriptionStyle: CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.xs + 1,
    color: COLOR.muted,
};

const segmentedButtonStyle: CSSProperties = {
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

const selectedSegmentButtonStyle: CSSProperties = {
    border: '2px solid #2BBAA0',
    background: '#E8F8F0',
    color: COLOR.primaryDark,
};

const disabledButtonStyle: CSSProperties = {
    opacity: 0.5,
    cursor: 'not-allowed',
};

const hintTextStyle: CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.xs + 1,
    color: COLOR.muted,
    lineHeight: 1.6,
};

const fieldStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
};

const fieldLabelStyle: CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.sm,
    fontWeight: 700,
    color: COLOR.dark,
};

export const inputStyle: CSSProperties = {
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

const presetGridStyle: CSSProperties = {
    display: 'grid',
    gap: SPACE.sm,
};

const optionButtonStyle: CSSProperties = {
    padding: '12px 14px',
    borderRadius: RADIUS.lg,
    border: '1px solid rgba(0,0,0,0.08)',
    background: COLOR.white,
    cursor: 'pointer',
    textAlign: 'left',
};

const selectedOptionButtonStyle: CSSProperties = {
    border: '2px solid #2BBAA0',
    background: '#E8F8F0',
};

const optionTitleStyle: CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.sm,
    fontWeight: 800,
    color: COLOR.dark,
};

const optionDescriptionStyle: CSSProperties = {
    marginTop: 4,
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.xs + 1,
    color: COLOR.muted,
    lineHeight: 1.5,
};

const disabledOptionButtonStyle: CSSProperties = {
    opacity: 0.55,
    cursor: 'not-allowed',
};

const summaryCardStyle: CSSProperties = {
    padding: SPACE.md,
    borderRadius: RADIUS.lg,
    background: 'rgba(255, 243, 204, 0.56)',
    border: '1px solid rgba(255, 184, 0, 0.18)',
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.sm,
    color: COLOR.text,
};
