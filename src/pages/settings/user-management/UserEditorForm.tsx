import React from 'react';
import { CLASS_LEVELS, type ClassLevel } from '../../../data/exercises';
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
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid #DFE6E9',
                    fontFamily: "'Noto Sans JP'",
                    fontSize: 14,
                }}
            />
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                {CLASS_LEVELS.map((classLevel) => (
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
                        borderRadius: 20,
                        border: 'none',
                        background: '#F0F3F5',
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
                        borderRadius: 20,
                        border: 'none',
                        background: submitEnabled ? '#2BBAA0' : '#B2BEC3',
                        color: 'white',
                        fontWeight: 700,
                    }}
                >
                    {submitLabel}
                </button>
            </div>
        </div>
    );
};
