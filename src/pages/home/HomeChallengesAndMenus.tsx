import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { ChallengeCard } from '../../components/ChallengeCard';
import { PersonalChallengeCard } from '../../components/PersonalChallengeCard';
import { PopularMenusRow } from '../../components/PopularMenusRow';
import { HomeTeacherMenuHighlights } from './HomeTeacherMenuHighlights';
import type { ExercisePlacement } from '../../data/exercisePlacement';
import type { Challenge, ChallengeCompletion } from '../../lib/challenges';
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
    recommendedMenus: PublicMenu[];
    recommendedExercises: PublicExercise[];
    teacherExercises: TeacherExercise[];
    teacherMenus: TeacherMenu[];
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
    recommendedMenus,
    recommendedExercises,
    teacherExercises,
    teacherMenus,
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

    return (
        <>
            {showChallengeSection && (
                <div
                    id="home-challenges-section"
                    style={{
                        width: '100%',
                        padding: '0 16px',
                        marginTop: 20,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                        <span
                            style={{
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 13,
                                fontWeight: 700,
                                color: '#636E72',
                                padding: '0 4px',
                            }}
                        >
                            チャレンジ
                        </span>
                        <button
                            type="button"
                            onClick={onOpenChallengeHub}
                            style={{
                                border: 'none',
                                background: 'none',
                                cursor: 'pointer',
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 12,
                                fontWeight: 700,
                                color: '#2BBAA0',
                            }}
                        >
                            もっと見る
                        </button>
                    </div>
                    {filteredChallenges.map((challenge) => (
                        <ChallengeCard
                            key={challenge.id}
                            challenge={challenge}
                            completions={completions}
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
                                    color: '#94A3B8',
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
            )}

            {(pastChallenges.length > 0 || personalPastChallenges.length > 0) && (
                <div
                    style={{
                        width: '100%',
                        padding: '0 16px',
                        marginTop: filteredChallenges.length > 0 || todayDoneChallenges.length > 0 || personalActiveChallenges.length > 0 || personalTodayDoneChallenges.length > 0 ? 10 : 20,
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
                            color: '#B2BEC3',
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
                                        onOpenDetail={() => onOpenPersonalChallenge(item)}
                                        variant="past"
                                    />
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
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
