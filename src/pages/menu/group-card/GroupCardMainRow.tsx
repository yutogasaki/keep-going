import React from 'react';
import { ChevronDown, Clock, Play } from 'lucide-react';
import { ExerciseIcon } from '../../../components/ExerciseIcon';
import { getMenuGroupItems, type MenuGroup } from '../../../data/menuGroups';
import { getTeacherVisibilityLabel } from '../../../lib/teacherExerciseMetadata';
import {
    catalogExpandButtonStyle,
    catalogHeaderRowStyle,
    catalogIconSurfaceStyle,
    catalogMetaLineStyle,
    catalogPlayButtonStyle,
    catalogTitleStyle,
} from '../shared/catalogCardChrome';

interface GroupCardMainRowProps {
    group: MenuGroup;
    expanded: boolean;
    minutes: number;
    exerciseCount: number;
    creatorName?: string | null;
    isTeacher?: boolean;
    isNew?: boolean;
    isCustom?: boolean;
    detailsId: string;
    onTap: () => void;
    onToggleExpanded: () => void;
}

export const GroupCardMainRow: React.FC<GroupCardMainRowProps> = ({
    group,
    expanded,
    minutes,
    exerciseCount,
    creatorName,
    isTeacher,
    isNew,
    isCustom,
    detailsId,
    onTap,
    onToggleExpanded,
}) => {
    const openDetailsLabel = expanded ? `${group.name}の詳細を閉じる` : `${group.name}の詳細を開く`;
    const playLabel = `${group.name}をはじめる。約${minutes}分、${exerciseCount}種目`;
    const firstItemId = getMenuGroupItems(group)[0]?.id ?? 'S01';

    return (
        <div
            style={catalogHeaderRowStyle}
        >
            <button
                type="button"
                onClick={onTap}
                aria-label={playLabel}
                style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    border: 'none',
                    background: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    textAlign: 'left',
                }}
            >
                <div style={catalogIconSurfaceStyle}>
                    <ExerciseIcon id={firstItemId} emoji={group.emoji} size={24} color="#2BBAA0" />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                        style={{
                            ...catalogTitleStyle,
                            marginBottom: 2,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                        }}
                    >
                        {group.name}
                        {isTeacher ? (
                            <span
                                style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 9,
                                    fontWeight: 700,
                                    color: '#0984E3',
                                    background: 'rgba(9, 132, 227, 0.1)',
                                    padding: '1px 5px',
                                    borderRadius: 6,
                                    marginLeft: 6,
                                    display: 'inline-block',
                                    verticalAlign: 'middle',
                                }}
                            >
                                先生
                            </span>
                        ) : null}
                        {isCustom ? (
                            <span
                                style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 9,
                                    fontWeight: 700,
                                    color: '#8B5CF6',
                                    background: 'rgba(139, 92, 246, 0.1)',
                                    padding: '1px 5px',
                                    borderRadius: 6,
                                    marginLeft: 6,
                                    display: 'inline-block',
                                    verticalAlign: 'middle',
                                }}
                            >
                                じぶん
                            </span>
                        ) : null}
                        {isNew ? (
                            <span
                                style={{
                                    fontFamily: "'Outfit', sans-serif",
                                    fontSize: 9,
                                    fontWeight: 700,
                                    color: '#FFF',
                                    background: '#FF6B6B',
                                    padding: '1px 5px',
                                    borderRadius: 6,
                                    marginLeft: 4,
                                    display: 'inline-block',
                                    verticalAlign: 'middle',
                                }}
                            >
                                New
                            </span>
                        ) : null}
                        {creatorName ? (
                            <span
                                style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 10,
                                    fontWeight: 600,
                                    color: '#2BBAA0',
                                    background: 'rgba(43, 186, 160, 0.1)',
                                    padding: '2px 6px',
                                    borderRadius: 8,
                                    marginLeft: 8,
                                    display: 'inline-block',
                                    verticalAlign: 'middle',
                                }}
                            >
                                👤 {creatorName}
                            </span>
                        ) : null}
                    </div>
                    <div
                        style={{
                            ...catalogMetaLineStyle,
                            display: 'flex',
                            alignItems: 'center',
                        }}
                    >
                        <Clock size={12} aria-hidden="true" />
                        <span>約{minutes}分</span>
                        <span aria-hidden="true">·</span>
                        <span>{exerciseCount}種目</span>
                    </div>
                    {(group.recommended || (group.visibility && group.visibility !== 'public')) ? (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                            {group.recommended ? (
                                <span
                                    style={{
                                        fontFamily: "'Outfit', sans-serif",
                                        fontSize: 9,
                                        fontWeight: 700,
                                        color: '#FFF',
                                        background: '#2BBAA0',
                                        padding: '1px 5px',
                                        borderRadius: 6,
                                    }}
                                >
                                    {group.recommendedOrder != null ? `おすすめ ${group.recommendedOrder}` : 'おすすめ'}
                                </span>
                            ) : null}
                            {group.visibility && group.visibility !== 'public' ? (
                                <span
                                    style={{
                                        fontFamily: "'Noto Sans JP', sans-serif",
                                        fontSize: 9,
                                        fontWeight: 700,
                                        color: '#0984E3',
                                        background: 'rgba(9, 132, 227, 0.1)',
                                        padding: '1px 5px',
                                        borderRadius: 6,
                                    }}
                                >
                                    {getTeacherVisibilityLabel(group.visibility)}
                                </span>
                            ) : null}
                        </div>
                    ) : null}
                </div>

                <div
                    aria-hidden="true"
                    style={catalogPlayButtonStyle}
                >
                    <Play size={14} color="white" fill="white" />
                </div>
            </button>

            <button
                type="button"
                onClick={onToggleExpanded}
                aria-expanded={expanded}
                aria-controls={detailsId}
                aria-label={openDetailsLabel}
                style={catalogExpandButtonStyle}
            >
                <ChevronDown
                    size={16}
                    color="#B2BEC3"
                    aria-hidden="true"
                    style={{
                        transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
                        transition: 'transform 0.2s ease',
                    }}
                />
            </button>
        </div>
    );
};
