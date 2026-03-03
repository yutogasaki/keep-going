import React from 'react';
import { ChevronDown } from 'lucide-react';
import { CLASS_EMOJI } from '../../../data/exercises';
import { getTodayKey } from '../../../lib/db';
import type { IndividualStudent } from '../types';
import { StudentCard } from './StudentCard';

interface ClassSectionProps {
    classLevel: string;
    students: IndividualStudent[];
    expanded: boolean;
    onToggle: () => void;
    expandedStudent: string | null;
    onToggleStudent: (id: string) => void;
}

export const ClassSection: React.FC<ClassSectionProps> = ({
    classLevel,
    students,
    expanded,
    onToggle,
    expandedStudent,
    onToggleStudent,
}) => {
    const emoji = CLASS_EMOJI[classLevel] ?? '🎵';
    const activeToday = students.filter((student) => student.lastActiveDate === getTodayKey()).length;

    return (
        <div className="card" style={{ overflow: 'hidden' }}>
            <button
                onClick={onToggle}
                style={{
                    width: '100%',
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                }}
            >
                <span style={{ fontSize: 20 }}>{emoji}</span>
                <span style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 16,
                    fontWeight: 800,
                    color: '#2D3436',
                    flex: 1,
                }}>
                    {classLevel}
                </span>
                <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 13,
                    color: '#8395A7',
                    marginRight: 4,
                }}>
                    {students.length}人
                </span>
                {activeToday > 0 && (
                    <span style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 11,
                        color: '#E17055',
                        background: '#FFF3E0',
                        padding: '2px 6px',
                        borderRadius: 10,
                    }}>
                        🔥{activeToday}
                    </span>
                )}
                <ChevronDown
                    size={16}
                    color="#B2BEC3"
                    style={{
                        transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s',
                        flexShrink: 0,
                    }}
                />
            </button>

            {expanded && (
                <div style={{
                    borderTop: '1px solid #F0F3F5',
                    display: 'flex',
                    flexDirection: 'column',
                }}>
                    {students.map((student, index) => (
                        <StudentCard
                            key={student.memberId}
                            student={student}
                            expanded={expandedStudent === student.memberId}
                            onToggle={() => onToggleStudent(student.memberId)}
                            showBorder={index > 0}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
