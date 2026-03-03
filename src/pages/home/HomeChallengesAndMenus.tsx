import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { ChallengeCard } from '../../components/ChallengeCard';
import { PopularMenusRow } from '../../components/PopularMenusRow';
import type { Challenge, ChallengeCompletion } from '../../lib/challenges';
import type { PublicMenu } from '../../lib/publicMenus';

interface HomeChallengesAndMenusProps {
    filteredChallenges: Challenge[];
    pastChallenges: Challenge[];
    completions: ChallengeCompletion[];
    pastExpanded: boolean;
    onTogglePastExpanded: () => void;
    onChallengesUpdated: () => void;
    onOpenMenuBrowser: () => void;
    onMenuTap: (menu: PublicMenu) => void;
}

export const HomeChallengesAndMenus: React.FC<HomeChallengesAndMenusProps> = ({
    filteredChallenges,
    pastChallenges,
    completions,
    pastExpanded,
    onTogglePastExpanded,
    onChallengesUpdated,
    onOpenMenuBrowser,
    onMenuTap,
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
                                        onCompleted={onChallengesUpdated}
                                        expired
                                    />
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            <div
                style={{
                    width: '100%',
                    padding: '0 16px',
                    marginTop: 20,
                }}
            >
                <PopularMenusRow
                    onOpenBrowser={onOpenMenuBrowser}
                    onMenuTap={onMenuTap}
                />
            </div>
        </>
    );
};
