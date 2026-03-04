import React from 'react';
import { USER_CLASS_LEVELS, type ClassLevel } from '../../../data/exercises';
import type { UserEditorValues } from './types';

interface UserEditorFormProps {
    values: UserEditorValues;
    submitLabel: string;
    submitDisabled?: boolean;
    onNameChange: (name: string) => void;
    onClassChange: (classLevel: ClassLevel) => void;
    onCancel: () => void;
    onSubmit: () => void;
}

export const UserEditorForm: React.FC<UserEditorFormProps> = ({
    values,
    submitLabel,
    submitDisabled = false,
    onNameChange,
    onClassChange,
    onCancel,
    onSubmit,
}) => {
    const submitEnabled = !submitDisabled;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
                type="text"
                value={values.name}
                onChange={(event) => onNameChange(event.target.value)}
                style={{
                    padding: '14px 18px',
                    borderRadius: 14,
                    border: '1px solid rgba(0,0,0,0.08)',
                    background: '#F8F9FA',
                    fontFamily: "'Noto Sans JP'",
                    fontSize: 14,
                }}
            />
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                {USER_CLASS_LEVELS.map((classLevel) => (
                    <button
                        key={classLevel.id}
                        onClick={() => onClassChange(classLevel.id)}
                        style={{
                            padding: '6px 12px',
                            borderRadius: 20,
                            whiteSpace: 'nowrap',
                            background: values.classLevel === classLevel.id ? '#2BBAA0' : '#F0F3F5',
                            color: values.classLevel === classLevel.id ? 'white' : '#2D3436',
                            border: 'none',
                            fontSize: 12,
                            fontWeight: 700,
                        }}
                    >
                        {classLevel.emoji} {classLevel.label}
                    </button>
                ))}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                    onClick={onCancel}
                    style={{
                        padding: '6px 16px',
                        borderRadius: 14,
                        border: '1px solid #E0E0E0',
                        background: '#fff',
                        fontWeight: 700,
                        color: '#636E72',
                    }}
                >
                    キャンセル
                </button>
                <button
                    onClick={onSubmit}
                    disabled={!submitEnabled}
                    style={{
                        padding: '6px 16px',
                        borderRadius: 14,
                        border: 'none',
                        background: submitEnabled ? '#2BBAA0' : '#DFE6E9',
                        color: submitEnabled ? 'white' : '#B2BEC3',
                        fontWeight: 700,
                        cursor: submitEnabled ? 'pointer' : 'not-allowed',
                    }}
                >
                    {submitLabel}
                </button>
            </div>
        </div>
    );
};
