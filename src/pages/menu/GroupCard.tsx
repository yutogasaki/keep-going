import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Clock, Edit2, Play, Trash2 } from 'lucide-react';
import { ExerciseIcon } from '../../components/ExerciseIcon';
import { calculateTotalSeconds, getExerciseById } from '../../data/exercises';
import type { MenuGroup } from '../../data/menuGroups';

interface GroupCardProps {
    group: MenuGroup;
    index: number;
    creatorName?: string | null;
    onTap: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    isCustom?: boolean;
}

export const GroupCard: React.FC<GroupCardProps> = ({ group, index, creatorName, onTap, onEdit, onDelete, isCustom }) => {
    const [expanded, setExpanded] = useState(false);
    const totalSec = calculateTotalSeconds(group.exerciseIds);
    const minutes = Math.ceil(totalSec / 60);
    const firstEx = getExerciseById(group.exerciseIds[0]);

    return (
        <motion.div
            className="card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            style={{ padding: 0, overflow: 'hidden' }}
        >
            {/* Main row */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '16px 16px',
                    cursor: 'pointer',
                }}
                onClick={onTap}
            >
                <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 16,
                    background: 'linear-gradient(135deg, #E8F8F0, #FFE5D9)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}>
                    <ExerciseIcon id={firstEx?.id || 'S01'} emoji={group.emoji} size={24} color="#2BBAA0" />
                </div>

                <div style={{ flex: 1 }}>
                    <div style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 16,
                        fontWeight: 700,
                        color: '#2D3436',
                        marginBottom: 2,
                    }}>
                        {group.name}
                        {creatorName && (
                            <span style={{
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
                            }}>
                                👤 {creatorName}
                            </span>
                        )}
                    </div>
                    <div style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 12,
                        color: '#8395A7',
                        display: 'flex',
                        gap: 8,
                        alignItems: 'center',
                    }}>
                        <Clock size={12} />
                        <span>約{minutes}分</span>
                        <span>·</span>
                        <span>{group.exerciseIds.length}種目</span>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    {/* Expand button */}
                    <button
                        onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
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
                        }}
                    >
                        <ChevronDown
                            size={16}
                            color="#B2BEC3"
                            style={{
                                transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
                                transition: 'transform 0.2s ease',
                            }}
                        />
                    </button>
                    {/* Play button */}
                    <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: '#2BBAA0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <Play size={14} color="white" fill="white" />
                    </div>
                </div>
            </div>

            {/* Expanded exercise list */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{ overflow: 'hidden', borderTop: '1px solid rgba(0,0,0,0.05)' }}
                    >
                        <div style={{ padding: '10px 16px 12px' }}>
                            {group.description && (
                                <p style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 12,
                                    color: '#8395A7',
                                    marginBottom: 8,
                                }}>
                                    {group.description}
                                </p>
                            )}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {group.exerciseIds.map((id, i) => {
                                    const ex = getExerciseById(id);
                                    if (!ex) return null;
                                    return (
                                        <span key={`${id}-${i}`} style={{
                                            padding: '4px 10px',
                                            borderRadius: 8,
                                            background: 'rgba(0,0,0,0.04)',
                                            fontFamily: "'Noto Sans JP', sans-serif",
                                            fontSize: 12,
                                            color: '#2D3436',
                                        }}>
                                            {ex.emoji} {ex.name}
                                        </span>
                                    );
                                })}
                            </div>
                            {isCustom && (
                                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onEdit?.(); }}
                                        style={{
                                            padding: '6px 12px',
                                            borderRadius: 8,
                                            border: '1px solid rgba(0,0,0,0.1)',
                                            background: 'white',
                                            cursor: 'pointer',
                                            fontFamily: "'Noto Sans JP', sans-serif",
                                            fontSize: 12,
                                            color: '#8395A7',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 4,
                                        }}
                                    >
                                        <Edit2 size={12} />
                                        へんしゅう
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
                                        style={{
                                            padding: '6px 12px',
                                            borderRadius: 8,
                                            border: 'none',
                                            background: 'rgba(225, 112, 85, 0.08)',
                                            cursor: 'pointer',
                                            fontFamily: "'Noto Sans JP', sans-serif",
                                            fontSize: 12,
                                            color: '#E17055',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 4,
                                        }}
                                    >
                                        <Trash2 size={12} />
                                        さくじょ
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
