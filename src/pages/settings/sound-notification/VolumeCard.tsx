import React from 'react';
import { Mic, Volume2 } from 'lucide-react';
import { btnSecondary, COLOR, FONT, FONT_SIZE, RADIUS, SPACE } from '../../../lib/styles';

interface VolumeCardProps {
    volume: number;
    ttsEnabled: boolean;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onPreviewSound: () => void;
    onPreviewTts: () => void;
}

export const VolumeCard: React.FC<VolumeCardProps> = ({
    volume,
    ttsEnabled,
    onChange,
    onPreviewSound,
    onPreviewTts,
}) => {
    const volumePercent = Math.round(volume * 100);
    const previewDisabled = volume === 0;
    const speechPreviewDisabled = previewDisabled || !ttsEnabled;
    const helperText = previewDisabled
        ? '0% のときは、こえも こうかおんも なりません。'
        : ttsEnabled
            ? 'こえ と こうかおん の りょうほうに 反映されます。'
            : 'いまは こうかおん だけ きけます。こえは オンにすると試せます。';

    const previewButtonStyle = (disabled: boolean): React.CSSProperties => ({
        ...btnSecondary,
        padding: '10px 14px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACE.sm,
        border: `1px solid ${COLOR.border}`,
        background: disabled ? COLOR.bgMuted : 'rgba(255,255,255,0.88)',
        color: disabled ? COLOR.light : COLOR.text,
        cursor: disabled ? 'not-allowed' : 'pointer',
        flex: 1,
        minWidth: 0,
    });

    return (
        <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: `${SPACE.lg}px ${SPACE.xl}px` }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: SPACE.md,
                    marginBottom: SPACE.lg,
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: SPACE.md,
                        minWidth: 0,
                    }}>
                        <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: 10,
                            background: 'rgba(43, 186, 160, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            <Volume2 size={16} color={COLOR.primary} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <div style={{
                                fontFamily: FONT.body,
                                fontSize: FONT_SIZE.md,
                                fontWeight: 700,
                                color: COLOR.dark,
                            }}>
                                音の大きさ
                            </div>
                            <div style={{
                                fontFamily: FONT.body,
                                fontSize: FONT_SIZE.sm,
                                color: COLOR.muted,
                                marginTop: 2,
                            }}>
                                こえ と こうかおん
                            </div>
                        </div>
                    </div>
                    <div style={{
                        minWidth: 56,
                        height: 32,
                        borderRadius: RADIUS.full,
                        background: COLOR.bgMuted,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: COLOR.primaryDark,
                        fontFamily: FONT.body,
                        fontSize: FONT_SIZE.sm,
                        fontWeight: 700,
                    }}>
                        {volumePercent}%
                    </div>
                </div>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={onChange}
                    aria-label="音の大きさ"
                    style={{
                        width: '100%',
                        accentColor: COLOR.primary,
                    }}
                />
                <div style={{
                    marginTop: SPACE.sm,
                    fontFamily: FONT.body,
                    fontSize: FONT_SIZE.sm,
                    color: COLOR.muted,
                }}>
                    {helperText}
                </div>
                <div style={{
                    marginTop: SPACE.lg,
                    display: 'flex',
                    gap: SPACE.sm,
                    flexWrap: 'wrap',
                }}>
                    <button
                        type="button"
                        onClick={onPreviewSound}
                        disabled={previewDisabled}
                        style={previewButtonStyle(previewDisabled)}
                    >
                        <Volume2 size={16} />
                        おとをきく
                    </button>
                    <button
                        type="button"
                        onClick={onPreviewTts}
                        disabled={speechPreviewDisabled}
                        style={previewButtonStyle(speechPreviewDisabled)}
                    >
                        <Mic size={16} />
                        こえをきく
                    </button>
                </div>
            </div>
        </div>
    );
};
