import React, { useId, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { ExercisePlacement } from '../../data/exercisePlacement';
import type { MenuGroup } from '../../data/menuGroups';
import type { PersonalChallengeCreateSeed } from '../../components/PersonalChallengeFormSheet';
import { GroupCardDetails } from './group-card/GroupCardDetails';
import { GroupCardMainRow } from './group-card/GroupCardMainRow';
import { buildGroupCardSummary } from './group-card/groupCardUtils';

interface GroupCardProps {
    group: MenuGroup;
    index: number;
    exerciseMap?: Map<string, { name: string; emoji: string; sec: number; placement: ExercisePlacement }>;
    creatorName?: string | null;
    onTap: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    onPublish?: () => void;
    onUnpublish?: () => void;
    isCustom?: boolean;
    isPublished?: boolean;
    downloadCount?: number;
    isTeacher?: boolean;
    isNew?: boolean;
    onCreatePersonalChallenge?: (seed: PersonalChallengeCreateSeed) => void;
}

export const GroupCard: React.FC<GroupCardProps> = ({
    group,
    index,
    exerciseMap,
    creatorName,
    onTap,
    onEdit,
    onDelete,
    onPublish,
    onUnpublish,
    isCustom,
    isPublished,
    downloadCount,
    isTeacher,
    isNew,
    onCreatePersonalChallenge,
}) => {
    const [expanded, setExpanded] = useState(false);
    const detailsId = useId();
    const summary = buildGroupCardSummary(group, exerciseMap);

    return (
        <motion.div
            className="card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            style={{ padding: 0, overflow: 'hidden' }}
        >
            <GroupCardMainRow
                group={group}
                expanded={expanded}
                minutes={summary.minutes}
                exerciseCount={summary.exerciseCount}
                creatorName={creatorName}
                isTeacher={isTeacher ?? group.origin === 'teacher'}
                isNew={isNew}
                isCustom={isCustom}
                detailsId={detailsId}
                onTap={onTap}
                onToggleExpanded={() => setExpanded((current) => !current)}
            />

            <AnimatePresence>
                {expanded ? (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: 'hidden', borderTop: '1px solid rgba(0,0,0,0.05)' }}
                    >
                        <GroupCardDetails
                            group={group}
                            detailsId={detailsId}
                            exercises={summary.exercises}
                            isCustom={isCustom}
                            isPublished={isPublished}
                            downloadCount={downloadCount}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onPublish={onPublish}
                            onUnpublish={onUnpublish}
                            onCreatePersonalChallenge={onCreatePersonalChallenge}
                        />
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </motion.div>
    );
};
