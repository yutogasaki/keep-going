import React, { useMemo, useState } from 'react';
import { Modal } from '../../components/Modal';
import { ChallengeCard } from '../../components/ChallengeCard';
import { PersonalChallengeCard } from '../../components/PersonalChallengeCard';
import type { Challenge, ChallengeCompletion } from '../../lib/challenges';
import type { TeacherExercise, TeacherMenu } from '../../lib/teacherContent';
import type { PersonalChallengeProgressItem } from './hooks/usePersonalChallenges';
import { COLOR, FONT, FONT_SIZE, RADIUS, SPACE } from '../../lib/styles';

type ChallengeHubTab = 'active' | 'teacher' | 'self' | 'past';

interface ChallengeHubSheetProps {
    open: boolean;
    onClose: () => void;
    teacherActiveChallenges: Challenge[];
    teacherTodayDoneChallenges: Challenge[];
    teacherPastChallenges: Challenge[];
    completions: ChallengeCompletion[];
    teacherExercises: TeacherExercise[];
    teacherMenus: TeacherMenu[];
    personalActiveChallenges: PersonalChallengeProgressItem[];
    personalTodayDoneChallenges: PersonalChallengeProgressItem[];
    personalPastChallenges: PersonalChallengeProgressItem[];
    personalLoading: boolean;
    canCreatePersonalChallenge: boolean;
    onCreatePersonalChallenge: () => void;
    onOpenPersonalChallenge: (item: PersonalChallengeProgressItem) => void;
    onTeacherChallengesUpdated: () => void;
}

export const ChallengeHubSheet: React.FC<ChallengeHubSheetProps> = ({
    open,
    onClose,
    teacherActiveChallenges,
    teacherTodayDoneChallenges,
    teacherPastChallenges,
    completions,
    teacherExercises,
    teacherMenus,
    personalActiveChallenges,
    personalTodayDoneChallenges,
    personalPastChallenges,
    personalLoading,
    canCreatePersonalChallenge,
    onCreatePersonalChallenge,
    onOpenPersonalChallenge,
    onTeacherChallengesUpdated,
}) => {
    const [tab, setTab] = useState<ChallengeHubTab>('active');

    const hasTeacherLive = teacherActiveChallenges.length > 0 || teacherTodayDoneChallenges.length > 0;
    const hasPersonalLive = personalActiveChallenges.length > 0 || personalTodayDoneChallenges.length > 0;

    const tabCounts = useMemo(() => ({
        active: teacherActiveChallenges.length + teacherTodayDoneChallenges.length + personalActiveChallenges.length + personalTodayDoneChallenges.length,
        teacher: teacherActiveChallenges.length + teacherTodayDoneChallenges.length,
        self: personalActiveChallenges.length + personalTodayDoneChallenges.length + personalPastChallenges.length,
        past: teacherPastChallenges.length + personalPastChallenges.length,
    }), [
        personalActiveChallenges.length,
        personalPastChallenges.length,
        personalTodayDoneChallenges.length,
        teacherActiveChallenges.length,
        teacherPastChallenges.length,
        teacherTodayDoneChallenges.length,
    ]);

    return (
        <Modal
            open={open}
            onClose={onClose}
            align="bottom"
            maxWidth={520}
            ariaLabel="チャレンジ一覧"
            contentStyle={{
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
                padding: 20,
                maxHeight: '88vh',
                overflowY: 'auto',
            }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE.lg }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: SPACE.md }}>
                    <div>
                        <div style={titleStyle}>チャレンジ</div>
                        <div style={subtitleStyle}>先生のチャレンジと、じぶんで作る目標をまとめて見られるよ。</div>
                    </div>
                    {canCreatePersonalChallenge && (
                        <button
                            type="button"
                            onClick={onCreatePersonalChallenge}
                            style={createButtonStyle}
                        >
                            + じぶんでつくる
                        </button>
                    )}
                </div>

                <div style={tabRowStyle}>
                    <HubTabButton label="すすめ中" count={tabCounts.active} active={tab === 'active'} onClick={() => setTab('active')} />
                    <HubTabButton label="先生" count={tabCounts.teacher} active={tab === 'teacher'} onClick={() => setTab('teacher')} />
                    <HubTabButton label="じぶん" count={tabCounts.self} active={tab === 'self'} onClick={() => setTab('self')} />
                    <HubTabButton label="おわった" count={tabCounts.past} active={tab === 'past'} onClick={() => setTab('past')} />
                </div>

                {tab === 'active' ? (
                    <div style={stackStyle}>
                        <CardGroup title="いまやるチャレンジ">
                            {teacherActiveChallenges.map((challenge) => (
                                <ChallengeCard
                                    key={challenge.id}
                                    challenge={challenge}
                                    completions={completions}
                                    teacherExercises={teacherExercises}
                                    onCompleted={onTeacherChallengesUpdated}
                                />
                            ))}
                            {personalActiveChallenges.map((item) => (
                                <PersonalChallengeCard
                                    key={item.challenge.id}
                                    item={item}
                                    teacherExercises={teacherExercises}
                                    teacherMenus={teacherMenus}
                                    onOpenDetail={() => onOpenPersonalChallenge(item)}
                                />
                            ))}
                            {!hasTeacherLive && !hasPersonalLive ? (
                                <EmptyState text="すすめ中のチャレンジはまだないよ" />
                            ) : null}
                        </CardGroup>

                        {(teacherTodayDoneChallenges.length > 0 || personalTodayDoneChallenges.length > 0) ? (
                            <CardGroup title="きょうできたチャレンジ">
                                {teacherTodayDoneChallenges.map((challenge) => (
                                    <ChallengeCard
                                        key={challenge.id}
                                        challenge={challenge}
                                        completions={completions}
                                        teacherExercises={teacherExercises}
                                        onCompleted={onTeacherChallengesUpdated}
                                    />
                                ))}
                                {personalTodayDoneChallenges.map((item) => (
                                    <PersonalChallengeCard
                                        key={item.challenge.id}
                                        item={item}
                                        teacherExercises={teacherExercises}
                                        teacherMenus={teacherMenus}
                                        onOpenDetail={() => onOpenPersonalChallenge(item)}
                                        variant="today_done"
                                    />
                                ))}
                            </CardGroup>
                        ) : null}
                    </div>
                ) : null}

                {tab === 'teacher' ? (
                    <div style={stackStyle}>
                        <CardGroup title="先生チャレンジ">
                            {teacherActiveChallenges.map((challenge) => (
                                <ChallengeCard
                                    key={challenge.id}
                                    challenge={challenge}
                                    completions={completions}
                                    teacherExercises={teacherExercises}
                                    onCompleted={onTeacherChallengesUpdated}
                                />
                            ))}
                            {teacherTodayDoneChallenges.map((challenge) => (
                                <ChallengeCard
                                    key={challenge.id}
                                    challenge={challenge}
                                    completions={completions}
                                    teacherExercises={teacherExercises}
                                    onCompleted={onTeacherChallengesUpdated}
                                />
                            ))}
                            {!hasTeacherLive ? <EmptyState text="先生チャレンジはまだないよ" /> : null}
                        </CardGroup>
                    </div>
                ) : null}

                {tab === 'self' ? (
                    <div style={stackStyle}>
                        {!canCreatePersonalChallenge ? (
                            <EmptyState text="じぶんチャレンジは ひとりでえらんでいる時につくれるよ" />
                        ) : null}
                        <CardGroup title="じぶんチャレンジ">
                            {personalLoading ? <EmptyState text="読み込み中..." /> : null}
                            {personalActiveChallenges.map((item) => (
                                <PersonalChallengeCard
                                    key={item.challenge.id}
                                    item={item}
                                    teacherExercises={teacherExercises}
                                    teacherMenus={teacherMenus}
                                    onOpenDetail={() => onOpenPersonalChallenge(item)}
                                />
                            ))}
                            {personalTodayDoneChallenges.map((item) => (
                                <PersonalChallengeCard
                                    key={item.challenge.id}
                                    item={item}
                                    teacherExercises={teacherExercises}
                                    teacherMenus={teacherMenus}
                                    onOpenDetail={() => onOpenPersonalChallenge(item)}
                                    variant="today_done"
                                />
                            ))}
                            {!personalLoading && personalActiveChallenges.length === 0 && personalTodayDoneChallenges.length === 0 && personalPastChallenges.length === 0 ? (
                                <EmptyState text="じぶんで ちいさな目標をつくれるよ" />
                            ) : null}
                        </CardGroup>
                    </div>
                ) : null}

                {tab === 'past' ? (
                    <div style={stackStyle}>
                        <CardGroup title="おわったチャレンジ">
                            {teacherPastChallenges.map((challenge) => (
                                <ChallengeCard
                                    key={challenge.id}
                                    challenge={challenge}
                                    completions={completions}
                                    teacherExercises={teacherExercises}
                                    onCompleted={onTeacherChallengesUpdated}
                                    expired
                                />
                            ))}
                            {personalPastChallenges.map((item) => (
                                <PersonalChallengeCard
                                    key={item.challenge.id}
                                    item={item}
                                    teacherExercises={teacherExercises}
                                    teacherMenus={teacherMenus}
                                    onOpenDetail={() => onOpenPersonalChallenge(item)}
                                    variant="past"
                                />
                            ))}
                            {teacherPastChallenges.length === 0 && personalPastChallenges.length === 0 ? (
                                <EmptyState text="おわったチャレンジはまだないよ" />
                            ) : null}
                        </CardGroup>
                    </div>
                ) : null}
            </div>
        </Modal>
    );
};

function CardGroup({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section style={{ display: 'flex', flexDirection: 'column', gap: SPACE.sm }}>
            <div style={groupTitleStyle}>{title}</div>
            {children}
        </section>
    );
}

function HubTabButton({
    label,
    count,
    active,
    onClick,
}: {
    label: string;
    count: number;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            style={{
                ...tabButtonStyle,
                ...(active ? activeTabButtonStyle : null),
            }}
        >
            {label}
            {count > 0 ? <span style={tabCountStyle}>{count}</span> : null}
        </button>
    );
}

function EmptyState({ text }: { text: string }) {
    return (
        <div style={emptyStateStyle}>
            {text}
        </div>
    );
}

const titleStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.xl,
    fontWeight: 800,
    color: COLOR.dark,
};

const subtitleStyle: React.CSSProperties = {
    marginTop: 6,
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.sm,
    color: COLOR.muted,
    lineHeight: 1.7,
};

const createButtonStyle: React.CSSProperties = {
    flexShrink: 0,
    padding: '10px 14px',
    borderRadius: RADIUS.full,
    border: 'none',
    background: 'linear-gradient(135deg, #2BBAA0, #0984E3)',
    color: COLOR.white,
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.sm,
    fontWeight: 700,
    cursor: 'pointer',
};

const tabRowStyle: React.CSSProperties = {
    display: 'flex',
    gap: SPACE.sm,
    flexWrap: 'wrap',
};

const tabButtonStyle: React.CSSProperties = {
    padding: '8px 12px',
    borderRadius: RADIUS.full,
    border: '1px solid rgba(0,0,0,0.08)',
    background: COLOR.white,
    color: COLOR.text,
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.sm,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
};

const activeTabButtonStyle: React.CSSProperties = {
    border: '2px solid #2BBAA0',
    background: '#E8F8F0',
    color: COLOR.primaryDark,
};

const tabCountStyle: React.CSSProperties = {
    minWidth: 18,
    height: 18,
    borderRadius: 999,
    background: 'rgba(43,186,160,0.12)',
    display: 'grid',
    placeItems: 'center',
    padding: '0 4px',
    fontSize: FONT_SIZE.xs + 1,
};

const stackStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: SPACE.lg,
};

const groupTitleStyle: React.CSSProperties = {
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.sm,
    fontWeight: 800,
    color: COLOR.muted,
};

const emptyStateStyle: React.CSSProperties = {
    padding: '16px',
    borderRadius: RADIUS.lg,
    background: 'rgba(255,255,255,0.74)',
    border: '1px dashed rgba(0,0,0,0.08)',
    fontFamily: FONT.body,
    fontSize: FONT_SIZE.sm,
    color: COLOR.muted,
    lineHeight: 1.7,
};
