import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { btnPrimary, COLOR, FONT, FONT_SIZE, RADIUS, SPACE, Z } from '../../lib/styles';
import type { FuwafuwaMilestoneEvent, UserProfileStore } from '../../store/useAppStore';
import { getMilestoneEmoji, getMilestoneTitle } from './milestoneCopy';

interface HomeMilestoneModalProps {
    activeMilestoneModal: FuwafuwaMilestoneEvent | null;
    user: UserProfileStore | null;
    onClose: () => void;
}

function getMilestoneStage(kind: FuwafuwaMilestoneEvent['kind']): number {
    if (kind === 'egg') return 1;
    if (kind === 'fairy') return 2;
    return 3;
}

function getPartnerLabel(user: UserProfileStore): string {
    if (user.fuwafuwaName) {
        return `${user.name}の ${user.fuwafuwaName}`;
    }

    return `${user.name}の ふわふわ`;
}

export const HomeMilestoneModal: React.FC<HomeMilestoneModalProps> = ({
    activeMilestoneModal,
    user,
    onClose,
}) => {
    if (!activeMilestoneModal || !user) {
        return null;
    }

    const stage = getMilestoneStage(activeMilestoneModal.kind);
    const imagePath = `/ikimono/${user.fuwafuwaType}-${stage}.webp`;
    const partnerLabel = getPartnerLabel(user);

    return (
        <AnimatePresence>
            <div
                style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: Z.modal,
                    padding: SPACE['2xl'],
                }}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    style={{
                        width: '100%',
                        maxWidth: 320,
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: SPACE.lg,
                        padding: SPACE['3xl'],
                        background: COLOR.white,
                        borderRadius: RADIUS['3xl'],
                        boxShadow: '0 16px 48px rgba(0,0,0,0.1)',
                    }}
                >
                    <div
                        style={{
                            padding: '6px 12px',
                            borderRadius: RADIUS.full,
                            background: 'rgba(43, 186, 160, 0.12)',
                            color: COLOR.primary,
                            fontFamily: FONT.body,
                            fontSize: FONT_SIZE.sm,
                            fontWeight: 700,
                            lineHeight: 1,
                        }}
                    >
                        {partnerLabel}
                    </div>
                    <div
                        style={{
                            width: 112,
                            height: 112,
                            borderRadius: RADIUS.circle,
                            overflow: 'hidden',
                            border: '4px solid rgba(255,255,255,0.95)',
                            boxShadow: '0 16px 36px rgba(43, 186, 160, 0.18)',
                            background: COLOR.white,
                        }}
                    >
                        <img
                            src={imagePath}
                            alt={partnerLabel}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                    </div>
                    <span style={{ fontSize: 40 }}>
                        {getMilestoneEmoji(activeMilestoneModal.kind)}
                    </span>
                    <h2 style={{ fontFamily: FONT.body, fontSize: FONT_SIZE['3xl'], margin: 0, color: COLOR.dark }}>
                        {getMilestoneTitle(activeMilestoneModal.kind)}
                    </h2>
                    <p style={{ fontFamily: FONT.body, fontSize: FONT_SIZE.md, color: COLOR.muted, lineHeight: 1.7, margin: 0 }}>
                        {activeMilestoneModal.kind === 'egg'
                            ? `${partnerLabel}だよ。これから いっしょに そだてていこう！`
                            : activeMilestoneModal.kind === 'fairy'
                                ? `${partnerLabel}が うまれたよ。まいにちの がんばりが ちゃんと とどいてるね！`
                                : `${partnerLabel}が りっぱに そだったよ。ここまで つづけてきたの、すごいね！`}
                    </p>
                    <button
                        onClick={onClose}
                        style={{
                            ...btnPrimary,
                            marginTop: SPACE.lg,
                            width: '100%',
                            borderRadius: RADIUS.full,
                        }}
                    >
                        わかった！
                    </button>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
