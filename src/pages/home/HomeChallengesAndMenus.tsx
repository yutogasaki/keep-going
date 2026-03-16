import React from 'react';
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
    teacherActiveChallenges: Challenge[];
    teacherRecommendedChallenge: Challenge | null;
    personalActiveChallenges: PersonalChallengeProgressItem[];
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
    teacherActiveChallenges,
    teacherRecommendedChallenge,
    personalActiveChallenges,
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
        teacherActiveChallenges.length > 0
        || teacherRecommendedChallenge !== null
        || personalActiveChallenges.length > 0
    );
    const hasMenuSections = (
        teacherMenuHighlights.length > 0
        || teacherExerciseHighlight !== null
        || recommendedMenus.length > 0
        || recommendedExercises.length > 0
    );

    return (
        <>
            {showChallengeSection && (
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
                            <div style={challengeTitleStyle}>チャレンジ</div>
                            <button
                                type="button"
                                onClick={onOpenChallengeHub}
                                style={challengeLinkStyle}
                            >
                                もっと見る
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {teacherActiveChallenges.map((challenge) => (
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

                            {teacherRecommendedChallenge ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: (teacherActiveChallenges.length > 0 || personalActiveChallenges.length > 0) ? 2 : 0 }}>
                                    <span style={challengeSubsectionLabelStyle}>先生からのおすすめ</span>
                                    <ChallengeCard
                                        challenge={teacherRecommendedChallenge}
                                        completions={completions}
                                        rewardGrants={rewardGrants}
                                        teacherExercises={teacherExercises}
                                        onCompleted={onChallengesUpdated}
                                    />
                                </div>
                            ) : null}

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
                                    <div style={{ fontSize: 13, fontWeight: 800, color: '#2D3436' }}>じぶんでつくる</div>
                                    <div style={{ marginTop: 4, fontSize: 11, color: '#636E72', lineHeight: 1.6 }}>
                                        7日で5日みたいな目標をつくれるよ。
                                    </div>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {hasMenuSections && (
                <>
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
            )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
};

const challengeTitleStyle: React.CSSProperties = {
    fontFamily: "'Noto Sans JP', sans-serif",
    fontSize: 16,
    fontWeight: 800,
    color: '#1F2937',
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

const challengeSubsectionLabelStyle: React.CSSProperties = {
    fontFamily: "'Noto Sans JP', sans-serif",
    fontSize: 11,
    fontWeight: 700,
    color: '#64748B',
    padding: '2px 4px 0',
};
