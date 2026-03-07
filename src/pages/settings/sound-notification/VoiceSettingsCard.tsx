import React, { useCallback, useRef } from 'react';
import { RotateCcw, Speech } from 'lucide-react';
import { audio } from '../../../lib/audio';
import { btnSecondary, COLOR, FONT, FONT_SIZE, RADIUS, SPACE } from '../../../lib/styles';

const DEFAULT_RATE = 0.95;
const DEFAULT_PITCH = 1.05;
const PREVIEW_TEXT = 'つぎは、かいきゃくストレッチです';

interface VoiceSettingsCardProps {
    rate: number;
    pitch: number;
    onRateChange: (rate: number) => void;
    onPitchChange: (pitch: number) => void;
}

const rateLabel = (rate: number) => {
    if (rate <= 0.75) return 'とてもゆっくり';
    if (rate <= 0.85) return 'ゆっくり';
    if (rate <= 1.0) return 'ふつう';
    if (rate <= 1.15) return 'はやめ';
    return 'とてもはやい';
};

const pitchLabel = (pitch: number) => {
    if (pitch <= 0.85) return 'ひくい';
    if (pitch <= 0.95) return 'すこしひくい';
    if (pitch <= 1.1) return 'ふつう';
    if (pitch <= 1.15) return 'すこしたかい';
    return 'たかい';
};

export const VoiceSettingsCard: React.FC<VoiceSettingsCardProps> = ({
    rate,
    pitch,
    onRateChange,
    onPitchChange,
}) => {
    const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const schedulePreview = useCallback(() => {
        if (previewTimerRef.current) {
            clearTimeout(previewTimerRef.current);
        }
        previewTimerRef.current = setTimeout(() => {
            audio.initTTS();
            audio.speak(PREVIEW_TEXT);
        }, 400);
    }, []);

    const handleRateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onRateChange(parseFloat(event.target.value));
        schedulePreview();
    };

    const handlePitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onPitchChange(parseFloat(event.target.value));
        schedulePreview();
    };

    const handleReset = () => {
        onRateChange(DEFAULT_RATE);
        onPitchChange(DEFAULT_PITCH);
        audio.initTTS();
        audio.speak(PREVIEW_TEXT);
    };

    const isDefault = rate === DEFAULT_RATE && pitch === DEFAULT_PITCH;

    return (
        <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: `${SPACE.lg}px ${SPACE.xl}px` }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: SPACE.md,
                    marginBottom: SPACE.lg,
                }}>
                    <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: 10,
                        background: 'rgba(108, 92, 231, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}>
                        <Speech size={16} color={COLOR.purple} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                        <div style={{
                            fontFamily: FONT.body,
                            fontSize: FONT_SIZE.md,
                            fontWeight: 700,
                            color: COLOR.dark,
                        }}>
                            こえの せってい
                        </div>
                        <div style={{
                            fontFamily: FONT.body,
                            fontSize: FONT_SIZE.sm,
                            color: COLOR.muted,
                            marginTop: 2,
                        }}>
                            はやさ と たかさ
                        </div>
                    </div>
                </div>

                {/* Rate slider */}
                <div style={{ marginBottom: SPACE.lg }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: SPACE.sm,
                    }}>
                        <div style={{
                            fontFamily: FONT.body,
                            fontSize: FONT_SIZE.sm,
                            fontWeight: 600,
                            color: COLOR.text,
                        }}>
                            はやさ
                        </div>
                        <div style={{
                            minWidth: 80,
                            textAlign: 'right',
                            padding: `${SPACE.xs}px ${SPACE.sm}px`,
                            borderRadius: RADIUS.full,
                            background: COLOR.bgMuted,
                            color: COLOR.primaryDark,
                            fontFamily: FONT.body,
                            fontSize: FONT_SIZE.sm,
                            fontWeight: 700,
                        }}>
                            {rateLabel(rate)}
                        </div>
                    </div>
                    <input
                        type="range"
                        min="0.7"
                        max="1.3"
                        step="0.05"
                        value={rate}
                        onChange={handleRateChange}
                        aria-label="こえのはやさ"
                        style={{ width: '100%', accentColor: COLOR.primary }}
                    />
                </div>

                {/* Pitch slider */}
                <div style={{ marginBottom: SPACE.lg }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: SPACE.sm,
                    }}>
                        <div style={{
                            fontFamily: FONT.body,
                            fontSize: FONT_SIZE.sm,
                            fontWeight: 600,
                            color: COLOR.text,
                        }}>
                            たかさ
                        </div>
                        <div style={{
                            minWidth: 80,
                            textAlign: 'right',
                            padding: `${SPACE.xs}px ${SPACE.sm}px`,
                            borderRadius: RADIUS.full,
                            background: COLOR.bgMuted,
                            color: COLOR.primaryDark,
                            fontFamily: FONT.body,
                            fontSize: FONT_SIZE.sm,
                            fontWeight: 700,
                        }}>
                            {pitchLabel(pitch)}
                        </div>
                    </div>
                    <input
                        type="range"
                        min="0.8"
                        max="1.2"
                        step="0.05"
                        value={pitch}
                        onChange={handlePitchChange}
                        aria-label="こえのたかさ"
                        style={{ width: '100%', accentColor: COLOR.primary }}
                    />
                </div>

                {/* Reset button */}
                <button
                    type="button"
                    onClick={handleReset}
                    disabled={isDefault}
                    style={{
                        ...btnSecondary,
                        padding: '10px 14px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: SPACE.sm,
                        border: `1px solid ${COLOR.border}`,
                        background: isDefault ? COLOR.bgMuted : 'rgba(255,255,255,0.88)',
                        color: isDefault ? COLOR.light : COLOR.text,
                        cursor: isDefault ? 'not-allowed' : 'pointer',
                        width: '100%',
                    }}
                >
                    <RotateCcw size={14} />
                    もとにもどす
                </button>
            </div>
        </div>
    );
};
