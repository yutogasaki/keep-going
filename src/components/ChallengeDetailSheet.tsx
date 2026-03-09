import React from 'react';
import { Calendar, Sparkles, Target, Trophy } from 'lucide-react';
import { Modal } from './Modal';
import {
    getChallengeDailyCapLabel,
    getChallengeEmoji,
    getChallengeRewardLabel,
    getChallengeTargetLabel,
    type Challenge,
} from '../lib/challenges';
import { COLOR, FONT, FONT_SIZE, RADIUS, SPACE } from '../lib/styles';

interface ChallengeDetailSheetProps {
    open: boolean;
    challenge: Challenge | null;
    progress: number;
    joined: boolean;
    completed: boolean;
    onClose: () => void;
    onJoin: () => void;
}

export const ChallengeDetailSheet: React.FC<ChallengeDetailSheetProps> = ({
    open,
    challenge,
    progress,
    joined,
    completed,
    onClose,
    onJoin,
}) => {
    if (!challenge) {
        return null;
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            align="bottom"
            maxWidth={420}
            ariaLabel={`${challenge.title}の詳細`}
            contentStyle={{
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
                padding: 20,
                maxHeight: '85vh',
                overflowY: 'auto',
            }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE.lg }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: SPACE.md }}>
                    <div
                        style={{
                            width: 52,
                            height: 52,
                            borderRadius: 18,
                            display: 'grid',
                            placeItems: 'center',
                            fontSize: 28,
                            background: 'rgba(43, 186, 160, 0.10)',
                            flexShrink: 0,
                        }}
                    >
                        {getChallengeEmoji(challenge)}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                            style={{
                                fontFamily: FONT.body,
                                fontSize: FONT_SIZE.xl,
                                fontWeight: 700,
                                color: COLOR.dark,
                            }}
                        >
                            {challenge.title}
                        </div>
                        {challenge.summary && (
                            <div
                                style={{
                                    marginTop: 6,
                                    fontFamily: FONT.body,
                                    fontSize: FONT_SIZE.sm,
                                    color: COLOR.text,
                                    lineHeight: 1.7,
                                }}
                            >
                                {challenge.summary}
                            </div>
                        )}
                    </div>
                </div>

                {challenge.description && (
                    <div
                        style={{
                            padding: SPACE.md,
                            borderRadius: RADIUS.lg,
                            background: 'rgba(255,255,255,0.74)',
                            border: '1px solid rgba(0,0,0,0.05)',
                            fontFamily: FONT.body,
                            fontSize: FONT_SIZE.sm,
                            color: COLOR.text,
                            lineHeight: 1.8,
                        }}
                    >
                        {challenge.description}
                    </div>
                )}

                <div style={{ display: 'grid', gap: SPACE.sm }}>
                    <DetailRow icon={<Target size={15} />} label="対象" value={`${getChallengeTargetLabel(challenge)}を${challenge.targetCount}回`} />
                    <DetailRow icon={<Sparkles size={15} />} label="1日上限" value={getChallengeDailyCapLabel(challenge)} />
                    <DetailRow icon={<Trophy size={15} />} label="報酬" value={getChallengeRewardLabel(challenge)} />
                    <DetailRow icon={<Calendar size={15} />} label="期間" value={`${challenge.startDate} 〜 ${challenge.endDate}`} />
                </div>

                <div
                    style={{
                        padding: SPACE.md,
                        borderRadius: RADIUS.lg,
                        background: challenge.tier === 'small' ? 'rgba(255, 236, 179, 0.32)' : 'rgba(255, 243, 204, 0.56)',
                        border: '1px solid rgba(255, 184, 0, 0.18)',
                        fontFamily: FONT.body,
                        fontSize: FONT_SIZE.sm,
                        color: COLOR.text,
                    }}
                >
                    {completed ? (
                        'クリア済みです。'
                    ) : joined ? (
                        `いまの進みぐあい: ${progress} / ${challenge.targetCount}`
                    ) : (
                        '参加すると、自動で回数がカウントされます。'
                    )}
                </div>

                {!completed && !joined && (
                    <button
                        type="button"
                        onClick={onJoin}
                        style={{
                            width: '100%',
                            padding: '12px 0',
                            borderRadius: RADIUS.lg,
                            border: 'none',
                            background: 'linear-gradient(135deg, #2BBAA0, #0984E3)',
                            color: COLOR.white,
                            fontFamily: FONT.body,
                            fontSize: FONT_SIZE.md,
                            fontWeight: 700,
                            cursor: 'pointer',
                        }}
                    >
                        参加する
                    </button>
                )}
            </div>
        </Modal>
    );
};

function DetailRow({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
}) {
    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: '24px 60px 1fr',
                alignItems: 'center',
                gap: SPACE.sm,
                fontFamily: FONT.body,
                fontSize: FONT_SIZE.sm,
                color: COLOR.text,
            }}
        >
            <div style={{ color: COLOR.primaryDark, display: 'grid', placeItems: 'center' }}>{icon}</div>
            <div style={{ fontWeight: 700, color: COLOR.dark }}>{label}</div>
            <div>{value}</div>
        </div>
    );
}
