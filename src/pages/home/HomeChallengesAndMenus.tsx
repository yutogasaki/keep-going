import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { ChallengeCard } from '../../components/ChallengeCard';
import { PopularMenusRow } from '../../components/PopularMenusRow';
import { HomeTeacherMenuHighlights } from './HomeTeacherMenuHighlights';
import type { ExercisePlacement } from '../../data/exercisePlacement';
import type { Challenge, ChallengeCompletion } from '../../lib/challenges';
import type { PublicExercise } from '../../lib/publicExercises';
import type { PublicMenu } from '../../lib/publicMenus';
import type { TeacherExercise, TeacherMenu } from '../../lib/teacherContent';

interface HomeChallengesAndMenusProps {
    filteredChallenges: Challenge[];
    pastChallenges: Challenge[];
    completions: ChallengeCompletion[];
    teacherExercises: TeacherExercise[];
    teacherMenuHighlights: TeacherMenu[];
    teacherExerciseHighlight: TeacherExercise | null;
    teacherMenuExerciseMap: Map<string, { name: string; emoji: string; sec: number; placement: ExercisePlacement }>;
    isNewTeacherContent: (id: string) => boolean;
    pastExpanded: boolean;
    onTogglePastExpanded: () => void;
    onChallengesUpdated: () => void;
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
    filteredChallenges,
    pastChallenges,
    completions,
    teacherExercises,
    teacherMenuHighlights,
    teacherExerciseHighlight,
    teacherMenuExerciseMap,
    isNewTeacherContent,
    pastExpanded,
    onTogglePastExpanded,
    onChallengesUpdated,
    onOpenMenuBrowser,
    onOpenExerciseBrowser,
    onOpenMenuTab,
    onTeacherMenuPreview,
    onTeacherExercisePreview,
    onTeacherMenuStart,
    onMenuTap,
    onExerciseTap,
}) => {
    return (
        <>
            {filteredChallenges.length > 0 && (
                <div
                    style={{
                        width: '100%',
                        padding: '0 16px',
                        marginTop: 20,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                    }}
                >
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
                    {filteredChallenges.map((challenge) => (
                        <ChallengeCard
                            key={challenge.id}
                            challenge={challenge}
                            completions={completions}
                            teacherExercises={teacherExercises}
                            onCompleted={onChallengesUpdated}
                        />
                    ))}
                </div>
            )}

            {pastChallenges.length > 0 && (
                <div
                    style={{
                        width: '100%',
                        padding: '0 16px',
                        marginTop: filteredChallenges.length > 0 ? 10 : 20,
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
                        おわったチャレンジ（{pastChallenges.length}）
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
                    onOpenMenuBrowser={onOpenMenuBrowser}
                    onOpenExerciseBrowser={onOpenExerciseBrowser}
                    onMenuTap={onMenuTap}
                    onExerciseTap={onExerciseTap}
                />
            </div>
        </>
    );
};
