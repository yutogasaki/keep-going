import React from 'react';
import { motion } from 'framer-motion';
import { ListChecks } from 'lucide-react';
import { COLOR, FONT, FONT_SIZE, RADIUS, SPACE } from '../../../lib/styles';
import {
    INDIVIDUAL_CATEGORY_OPTIONS,
    type IndividualCategoryId,
} from './selectionCategories';

interface IndividualCategoryToolbarProps {
    availableCategories: IndividualCategoryId[];
    category: IndividualCategoryId;
    onCategoryChange: (category: IndividualCategoryId) => void;
    selectionEnabled: boolean;
    selectionMode: boolean;
    onToggleMode: () => void;
}

export const IndividualCategoryToolbar: React.FC<IndividualCategoryToolbarProps> = ({
    availableCategories,
    category,
    onCategoryChange,
    selectionEnabled,
    selectionMode,
    onToggleMode,
}) => {
    return (
        <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <div>
                    <h2
                        style={{
                            margin: 0,
                            fontFamily: FONT.body,
                            fontSize: FONT_SIZE.sm,
                            fontWeight: 700,
                            color: COLOR.muted,
                            letterSpacing: 1,
                        }}
                    >
                        カテゴリでさがす
                    </h2>
                    <p
                        style={{
                            margin: '6px 0 0',
                            fontFamily: FONT.body,
                            fontSize: 12,
                            color: COLOR.light,
                            lineHeight: 1.5,
                        }}
                    >
                        みたい種目だけに しぼれます
                    </p>
                </div>

                {selectionEnabled ? (
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={onToggleMode}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '6px 14px',
                            borderRadius: 12,
                            border: selectionMode ? `2px solid ${COLOR.primary}` : '2px solid #DFE6E9',
                            background: selectionMode ? 'rgba(43, 186, 160, 0.08)' : 'transparent',
                            cursor: 'pointer',
                            fontFamily: FONT.body,
                            fontSize: 13,
                            fontWeight: 700,
                            color: selectionMode ? COLOR.primary : COLOR.muted,
                            transition: 'all 0.15s ease',
                            flexShrink: 0,
                        }}
                    >
                        <ListChecks size={15} />
                        {selectionMode ? 'えらびおわり' : 'えらぶ'}
                    </motion.button>
                ) : null}
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {INDIVIDUAL_CATEGORY_OPTIONS
                    .filter((option) => availableCategories.includes(option.id))
                    .map((option) => {
                        const active = option.id === category;
                        return (
                            <button
                                key={option.id}
                                type="button"
                                onClick={() => onCategoryChange(option.id)}
                                style={{
                                    padding: '8px 12px',
                                    borderRadius: RADIUS.full,
                                    border: active ? `1.5px solid ${COLOR.primary}` : '1px solid rgba(0,0,0,0.08)',
                                    background: active ? 'rgba(43, 186, 160, 0.12)' : 'rgba(255,255,255,0.8)',
                                    color: active ? COLOR.primaryDark : COLOR.text,
                                    fontFamily: FONT.body,
                                    fontSize: 13,
                                    fontWeight: active ? 700 : 600,
                                    cursor: 'pointer',
                                }}
                            >
                                {option.label}
                            </button>
                        );
                    })}
            </div>

            {selectionEnabled && selectionMode ? (
                <div
                    className="card card-sm"
                    style={{
                        padding: `${SPACE.md}px ${SPACE.lg}px`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                        border: '1px solid rgba(43, 186, 160, 0.16)',
                        background: 'linear-gradient(135deg, rgba(232,248,240,0.92) 0%, rgba(255,255,255,0.94) 100%)',
                    }}
                >
                    <div
                        style={{
                            fontFamily: FONT.body,
                            fontSize: 14,
                            fontWeight: 700,
                            color: COLOR.dark,
                        }}
                    >
                        えらんだ種目を優先して おまかせスタート
                    </div>
                    <div
                        style={{
                            fontFamily: FONT.body,
                            fontSize: 12,
                            color: COLOR.muted,
                            lineHeight: 1.5,
                        }}
                    >
                        えらんだ種目は おまかせメニューに優先して入ります。じぶん種目も いっしょに選べます。
                    </div>
                </div>
            ) : null}
        </section>
    );
};
