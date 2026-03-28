import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, Users } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { COLOR, FONT, FONT_SIZE, RADIUS, SPACE, Z } from '../lib/styles';
import { Modal } from './Modal';
import { UserAvatar } from './UserAvatar';
import {
    buildContextOptions,
    getContextHeaderStatus,
    getContextScopeSummary,
    getSelectedContextOption,
    type ContextOption,
} from './currentContextBadgeUtils';

export const CurrentContextBadge: React.FC = () => {
    const sessionUserIds = useAppStore((state) => state.sessionUserIds);
    const users = useAppStore((state) => state.users);
    const setSessionUserIds = useAppStore((state) => state.setSessionUserIds);
    const [selectorOpen, setSelectorOpen] = useState(false);

    const options = useMemo<ContextOption[]>(
        () => buildContextOptions(users),
        [users],
    );
    const selectedOption = useMemo(
        () => getSelectedContextOption({ options, sessionUserIds, users }),
        [options, sessionUserIds, users],
    );

    if (!selectedOption) {
        return null;
    }

    const canSwitch = options.length > 1;
    const headerStatus = getContextHeaderStatus(selectedOption);
    const scopeSummary = getContextScopeSummary(selectedOption);

    const handleSelect = (option: ContextOption) => {
        setSessionUserIds(option.userIds);
        setSelectorOpen(false);
    };

    return (
        <>
            <AnimatePresence>
                <motion.button
                    type="button"
                    onClick={canSwitch ? () => setSelectorOpen(true) : undefined}
                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -10 }}
                    whileTap={canSwitch ? { scale: 0.97 } : undefined}
                    aria-label={canSwitch ? '表示するユーザーを選ぶ' : `${selectedOption.label}を表示中`}
                    style={{
                        background: 'var(--glass-bg-heavy)',
                        backdropFilter: 'blur(var(--blur-sm))',
                        WebkitBackdropFilter: 'blur(var(--blur-sm))',
                        padding: '6px 12px',
                        borderRadius: RADIUS.full,
                        boxShadow: 'var(--shadow-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: SPACE.sm,
                        border: `1px solid ${COLOR.border}`,
                        cursor: canSwitch ? 'pointer' : 'default',
                        pointerEvents: 'auto',
                    }}
                >
                    <div
                        style={{
                            width: 20,
                            height: 20,
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {selectedOption.type === 'together' ? (
                            <div
                                style={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: RADIUS.circle,
                                    background: 'rgba(9, 132, 227, 0.12)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: COLOR.info,
                                }}
                            >
                                <Users size={14} />
                            </div>
                        ) : (
                            <UserAvatar
                                avatarUrl={selectedOption.avatarUrl}
                                name={selectedOption.label}
                                size={20}
                            />
                        )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <span
                            style={{
                                fontFamily: FONT.body,
                                fontSize: FONT_SIZE.xs + 1,
                                fontWeight: 600,
                                color: COLOR.muted,
                                lineHeight: 1.2,
                                userSelect: 'none',
                            }}
                        >
                            {headerStatus}
                        </span>
                        <span
                            style={{
                                fontFamily: FONT.body,
                                fontSize: FONT_SIZE.sm + 1,
                                fontWeight: 700,
                                color: selectedOption.type === 'together' ? COLOR.info : COLOR.primary,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                lineHeight: 1.2,
                                userSelect: 'none',
                                maxWidth: 120,
                            }}
                        >
                            {selectedOption.label}
                        </span>
                    </div>
                    {canSwitch && <ChevronDown size={14} color={COLOR.muted} />}
                </motion.button>
            </AnimatePresence>

            <Modal
                open={selectorOpen}
                onClose={() => setSelectorOpen(false)}
                zIndex={Z.modal}
                maxWidth={420}
                align="bottom"
                ariaLabel="表示するユーザーを選ぶ"
                contentStyle={{
                    padding: `20px 20px calc(env(safe-area-inset-bottom, 0px) + 20px)`,
                    borderRadius: '24px 24px 0 0',
                    borderBottom: 'none',
                    background: 'rgba(255,255,255,0.96)',
                    boxShadow: '0 -12px 32px rgba(0,0,0,0.14)',
                }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE.md }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE.xs }}>
                        <h3
                            style={{
                                margin: 0,
                                fontFamily: FONT.body,
                                fontSize: FONT_SIZE.xl,
                                fontWeight: 700,
                                color: COLOR.dark,
                            }}
                        >
                            だれでみる？
                        </h3>
                        <p
                            style={{
                                margin: 0,
                                fontFamily: FONT.body,
                                fontSize: FONT_SIZE.sm,
                                color: COLOR.text,
                                lineHeight: 1.6,
                            }}
                        >
                            切り替えると、ホーム・きろく・メニューの見え方が変わります
                        </p>
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: SPACE.md,
                            padding: '14px 16px',
                            borderRadius: RADIUS.xl,
                            background: 'rgba(248,249,250,0.92)',
                            border: '1px solid rgba(0,0,0,0.06)',
                        }}
                    >
                        {selectedOption.type === 'together' ? (
                            <div
                                style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: RADIUS.circle,
                                    background: 'rgba(9, 132, 227, 0.12)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: COLOR.info,
                                    flexShrink: 0,
                                }}
                            >
                                <Users size={20} />
                            </div>
                        ) : (
                            <UserAvatar
                                avatarUrl={selectedOption.avatarUrl}
                                name={selectedOption.label}
                                size={40}
                            />
                        )}

                        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <div
                                style={{
                                    fontFamily: FONT.body,
                                    fontSize: FONT_SIZE.xs + 1,
                                    fontWeight: 700,
                                    color: COLOR.muted,
                                }}
                            >
                                いま見ている対象
                            </div>
                            <div
                                style={{
                                    fontFamily: FONT.body,
                                    fontSize: FONT_SIZE.lg,
                                    fontWeight: 700,
                                    color: COLOR.dark,
                                    lineHeight: 1.3,
                                }}
                            >
                                {selectedOption.label}
                            </div>
                            <div
                                style={{
                                    fontFamily: FONT.body,
                                    fontSize: FONT_SIZE.sm,
                                    color: COLOR.text,
                                    lineHeight: 1.6,
                                }}
                            >
                                {scopeSummary}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE.sm }}>
                        {options.map((option) => {
                            const isSelected = option.id === selectedOption.id;
                            return (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => handleSelect(option)}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: SPACE.md,
                                        padding: '14px 16px',
                                        borderRadius: RADIUS.xl,
                                        border: isSelected ? `2px solid ${COLOR.primary}` : '1px solid rgba(0,0,0,0.06)',
                                        background: isSelected ? 'rgba(43, 186, 160, 0.08)' : COLOR.white,
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                    }}
                                >
                                    {option.type === 'together' ? (
                                        <div
                                            style={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: RADIUS.circle,
                                                background: 'rgba(9, 132, 227, 0.12)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: COLOR.info,
                                                flexShrink: 0,
                                            }}
                                        >
                                            <Users size={20} />
                                        </div>
                                    ) : (
                                        <UserAvatar
                                            avatarUrl={option.avatarUrl}
                                            name={option.label}
                                            size={40}
                                        />
                                    )}

                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div
                                            style={{
                                                fontFamily: FONT.body,
                                                fontSize: FONT_SIZE.md,
                                                fontWeight: 700,
                                                color: COLOR.dark,
                                                marginBottom: 2,
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                            }}
                                        >
                                            {option.label}
                                        </div>
                                        <div
                                            style={{
                                                fontFamily: FONT.body,
                                                fontSize: FONT_SIZE.sm,
                                                color: COLOR.muted,
                                            }}
                                        >
                                            {option.subLabel}
                                        </div>
                                        <div
                                            style={{
                                                marginTop: 4,
                                                fontFamily: FONT.body,
                                                fontSize: FONT_SIZE.sm,
                                                color: COLOR.text,
                                                lineHeight: 1.5,
                                            }}
                                        >
                                            {option.impactLabel}
                                        </div>
                                    </div>

                                    <div
                                        style={{
                                            width: 22,
                                            height: 22,
                                            borderRadius: RADIUS.circle,
                                            background: isSelected ? COLOR.primary : 'transparent',
                                            border: isSelected ? 'none' : '1px solid rgba(0,0,0,0.12)',
                                            color: COLOR.white,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                        }}
                                    >
                                        {isSelected && <Check size={14} />}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </Modal>
        </>
    );
};
