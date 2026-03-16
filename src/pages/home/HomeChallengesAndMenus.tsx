import React from 'react';
import { ChallengeCard } from '../../components/ChallengeCard';
import { PersonalChallengeCard } from '../../components/PersonalChallengeCard';
import { PopularMenusRow } from '../../components/PopularMenusRow';
import { HomeSection } from '../../components/home/HomeSection';
import { getHomeCardStyle, homeCardBodyTextStyle, homeCardTitleStyle } from '../../components/home/homeCardChrome';
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
    const hasChallengeCards =
        teacherActiveChallenges.length > 0 ||
        teacherRecommendedChallenge !== null ||
        personalActiveChallenges.length > 0;
    const hasMenuSections =
        teacherMenuHighlights.length > 0 ||
        teacherExerciseHighlight !== null ||
        recommendedMenus.length > 0 ||
        recommendedExercises.length > 0;

    return (
        <>
            {showChallengeSection && (
                <HomeSection
                    title="チャレンジ"
                    actionLabel="もっと見る"
                    onAction={onOpenChallengeHub}
                    boxed
                    surfaceTone="mint"
                    style={{ marginTop: 20 }}
                    contentStyle={{ gap: 10 }}
                >
                    <div id="home-challenges-section" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 8,
                                    marginTop:
                                        teacherActiveChallenges.length > 0 || personalActiveChallenges.length > 0
                                            ? 2
                                            : 0,
                                }}
                            >
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
                                    ...getHomeCardStyle('mint', {
                                        borderStyle: 'dashed',
                                        borderColor: 'rgba(43, 186, 160, 0.25)',
                                        padding: '16px',
                                    }),
                                    ...emptyCardButtonStyle,
                                }}
                            >
                                <div style={homeCardTitleStyle}>じぶんでつくる</div>
                                <div style={{ ...homeCardBodyTextStyle, marginTop: 4 }}>
                                    7日で5日みたいな目標をつくれるよ。
                                </div>
                            </button>
                        )}
                    </div>
                </HomeSection>
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

const challengeSubsectionLabelStyle: React.CSSProperties = {
    fontFamily: "'Noto Sans JP', sans-serif",
    fontSize: 11,
    fontWeight: 700,
    color: '#64748B',
    padding: '2px 4px 0',
};

const emptyCardButtonStyle: React.CSSProperties = {
    width: '100%',
    textAlign: 'left',
    cursor: 'pointer',
    fontFamily: "'Noto Sans JP', sans-serif",
};
