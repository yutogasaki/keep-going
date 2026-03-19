import React from 'react';
import { motion } from 'framer-motion';
import { Modal } from '../../components/Modal';
import { btnPrimary, COLOR, FONT, FONT_SIZE, RADIUS, SPACE } from '../../lib/styles';
import type { ChallengeRewardScene } from './challengeRewardUtils';

interface ChallengeRewardModalProps {
    rewardScene: ChallengeRewardScene | null;
    onClose: () => void;
}

function getChallengeLabel(source: ChallengeRewardScene['source']): string {
    return source === 'teacher' ? '先生チャレンジ' : 'じぶんチャレンジ';
}

function getRewardHeadline(rewardScene: ChallengeRewardScene): string {
    if (rewardScene.rewardKind === 'medal') {
        return 'ちびふわバッジ';
    }

    return rewardScene.rewardValue > 0
        ? `ほし ${rewardScene.rewardValue}こ`
        : 'クリアできたよ';
}

function getRewardCaption(rewardScene: ChallengeRewardScene): string {
    if (rewardScene.rewardKind === 'medal') {
        return 'おへやで バッジに あえるよ';
    }

    return rewardScene.rewardValue > 0
        ? 'おへやに ほしが ふえたよ'
        : 'チャレンジを クリアしたよ';
}

function getRewardEmoji(rewardScene: ChallengeRewardScene): string {
    return rewardScene.rewardKind === 'medal' ? '🏅' : '⭐';
}

export const ChallengeRewardModal: React.FC<ChallengeRewardModalProps> = ({
    rewardScene,
    onClose,
}) => {
    if (!rewardScene) {
        return null;
    }

    const challengeLabel = getChallengeLabel(rewardScene.source);
    const rewardHeadline = getRewardHeadline(rewardScene);
    const rewardCaption = getRewardCaption(rewardScene);
    const rewardEmoji = getRewardEmoji(rewardScene);

    return (
        <Modal
            open={rewardScene !== null}
            onClose={onClose}
            maxWidth={360}
            ariaLabel="チャレンジのごほうび"
            contentStyle={{
                padding: SPACE['2xl'],
                display: 'flex',
                flexDirection: 'column',
                gap: SPACE.lg,
                overflow: 'hidden',
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <span style={labelPillStyle}>{challengeLabel}</span>
            </div>

            <div style={heroStyle}>
                <motion.div
                    initial={{ scale: 0.82, rotate: -8, opacity: 0 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                    style={heroEmojiWrapStyle}
                >
                    <span style={heroEmojiStyle}>{rewardScene.accentEmoji}</span>
                </motion.div>

                <div style={{ textAlign: 'center', display: 'grid', gap: SPACE.sm }}>
                    <h2 style={titleStyle}>できたよ！</h2>
                    <p style={bodyStyle}>
                        {rewardScene.memberName ? `${rewardScene.memberName}の ` : ''}
                        「{rewardScene.title}」が いっぱいになったよ。
                    </p>
                </div>
            </div>

            <div style={progressCardStyle}>
                <div style={progressLabelStyle}>ごほうびメーター</div>
                <div style={progressTrackStyle}>
                    <motion.div
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        style={progressFillStyle}
                    />
                </div>
                <div style={progressHintStyle}>まんたんになったよ</div>
            </div>

            <div style={rewardCardStyle}>
                <div style={rewardRowStyle}>
                    <span style={rewardEmojiStyle}>{rewardEmoji}</span>
                    <div style={{ display: 'grid', gap: 4 }}>
                        <div style={rewardTitleStyle}>{rewardHeadline}</div>
                        <div style={rewardCaptionStyle}>{rewardCaption}</div>
                    </div>
                </div>
            </div>

            <button
                type="button"
                onClick={onClose}
                style={{
                    ...btnPrimary,
                    width: '100%',
                    borderRadius: RADIUS.full,
                }}
            >
                うけとる
            </button>
        </Modal>
    );
};

const labelPillStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.sm,
    fontWeight: 700,
    color: COLOR.primaryDark,
    background: 'rgba(43, 186, 160, 0.12)',
    borderRadius: RADIUS.full,
    padding: '6px 12px',
};

const heroStyle: React.CSSProperties = {
    display: 'grid',
    gap: SPACE.md,
    justifyItems: 'center',
};

const heroEmojiWrapStyle: React.CSSProperties = {
    width: 84,
    height: 84,
    borderRadius: RADIUS.circle,
    display: 'grid',
    placeItems: 'center',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(240,253,250,0.96) 100%)',
    border: '1px solid rgba(43, 186, 160, 0.14)',
    boxShadow: '0 14px 30px rgba(43, 186, 160, 0.16)',
};

const heroEmojiStyle: React.CSSProperties = {
    fontSize: 42,
    lineHeight: 1,
};

const titleStyle: React.CSSProperties = {
    margin: 0,
    fontFamily: FONT.body,
    fontSize: FONT_SIZE['3xl'],
    fontWeight: 800,
    color: COLOR.dark,
};

const bodyStyle: React.CSSProperties = {
    margin: 0,
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.md,
    color: COLOR.text,
    lineHeight: 1.8,
};

const progressCardStyle: React.CSSProperties = {
    display: 'grid',
    gap: SPACE.sm,
    padding: SPACE.md,
    borderRadius: RADIUS.xl,
    background: 'rgba(248, 249, 250, 0.92)',
    border: '1px solid rgba(0,0,0,0.05)',
};

const progressLabelStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.xs + 1,
    fontWeight: 700,
    color: COLOR.muted,
};

const progressTrackStyle: React.CSSProperties = {
    height: 12,
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    background: '#E5E7EB',
};

const progressFillStyle: React.CSSProperties = {
    height: '100%',
    borderRadius: RADIUS.full,
    background: 'linear-gradient(90deg, #2BBAA0, #74B9FF, #FDCB6E)',
};

const progressHintStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.sm,
    fontWeight: 700,
    color: COLOR.primaryDark,
};

const rewardCardStyle: React.CSSProperties = {
    padding: SPACE.md,
    borderRadius: RADIUS.xl,
    background: 'linear-gradient(180deg, rgba(255, 249, 230, 0.96) 0%, rgba(255, 243, 204, 0.92) 100%)',
    border: '1px solid rgba(253, 203, 110, 0.36)',
};

const rewardRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: SPACE.md,
};

const rewardEmojiStyle: React.CSSProperties = {
    fontSize: 28,
    lineHeight: 1,
};

const rewardTitleStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.xl,
    fontWeight: 800,
    color: '#9A6700',
};

const rewardCaptionStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.sm,
    color: '#8A5A00',
    lineHeight: 1.7,
};
