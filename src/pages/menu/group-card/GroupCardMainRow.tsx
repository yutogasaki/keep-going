import React from 'react';
import { ChevronDown, Clock, Play } from 'lucide-react';
import { ExerciseIcon } from '../../../components/ExerciseIcon';
import type { MenuGroup } from '../../../data/menuGroups';

interface GroupCardMainRowProps {
    group: MenuGroup;
    expanded: boolean;
    minutes: number;
    exerciseCount: number;
    creatorName?: string | null;
    isTeacher?: boolean;
    isNew?: boolean;
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
    detailsId,
    onTap,
    onToggleExpanded,
}) => {
    const openDetailsLabel = expanded ? `${group.name}の詳細を閉じる` : `${group.name}の詳細を開く`;
    const playLabel = `${group.name}をはじめる。約${minutes}分、${exerciseCount}種目`;

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '16px 16px',
            }}
        >
            <button
                type="button"
                onClick={onTap}
                aria-label={playLabel}
                style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    border: 'none',
                    background: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    textAlign: 'left',
                }}
            >
                <div
                    style={{
                        width: 48,
                        height: 48,
                        borderRadius: 16,
                        background: 'linear-gradient(135deg, #E8F8F0, #FFE5D9)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}
                >
                    <ExerciseIcon id={group.exerciseIds[0] || 'S01'} emoji={group.emoji} size={24} color="#2BBAA0" />
                </div>

                <div style={{ flex: 1 }}>
                    <div
                        style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 16,
                            fontWeight: 700,
                            color: '#2D3436',
                            marginBottom: 2,
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
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 12,
                            color: '#8395A7',
                            display: 'flex',
                            gap: 8,
                            alignItems: 'center',
                        }}
                    >
                        <Clock size={12} aria-hidden="true" />
                        <span>約{minutes}分</span>
                        <span aria-hidden="true">·</span>
                        <span>{exerciseCount}種目</span>
                    </div>
                </div>

                <div
                    aria-hidden="true"
                    style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: '#2BBAA0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
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
                style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    border: 'none',
                    background: 'rgba(0,0,0,0.04)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}
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
