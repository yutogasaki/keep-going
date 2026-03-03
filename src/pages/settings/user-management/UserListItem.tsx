import React from 'react';
import { Camera, Edit2, Loader2, Trash2 } from 'lucide-react';
import { CLASS_LEVELS, type ClassLevel } from '../../../data/exercises';
import type { UserProfileStore } from '../../../store/useAppStore';
import { UserAvatar } from '../../../components/UserAvatar';
import { UserEditorForm } from './UserEditorForm';
import type { UserEditorValues } from './types';

interface UserListItemProps {
    user: UserProfileStore;
    totalUsers: number;
    isEditing: boolean;
    editorValues: UserEditorValues;
    uploading: boolean;
    onEditorNameChange: (name: string) => void;
    onEditorClassChange: (classLevel: ClassLevel) => void;
    onCancelEdit: () => void;
    onSaveEdit: () => void;
    onStartEdit: () => void;
    onRequestDelete: () => void;
    onRequestUpload: () => void;
}

export const UserListItem: React.FC<UserListItemProps> = ({
    user,
    totalUsers,
    isEditing,
    editorValues,
    uploading,
    onEditorNameChange,
    onEditorClassChange,
    onCancelEdit,
    onSaveEdit,
    onStartEdit,
    onRequestDelete,
    onRequestUpload,
}) => {
    const classLevel = CLASS_LEVELS.find((item) => item.id === user.classLevel) || CLASS_LEVELS[1];

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            padding: '12px 20px',
            borderBottom: '1px solid rgba(0,0,0,0.04)',
            background: 'transparent',
        }}>
            {isEditing ? (
                <UserEditorForm
                    values={editorValues}
                    submitLabel="保存"
                    onNameChange={onEditorNameChange}
                    onClassChange={onEditorClassChange}
                    onCancel={onCancelEdit}
                    onSubmit={onSaveEdit}
                />
            ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                        onClick={onRequestUpload}
                        style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}
                    >
                        {uploading ? (
                            <div style={{
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                background: '#F0F3F5',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <Loader2 size={18} color="#2BBAA0" style={{ animation: 'spin 1s linear infinite' }} />
                            </div>
                        ) : (
                            <>
                                <UserAvatar avatarUrl={user.avatarUrl} name={user.name} size={40} />
                                <div style={{
                                    position: 'absolute',
                                    bottom: -2,
                                    right: -2,
                                    width: 18,
                                    height: 18,
                                    borderRadius: '50%',
                                    background: '#2BBAA0',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '2px solid white',
                                }}>
                                    <Camera size={9} />
                                </div>
                            </>
                        )}
                    </div>

                    <div style={{ flex: 1 }}>
                        <div style={{
                            fontFamily: "'Noto Sans JP'",
                            fontSize: 15,
                            fontWeight: 700,
                            color: '#2D3436',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                        }}>
                            {user.name}
                        </div>
                        <div style={{
                            fontFamily: "'Noto Sans JP'",
                            fontSize: 12,
                            color: '#8395A7',
                            marginTop: 2,
                        }}>
                            {classLevel.emoji} {classLevel.label}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                        <button
                            onClick={onStartEdit}
                            style={{
                                border: 'none',
                                background: 'rgba(0,0,0,0.05)',
                                padding: 8,
                                borderRadius: 8,
                                color: '#636E72',
                            }}
                        >
                            <Edit2 size={16} />
                        </button>
                        {totalUsers > 1 && (
                            <button
                                onClick={onRequestDelete}
                                style={{
                                    border: 'none',
                                    background: 'rgba(231,76,60,0.1)',
                                    padding: 8,
                                    borderRadius: 8,
                                    color: '#E74C3C',
                                }}
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
