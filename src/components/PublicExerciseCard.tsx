import React from 'react';
import { Clock, Download } from 'lucide-react';
import { getExercisePlacementLabel } from '../data/exercisePlacement';
import { type PublicExercise } from '../lib/publicExercises';
import { CANONICAL_TERMS } from '../lib/terminology';
import {
    publicCatalogBodyTextStyle,
    publicCatalogCardStyle,
    publicCatalogChipStyle,
    publicCatalogHeaderRowStyle,
    publicCatalogIconSurfaceStyle,
    publicCatalogKindBadgeStyle,
    publicCatalogSubtitleStyle,
    publicCatalogTitleStyle,
} from './publicCatalogCardChrome';

interface PublicExerciseCardProps {
    exercise: PublicExercise;
    onTap: (exercise: PublicExercise) => void;
}

export const PublicExerciseCard: React.FC<PublicExerciseCardProps> = ({ exercise, onTap }) => {
    return (
        <button
            type="button"
            onClick={() => onTap(exercise)}
            style={publicCatalogCardStyle}
        >
            <div style={publicCatalogHeaderRowStyle}>
                <div style={publicCatalogIconSurfaceStyle}>
                    <span style={{ fontSize: 22, lineHeight: 1 }}>{exercise.emoji}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={publicCatalogTitleStyle}>{exercise.name}</div>
                    <div style={publicCatalogSubtitleStyle}>{exercise.authorName} さんの種目</div>
                </div>
                <span style={publicCatalogKindBadgeStyle}>{CANONICAL_TERMS.exercise}</span>
            </div>

            <div style={publicCatalogBodyTextStyle}>
                {exercise.description || `${getExercisePlacementLabel(exercise.placement)} の ${exercise.sec}秒の種目`}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <span style={publicCatalogChipStyle}>
                    <Clock size={11} />
                    {exercise.sec}秒
                </span>
                <span style={publicCatalogChipStyle}>{getExercisePlacementLabel(exercise.placement)}</span>
                <span style={publicCatalogChipStyle}>
                    <Download size={11} />
                    {exercise.downloadCount}
                </span>
            </div>
        </button>
    );
};
