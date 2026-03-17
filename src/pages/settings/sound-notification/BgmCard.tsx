import React from 'react';
import { ChevronDown, Music, Play, Square } from 'lucide-react';
import type { BgmTrack } from '../../../lib/bgmTracks';
import { btnSecondary, inputField, COLOR, FONT, FONT_SIZE, RADIUS, SPACE } from '../../../lib/styles';
import { ToggleButton } from '../ToggleButton';

interface BgmCardProps {
    enabled: boolean;
    volume: number;
    selectedTrackId: string;
    tracks: BgmTrack[];
    isPreviewing: boolean;
    onToggle: () => void;
    onTrackChange: (trackId: string) => void;
    onVolumeChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onPreviewToggle: () => void;
}

export const BgmCard: React.FC<BgmCardProps> = ({
    enabled,
    volume,
    selectedTrackId,
    tracks,
    isPreviewing,
    onToggle,
    onTrackChange,
    onVolumeChange,
    onPreviewToggle,
}) => {
    const volumePercent = Math.round(volume * 100);
    const hasTracks = tracks.length > 0;
    const resolvedTrackId = tracks.some((track) => track.id === selectedTrackId)
        ? selectedTrackId
        : (tracks[0]?.id ?? '');
    const previewDisabled = !hasTracks || volume === 0;

    const helperText = !hasTracks
        ? 'Music フォルダの mp3 がまだ見つからないため、いまは BGM を選べません。'
        : volume === 0
            ? '0% のときは BGM は流れません。試し聞きもできません。'
            : !enabled
                ? 'オフのあいだは セッション中には流れません。下のボタンで試し聞きはできます。'
                : 'BGM だけの大きさです。こえ と こうかおん には 影響しません。';

    const previewButtonStyle = (disabled: boolean): React.CSSProperties => ({
        ...btnSecondary,
        padding: '10px 14px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACE.sm,
        border: `1px solid ${COLOR.border}`,
        background: disabled
            ? COLOR.bgMuted
            : isPreviewing
                ? 'rgba(9, 132, 227, 0.12)'
                : 'rgba(255,255,255,0.88)',
        color: disabled ? COLOR.light : isPreviewing ? COLOR.info : COLOR.text,
        cursor: disabled ? 'not-allowed' : 'pointer',
        width: '100%',
    });

    const selectShellStyle: React.CSSProperties = {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        borderRadius: RADIUS.lg,
        border: `1px solid ${hasTracks ? 'rgba(9, 132, 227, 0.14)' : COLOR.border}`,
        background: hasTracks
            ? 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(240,247,255,0.92))'
            : COLOR.bgMuted,
        boxShadow: hasTracks
            ? '0 4px 12px rgba(9,132,227,0.06), inset 0 1px 0 rgba(255,255,255,0.75)'
            : 'inset 0 1px 0 rgba(255,255,255,0.65)',
        overflow: 'hidden',
    };

    const selectStyle: React.CSSProperties = {
        ...inputField,
        fontSize: FONT_SIZE.md,
        fontWeight: 600,
        color: hasTracks ? COLOR.dark : COLOR.muted,
        cursor: hasTracks ? 'pointer' : 'not-allowed',
        appearance: 'none',
        WebkitAppearance: 'none',
        border: 'none',
        background: 'transparent',
        boxShadow: 'none',
        paddingRight: 48,
    };

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
                            background: 'rgba(9, 132, 227, 0.12)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            <Music size={16} color={COLOR.info} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <div style={{
                                fontFamily: FONT.body,
                                fontSize: FONT_SIZE.md,
                                fontWeight: 700,
                                color: COLOR.dark,
                            }}>
                                BGM
                            </div>
                            <div style={{
                                fontFamily: FONT.body,
                                fontSize: FONT_SIZE.sm,
                                color: COLOR.muted,
                                marginTop: 2,
                            }}>
                                ストレッチ中の おんがく
                            </div>
                        </div>
                    </div>
                    <ToggleButton enabled={enabled} onToggle={onToggle} color={COLOR.primary} />
                </div>

                <div style={{
                    display: 'grid',
                    gap: SPACE.md,
                }}>
                    <label style={{
                        display: 'grid',
                        gap: SPACE.sm,
                    }}>
                        <span style={{
                            fontFamily: FONT.body,
                            fontSize: FONT_SIZE.sm,
                            fontWeight: 700,
                            color: COLOR.dark,
                        }}>
                            BGM をえらぶ
                        </span>
                        <div style={selectShellStyle}>
                            <select
                                value={resolvedTrackId}
                                onChange={(event) => onTrackChange(event.target.value)}
                                disabled={!hasTracks}
                                style={selectStyle}
                            >
                                {hasTracks ? tracks.map((track) => (
                                    <option key={track.id} value={track.id}>
                                        {track.label}
                                    </option>
                                )) : (
                                    <option value="">BGM がまだありません</option>
                                )}
                            </select>
                            <div style={{
                                position: 'absolute',
                                right: 12,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: 28,
                                height: 28,
                                borderRadius: RADIUS.full,
                                background: hasTracks ? 'rgba(9, 132, 227, 0.12)' : 'rgba(0,0,0,0.04)',
                                color: hasTracks ? COLOR.info : COLOR.light,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                pointerEvents: 'none',
                            }}>
                                <ChevronDown size={16} />
                            </div>
                        </div>
                    </label>

                    <button
                        type="button"
                        onClick={onPreviewToggle}
                        disabled={previewDisabled}
                        style={previewButtonStyle(previewDisabled)}
                    >
                        {isPreviewing ? <Square size={16} /> : <Play size={16} />}
                        {isPreviewing ? 'BGMをとめる' : 'BGMをきいてみる'}
                    </button>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: SPACE.md,
                    }}>
                        <div style={{
                            fontFamily: FONT.body,
                            fontSize: FONT_SIZE.sm,
                            fontWeight: 700,
                            color: COLOR.dark,
                        }}>
                            BGM のおおきさ
                        </div>
                        <div style={{
                            minWidth: 56,
                            height: 32,
                            borderRadius: RADIUS.full,
                            background: COLOR.bgMuted,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: COLOR.info,
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
                        onChange={onVolumeChange}
                        aria-label="BGM のおおきさ"
                        disabled={!hasTracks}
                        style={{
                            width: '100%',
                            accentColor: COLOR.info,
                            cursor: hasTracks ? 'pointer' : 'not-allowed',
                        }}
                    />

                    <div style={{
                        fontFamily: FONT.body,
                        fontSize: FONT_SIZE.sm,
                        color: COLOR.muted,
                    }}>
                        {helperText}
                    </div>
                </div>
            </div>
        </div>
    );
};
