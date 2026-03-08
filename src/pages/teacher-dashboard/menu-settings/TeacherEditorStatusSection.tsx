import React from 'react';
import { CLASS_LEVELS } from '../../../data/exercises';
import { FONT } from '../../../lib/styles';
import type { MenuSettingStatus } from '../../../lib/teacherMenuSettings';
import type { TeacherEditorStatusOption } from './teacherEditorHelpers';

interface TeacherEditorStatusSectionProps {
    legend: React.ReactNode;
    options: TeacherEditorStatusOption[];
    statusByClass: Record<string, MenuSettingStatus>;
    onStatusChange: (classLevel: string, status: MenuSettingStatus) => void;
}

export const TeacherEditorStatusSection: React.FC<TeacherEditorStatusSectionProps> = ({
    legend,
    options,
    statusByClass,
    onStatusChange,
}) => (
    <>
        <div
            style={{
                display: 'flex',
                gap: 6,
                marginBottom: 10,
                fontFamily: FONT.body,
                fontSize: 10,
                color: '#8395A7',
                flexWrap: 'wrap',
            }}
        >
            {legend}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {CLASS_LEVELS.map((classLevel) => {
                const currentStatus = statusByClass[classLevel.id] || 'optional';
                return (
                    <div
                        key={classLevel.id}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '6px 0',
                            borderBottom: '1px solid rgba(0,0,0,0.04)',
                        }}
                    >
                        <span style={{ fontSize: 14, flexShrink: 0 }}>{classLevel.emoji}</span>
                        <span
                            style={{
                                fontFamily: FONT.body,
                                fontSize: 12,
                                fontWeight: 600,
                                color: '#636E72',
                                width: 36,
                                flexShrink: 0,
                            }}
                        >
                            {classLevel.id}
                        </span>
                        <div style={{ display: 'flex', gap: 4, flex: 1 }}>
                            {options.map((option) => {
                                const isActive = currentStatus === option.status;
                                return (
                                    <button
                                        key={option.status}
                                        type="button"
                                        onClick={() => onStatusChange(classLevel.id, option.status)}
                                        style={{
                                            flex: 1,
                                            padding: '5px 2px',
                                            borderRadius: 8,
                                            border: isActive ? `2px solid ${option.color}` : '2px solid transparent',
                                            background: isActive ? option.bg : '#F8F9FA',
                                            color: isActive ? option.color : '#B2BEC3',
                                            fontFamily: FONT.body,
                                            fontSize: 10,
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            transition: 'all 0.15s ease',
                                        }}
                                    >
                                        {option.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    </>
);
