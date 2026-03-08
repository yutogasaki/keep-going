import React from 'react';
import { Download, Edit2, EyeOff, Trash2, Upload } from 'lucide-react';
import type { MenuGroup } from '../../../data/menuGroups';
import type { GroupCardExerciseSummary } from './groupCardUtils';

interface GroupCardDetailsProps {
    group: MenuGroup;
    detailsId: string;
    exercises: GroupCardExerciseSummary[];
    isCustom?: boolean;
    isPublished?: boolean;
    downloadCount?: number;
    onEdit?: () => void;
    onDelete?: () => void;
    onPublish?: () => void;
    onUnpublish?: () => void;
}

interface GroupCardActionButtonProps {
    tone?: 'default' | 'danger' | 'primary';
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    ariaLabel: string;
}

function GroupCardActionButton({
    tone = 'default',
    label,
    icon,
    onClick,
    ariaLabel,
}: GroupCardActionButtonProps) {
    const styles = tone === 'danger'
        ? {
            border: 'none',
            background: 'rgba(225, 112, 85, 0.08)',
            color: '#E17055',
        }
        : tone === 'primary'
            ? {
                border: 'none',
                background: 'rgba(9, 132, 227, 0.08)',
                color: '#0984E3',
            }
            : {
                border: '1px solid rgba(0,0,0,0.1)',
                background: 'white',
                color: '#8395A7',
            };

    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={ariaLabel}
            style={{
                padding: '6px 12px',
                borderRadius: 8,
                cursor: 'pointer',
                fontFamily: "'Noto Sans JP', sans-serif",
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                ...styles,
            }}
        >
            {icon}
            {label}
        </button>
    );
}

export const GroupCardDetails: React.FC<GroupCardDetailsProps> = ({
    group,
    detailsId,
    exercises,
    isCustom,
    isPublished,
    downloadCount,
    onEdit,
    onDelete,
    onPublish,
    onUnpublish,
}) => {
    return (
        <div id={detailsId} role="region" aria-label={`${group.name}の詳細`}>
            <div style={{ padding: '10px 16px 12px' }}>
                {group.description ? (
                    <p
                        style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 12,
                            color: '#8395A7',
                            marginBottom: 8,
                        }}
                    >
                        {group.description}
                    </p>
                ) : null}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {exercises.map((exercise, index) => (
                        <span
                            key={`${exercise.id}-${index}`}
                            style={{
                                padding: '4px 10px',
                                borderRadius: 8,
                                background: 'rgba(0,0,0,0.04)',
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 12,
                                color: '#2D3436',
                            }}
                        >
                            {exercise.emoji} {exercise.name}
                        </span>
                    ))}
                </div>
                {isCustom && isPublished && downloadCount != null ? (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            marginTop: 8,
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 11,
                            color: '#0984E3',
                        }}
                    >
                        <Download size={11} />
                        {downloadCount}人がつかってるよ
                    </div>
                ) : null}
                {isCustom ? (
                    <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                        {onEdit ? (
                            <GroupCardActionButton
                                label="へんしゅう"
                                icon={<Edit2 size={12} />}
                                onClick={onEdit}
                                ariaLabel={`${group.name}をへんしゅう`}
                            />
                        ) : null}
                        {onDelete ? (
                            <GroupCardActionButton
                                tone="danger"
                                label="さくじょ"
                                icon={<Trash2 size={12} />}
                                onClick={onDelete}
                                ariaLabel={`${group.name}をさくじょ`}
                            />
                        ) : null}
                        {isPublished ? (
                            onUnpublish ? (
                                <GroupCardActionButton
                                    tone="danger"
                                    label="ひこうかい"
                                    icon={<EyeOff size={12} />}
                                    onClick={onUnpublish}
                                    ariaLabel={`${group.name}をひこうかいにする`}
                                />
                            ) : null
                        ) : onPublish ? (
                            <GroupCardActionButton
                                tone="primary"
                                label="こうかい"
                                icon={<Upload size={12} />}
                                onClick={onPublish}
                                ariaLabel={`${group.name}をこうかいする`}
                            />
                        ) : null}
                    </div>
                ) : null}
            </div>
        </div>
    );
};
