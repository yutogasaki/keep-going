import React from 'react';
import { Calendar, Flag, Sparkles, Target } from 'lucide-react';
import { Modal } from './Modal';
import type { TeacherExercise, TeacherMenu } from '../lib/teacherContent';
import type { PersonalChallengeProgressItem } from '../pages/home/hooks/usePersonalChallenges';
import {
    getPersonalChallengeDeadlineLabel,
    getPersonalChallengeEmoji,
    getPersonalChallengeGoalLabel,
    getPersonalChallengeProgressLabel,
    getPersonalChallengeStatusLabel,
    getPersonalChallengeTargetName,
} from './personal-challenge/shared';
import { COLOR, FONT, FONT_SIZE, RADIUS, SPACE } from '../lib/styles';

interface PersonalChallengeDetailSheetProps {
    open: boolean;
    item: PersonalChallengeProgressItem | null;
    teacherExercises?: TeacherExercise[];
    teacherMenus?: TeacherMenu[];
    onClose: () => void;
    onEdit: () => void;
    onEnd: () => void;
}

export const PersonalChallengeDetailSheet: React.FC<PersonalChallengeDetailSheetProps> = ({
    open,
    item,
    teacherExercises = [],
    teacherMenus = [],
    onClose,
    onEdit,
    onEnd,
}) => {
    if (!item) {
        return null;
    }

    const { challenge, owner, progress, canEditSetup } = item;
    const targetName = getPersonalChallengeTargetName(challenge, teacherExercises, teacherMenus);
    const emoji = getPersonalChallengeEmoji(challenge, teacherExercises, teacherMenus);
    const goalLabel = getPersonalChallengeGoalLabel(challenge, targetName);
    const progressLabel = getPersonalChallengeProgressLabel(challenge, progress);
    const deadlineLabel = getPersonalChallengeDeadlineLabel(challenge);
    const statusLabel = getPersonalChallengeStatusLabel(challenge.status);
    const isActive = challenge.status === 'active';

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
                        {emoji}
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
                        <div
                            style={{
                                marginTop: 6,
                                display: 'flex',
                                gap: 6,
                                flexWrap: 'wrap',
                            }}
                        >
                            <span style={pillStyle('#E8F8F0', '#1E7F6D')}>じぶんチャレンジ</span>
                            {owner ? <span style={pillStyle('rgba(0,0,0,0.05)', '#52606D')}>{owner.name}</span> : null}
                            <span style={pillStyle('rgba(9,132,227,0.08)', '#0984E3')}>{statusLabel}</span>
                        </div>
                    </div>
                </div>

                {challenge.description ? (
                    <div style={descriptionCardStyle}>
                        {challenge.description}
                    </div>
                ) : null}

                <div style={{ display: 'grid', gap: SPACE.sm }}>
                    <DetailRow icon={<Target size={15} />} label="対象" value={goalLabel} />
                    <DetailRow icon={<Sparkles size={15} />} label="進みぐあい" value={progressLabel} />
                    <DetailRow icon={<Calendar size={15} />} label="期限" value={deadlineLabel} />
                    <DetailRow icon={<Flag size={15} />} label="条件編集" value={canEditSetup ? 'まだ変えられるよ' : 'タイトルだけ変えられるよ'} />
                </div>

                <div
                    style={{
                        padding: SPACE.md,
                        borderRadius: RADIUS.lg,
                        background: challenge.status === 'completed'
                            ? 'rgba(255, 243, 204, 0.6)'
                            : 'rgba(255,255,255,0.74)',
                        border: '1px solid rgba(0,0,0,0.05)',
                        fontFamily: FONT.body,
                        fontSize: FONT_SIZE.sm,
                        color: COLOR.text,
                        lineHeight: 1.8,
                    }}
                >
                    {challenge.status === 'completed'
                        ? 'ほしを1こ もらったよ。'
                        : challenge.status === 'ended_manual'
                            ? 'またやりたくなったら、新しくつくれるよ。'
                            : challenge.status === 'ended_expired'
                                ? '期間が終わったよ。また気分がのったらつくろう。'
                                : 'その日の対象を1回できたら、1日ぶん進みます。'}
                </div>

                {isActive ? (
                    <div style={{ display: 'grid', gap: SPACE.sm }}>
                        <button
                            type="button"
                            onClick={onEdit}
                            style={primaryButtonStyle}
                        >
                            {canEditSetup ? 'へんしゅうする' : 'タイトルをなおす'}
                        </button>
                        <button
                            type="button"
                            onClick={onEnd}
                            style={secondaryButtonStyle}
                        >
                            ここまでにする
                        </button>
                    </div>
                ) : null}
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
                gridTemplateColumns: '24px 72px 1fr',
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

function pillStyle(background: string, color: string): React.CSSProperties {
    return {
        fontFamily: FONT.body,
        fontSize: FONT_SIZE.xs + 1,
        fontWeight: 700,
        color,
        background,
        borderRadius: 999,
        padding: '4px 8px',
    };
}

const descriptionCardStyle: React.CSSProperties = {
    padding: SPACE.md,
    borderRadius: RADIUS.lg,
    background: 'rgba(255,255,255,0.74)',
    border: '1px solid rgba(0,0,0,0.05)',
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.sm,
    color: COLOR.text,
    lineHeight: 1.8,
};

const primaryButtonStyle: React.CSSProperties = {
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
};

const secondaryButtonStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 0',
    borderRadius: RADIUS.lg,
    border: '1px solid rgba(0,0,0,0.08)',
    background: 'rgba(255,255,255,0.7)',
    color: COLOR.text,
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.md,
    fontWeight: 700,
    cursor: 'pointer',
};
