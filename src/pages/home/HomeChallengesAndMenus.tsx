import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { ChallengeCard } from '../../components/ChallengeCard';
import { PersonalChallengeCard } from '../../components/PersonalChallengeCard';
import { PopularMenusRow } from '../../components/PopularMenusRow';
import { HomeTeacherMenuHighlights } from './HomeTeacherMenuHighlights';
import type { ExercisePlacement } from '../../data/exercisePlacement';
import type { MenuGroup } from '../../data/menuGroups';
import type { Challenge, ChallengeCompletion, ChallengeRewardGrant } from '../../lib/challenges';
import type { CustomExercise } from '../../lib/db';
import type { PublicExercise } from '../../lib/publicExercises';
import type { PublicMenu } from '../../lib/publicMenus';
import type { TeacherExercise, TeacherMenu } from '../../lib/teacherContent';
import type { PersonalChallengeProgressItem } from './hooks/usePersonalChallenges';

interface HomeChallengesAndMenusProps {
    showChallengeSection: boolean;
    filteredChallenges: Challenge[];
    todayDoneChallenges: Challenge[];
    pastChallenges: Challenge[];
    personalActiveChallenges: PersonalChallengeProgressItem[];
    personalTodayDoneChallenges: PersonalChallengeProgressItem[];
    personalPastChallenges: PersonalChallengeProgressItem[];
    completions: ChallengeCompletion[];
    rewardGrants: ChallengeRewardGrant[];
    recommendedMenus: PublicMenu[];
    recommendedExercises: PublicExercise[];
    teacherExercises: TeacherExercise[];
    teacherMenus: TeacherMenu[];
    customChallengeExercises: CustomExercise[];
    customChallengeMenus: MenuGroup[];
    teacherMenuHighlights: TeacherMenu[];
    teacherExerciseHighlight: TeacherExercise | null;
    teacherMenuExerciseMap: Map<string, { name: string; emoji: string; sec: number; placement: ExercisePlacement }>;
    isNewTeacherContent: (id: string) => boolean;
    pastExpanded: boolean;
    onTogglePastExpanded: () => void;
    onChallengesUpdated: () => void;
    onOpenChallengeHub: () => void;
    onOpenPersonalChallenge: (item: PersonalChallengeProgressItem) => void;
    onCreatePersonalChallenge: () => void;
    onOpenMenuBrowser: () => void;
    onOpenExerciseBrowser: () => void;
    onOpenMenuTab: () => void;
    onTeacherMenuPreview: (menu: TeacherMenu) => void;
    onTeacherExercisePreview: (exercise: TeacherExercise) => void;
    onTeacherMenuStart: (menu: TeacherMenu) => void;
    onMenuTap: (menu: PublicMenu) => void;
    onExerciseTap: (exercise: PublicExercise) => void;
}

export const HomeChallengesAndMenus: React.FC<HomeChallengesAndMenusProps> = ({
    showChallengeSection,
    filteredChallenges,
    todayDoneChallenges,
    pastChallenges,
    personalActiveChallenges,
    personalTodayDoneChallenges,
    personalPastChallenges,
    completions,
    rewardGrants,
    recommendedMenus,
    recommendedExercises,
    teacherExercises,
    teacherMenus,
    customChallengeExercises,
    customChallengeMenus,
    teacherMenuHighlights,
    teacherExerciseHighlight,
    teacherMenuExerciseMap,
    isNewTeacherContent,
    pastExpanded,
    onTogglePastExpanded,
    onChallengesUpdated,
    onOpenChallengeHub,
    onOpenPersonalChallenge,
    onCreatePersonalChallenge,
    onOpenMenuBrowser,
    onOpenExerciseBrowser,
    onOpenMenuTab,
    onTeacherMenuPreview,
    onTeacherExercisePreview,
    onTeacherMenuStart,
    onMenuTap,
    onExerciseTap,
}) => {
    const hasChallengeCards = (
        filteredChallenges.length > 0
        || todayDoneChallenges.length > 0
        || personalActiveChallenges.length > 0
        || personalTodayDoneChallenges.length > 0
        || pastChallenges.length > 0
        || personalPastChallenges.length > 0
    );
    const hasPastChallenges = pastChallenges.length > 0 || personalPastChallenges.length > 0;
    const hasMenuSections = (
        teacherMenuHighlights.length > 0
        || teacherExerciseHighlight !== null
        || recommendedMenus.length > 0
        || recommendedExercises.length > 0
    );

    return (
        <>
            {(showChallengeSection || hasPastChallenges) && (
                <div
                    id="home-challenges-section"
                    style={{
                        width: '100%',
                        padding: '0 16px',
                        marginTop: 20,
                    }}
                >
                    <div style={challengeSectionStyle}>
                        <div style={challengeHeaderStyle}>
                            <div style={{ minWidth: 0 }}>
                                <div style={challengeEyebrowStyle}>目標をすすめるところ</div>
                                <div style={challengeTitleStyle}>チャレンジ</div>
                                <div style={challengeSubtitleStyle}>
                                    メニューとはべつに、回数や日数の目標をここで進めるよ。
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={onOpenChallengeHub}
                                style={challengeLinkStyle}
                            >
                                もっと見る
                            </button>
                        </div>

                        {showChallengeSection ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {filteredChallenges.map((challenge) => (
                                    <ChallengeCard
                                        key={challenge.id}
                                        challenge={challenge}
                                        completions={completions}
                                        rewardGrants={rewardGrants}
                                        teacherExercises={teacherExercises}
                                        onCompleted={onChallengesUpdated}
                                    />
                                ))}
                                {personalActiveChallenges.map((item) => (
                                    <PersonalChallengeCard
                                        key={item.challenge.id}
                                        item={item}
                                        teacherExercises={teacherExercises}
                                        teacherMenus={teacherMenus}
                                        customExercises={customChallengeExercises}
                                        customMenus={customChallengeMenus}
                                        onOpenDetail={() => onOpenPersonalChallenge(item)}
                                    />
                                ))}
                                {(todayDoneChallenges.length > 0 || personalTodayDoneChallenges.length > 0) && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: filteredChallenges.length > 0 || personalActiveChallenges.length > 0 ? 2 : 0 }}>
                                        <span
                                            style={{
                                                fontFamily: "'Noto Sans JP', sans-serif",
                                                fontSize: 12,
                                                fontWeight: 700,
                                                color: '#64748B',
                                                padding: '4px 4px 0',
                                            }}
                                        >
                                            きょうできたチャレンジ
                                        </span>
                                        {todayDoneChallenges.map((challenge) => (
                                            <ChallengeCard
                                                key={challenge.id}
                                                challenge={challenge}
                                                completions={completions}
                                                rewardGrants={rewardGrants}
                                                teacherExercises={teacherExercises}
                                                onCompleted={onChallengesUpdated}
                                            />
                                        ))}
                                        {personalTodayDoneChallenges.map((item) => (
                                            <PersonalChallengeCard
                                                key={item.challenge.id}
                                                item={item}
                                                teacherExercises={teacherExercises}
                                                teacherMenus={teacherMenus}
                                                customExercises={customChallengeExercises}
                                                customMenus={customChallengeMenus}
                                                onOpenDetail={() => onOpenPersonalChallenge(item)}
                                                variant="today_done"
                                            />
                                        ))}
                                    </div>
                                )}
                                {!hasChallengeCards && (
                                    <button
                                        type="button"
                                        onClick={onCreatePersonalChallenge}
                                        style={{
                                            border: '1px dashed rgba(43, 186, 160, 0.25)',
                                            background: 'linear-gradient(135deg, #F8FFFD, #F1FBF7)',
                                            borderRadius: 16,
                                            padding: '16px',
                                            textAlign: 'left',
                                            cursor: 'pointer',
                                            fontFamily: "'Noto Sans JP', sans-serif",
                                        }}
                                    >
                                        <div style={{ fontSize: 13, fontWeight: 800, color: '#2D3436' }}>じぶんチャレンジをつくる</div>
                                        <div style={{ marginTop: 4, fontSize: 11, color: '#636E72', lineHeight: 1.6 }}>
                                            7日で5日みたいな、小さな目標をじぶんで決められるよ。
                                        </div>
                                    </button>
                                )}
                            </div>
                        ) : null}

                        {hasPastChallenges && (
                            <div
                                style={{
                                    marginTop: showChallengeSection ? 10 : 0,
                                }}
                            >
                                <button
                                    onClick={onTogglePastExpanded}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: '4px 4px',
                                        fontFamily: "'Noto Sans JP', sans-serif",
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color: '#94A3B8',
                                    }}
                                >
                                    <ChevronDown
                                        size={14}
                                        style={{
                                            transform: pastExpanded ? 'rotate(180deg)' : 'rotate(0)',
                                            transition: 'transform 0.2s ease',
                                        }}
                                    />
                                    おわったチャレンジ（{pastChallenges.length + personalPastChallenges.length}）
                                </button>
                                <AnimatePresence>
                                    {pastExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}
                                        >
                                            {pastChallenges.map((challenge) => (
                                                <ChallengeCard
                                                    key={challenge.id}
                                                    challenge={challenge}
                                                    completions={completions}
                                                    rewardGrants={rewardGrants}
                                                    teacherExercises={teacherExercises}
                                                    onCompleted={onChallengesUpdated}
                                                    expired
                                                />
                                            ))}
                                            {personalPastChallenges.map((item) => (
                                                <PersonalChallengeCard
                                                    key={item.challenge.id}
                                                    item={item}
                                                    teacherExercises={teacherExercises}
                                                    teacherMenus={teacherMenus}
                                                    customExercises={customChallengeExercises}
                                                    customMenus={customChallengeMenus}
                                                    onOpenDetail={() => onOpenPersonalChallenge(item)}
                                                    variant="past"
                                                />
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {hasMenuSections && (
                <div
                    style={{
                        width: '100%',
                        padding: '0 16px',
                        marginTop: 16,
                    }}
                >
                    <div style={menuDividerStyle}>
                        <div style={menuDividerEyebrowStyle}>今日やる内容をえらぶところ</div>
                        <div style={menuDividerTitleStyle}>メニュー</div>
                        <div style={menuDividerSubtitleStyle}>
                            チャレンジは目標、メニューは今日やるストレッチをえらぶ場所だよ。
                        </div>
                    </div>
                </div>
            )}

            <HomeTeacherMenuHighlights
                menus={teacherMenuHighlights}
                featuredExercise={teacherExerciseHighlight}
                exerciseMap={teacherMenuExerciseMap}
                isNewTeacherContent={isNewTeacherContent}
                onPreview={onTeacherMenuPreview}
                onExercisePreview={onTeacherExercisePreview}
                onStart={onTeacherMenuStart}
                onOpenMenuTab={onOpenMenuTab}
            />

            <div
                style={{
                    width: '100%',
                    padding: '0 16px',
                    marginTop: 20,
                }}
            >
                <PopularMenusRow
                    menus={recommendedMenus}
                    exercises={recommendedExercises}
                    onOpenMenuBrowser={onOpenMenuBrowser}
                    onOpenExerciseBrowser={onOpenExerciseBrowser}
                    onMenuTap={onMenuTap}
                    onExerciseTap={onExerciseTap}
                />
            </div>
        </>
    );
};

const challengeSectionStyle: React.CSSProperties = {
    borderRadius: 24,
    padding: 16,
    border: '1px solid rgba(43, 186, 160, 0.12)',
    background: 'linear-gradient(180deg, rgba(240, 253, 250, 0.92) 0%, rgba(255, 255, 255, 0.98) 100%)',
    boxShadow: '0 10px 28px rgba(15, 23, 42, 0.06)',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
};

const challengeHeaderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
};

const challengeEyebrowStyle: React.CSSProperties = {
    fontFamily: "'Noto Sans JP', sans-serif",
    fontSize: 11,
    fontWeight: 800,
    color: '#1E7F6D',
    letterSpacing: 0.2,
};

const challengeTitleStyle: React.CSSProperties = {
    fontFamily: "'Noto Sans JP', sans-serif",
    fontSize: 18,
    fontWeight: 800,
    color: '#1F2937',
    marginTop: 2,
};

const challengeSubtitleStyle: React.CSSProperties = {
    fontFamily: "'Noto Sans JP', sans-serif",
    fontSize: 12,
    lineHeight: 1.6,
    color: '#5B6B79',
    marginTop: 4,
};

const challengeLinkStyle: React.CSSProperties = {
    border: 'none',
    background: 'rgba(43, 186, 160, 0.12)',
    color: '#1E7F6D',
    cursor: 'pointer',
    fontFamily: "'Noto Sans JP', sans-serif",
    fontSize: 12,
    fontWeight: 800,
    borderRadius: 999,
    padding: '8px 12px',
    whiteSpace: 'nowrap',
};

const menuDividerStyle: React.CSSProperties = {
    borderRadius: 20,
    padding: '14px 16px',
    border: '1px solid rgba(148, 163, 184, 0.14)',
    background: 'linear-gradient(180deg, rgba(248, 250, 252, 0.96) 0%, rgba(255, 255, 255, 0.98) 100%)',
};

const menuDividerEyebrowStyle: React.CSSProperties = {
    fontFamily: "'Noto Sans JP', sans-serif",
    fontSize: 11,
    fontWeight: 800,
    color: '#7C8A97',
    letterSpacing: 0.2,
};

const menuDividerTitleStyle: React.CSSProperties = {
    fontFamily: "'Noto Sans JP', sans-serif",
    fontSize: 17,
    fontWeight: 800,
    color: '#1F2937',
    marginTop: 2,
};

const menuDividerSubtitleStyle: React.CSSProperties = {
    fontFamily: "'Noto Sans JP', sans-serif",
    fontSize: 12,
    lineHeight: 1.6,
    color: '#5B6B79',
    marginTop: 4,
};
