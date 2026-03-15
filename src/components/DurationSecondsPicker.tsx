import React from 'react';
import { motion } from 'framer-motion';
import { COLOR, FONT, FONT_SIZE, inputField } from '../lib/styles';

const DEFAULT_PRESET_OPTIONS = [15, 30, 45, 60, 90, 120];

interface DurationSecondsPickerProps {
    value: number;
    onChange: (value: number) => void;
    presetOptions?: number[];
    min?: number;
    step?: number;
    compact?: boolean;
}

export const DurationSecondsPicker: React.FC<DurationSecondsPickerProps> = ({
    value,
    onChange,
    presetOptions = DEFAULT_PRESET_OPTIONS,
    min = 5,
    step = 5,
    compact = false,
}) => {
    const chipPadding = compact ? '10px 12px' : '12px 0';
    const chipFontSize = compact ? 13 : 16;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 10 : 12 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {presetOptions.map((seconds) => {
                    const isActive = value === seconds;
                    return (
                        <motion.button
                            key={seconds}
                            type="button"
                            whileTap={{ scale: 0.96 }}
                            onClick={() => onChange(seconds)}
                            style={{
                                minWidth: compact ? 68 : 74,
                                padding: chipPadding,
                                borderRadius: 12,
                                border: isActive ? '2px solid #2BBAA0' : '2px solid transparent',
                                background: isActive ? 'rgba(43,186,160,0.08)' : '#F8F9FA',
                                cursor: 'pointer',
                                fontFamily: "'Outfit', sans-serif",
                                fontSize: chipFontSize,
                                fontWeight: 700,
                                color: isActive ? '#2BBAA0' : '#8395A7',
                                transition: 'all 0.2s',
                                flex: compact ? '0 0 auto' : '1 1 0',
                            }}
                        >
                            {seconds}秒
                        </motion.button>
                    );
                })}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{
                    fontFamily: FONT.body,
                    fontSize: compact ? FONT_SIZE.xs : FONT_SIZE.sm,
                    fontWeight: 700,
                    color: '#8395A7',
                }}>
                    ほかの秒数
                </span>
                <input
                    type="number"
                    min={min}
                    step={step}
                    inputMode="numeric"
                    value={value}
                    onChange={(event) => {
                        const nextValue = Number(event.target.value);
                        if (!Number.isFinite(nextValue) || nextValue <= 0) {
                            return;
                        }
                        onChange(nextValue);
                    }}
                    style={{
                        ...inputField,
                        width: compact ? 92 : 108,
                        padding: compact ? '8px 10px' : '10px 12px',
                        fontSize: compact ? FONT_SIZE.sm : FONT_SIZE.md,
                        color: COLOR.dark,
                    }}
                />
                <span style={{
                    fontFamily: FONT.body,
                    fontSize: compact ? FONT_SIZE.xs : FONT_SIZE.sm,
                    color: '#52606D',
                    fontWeight: 700,
                }}>
                    秒
                </span>
            </div>
        </div>
    );
};
