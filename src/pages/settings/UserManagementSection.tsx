import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { ClassLevel } from '../../data/exercises';
import { getTodayKey } from '../../lib/db';
import type { UserProfileStore } from '../../store/useAppStore';
import { resizeImage, uploadAvatar } from '../../lib/avatar';
import { getAccountId } from '../../lib/sync';
import { UserManagementHeader } from './user-management/UserManagementHeader';
import { UserListItem } from './user-management/UserListItem';
import { AddUserButton } from './user-management/AddUserButton';
import { UserEditorForm } from './user-management/UserEditorForm';
import { DeleteUserModal } from './user-management/DeleteUserModal';
import type { NewUserInput } from './user-management/types';
import { FUWAFUWA_TYPE_COUNT } from '../../lib/fuwafuwa';

interface UserManagementSectionProps {
    users: UserProfileStore[];
    onAddUser: (user: NewUserInput) => void;
    onUpdateUser: (id: string, updates: Partial<UserProfileStore>) => void;
    onDeleteUser: (id: string) => void;
}

export const UserManagementSection: React.FC<UserManagementSectionProps> = ({
    users,
    onAddUser,
    onUpdateUser,
    onDeleteUser,
}) => {
    const [showUserManage, setShowUserManage] = useState(false);
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editClass, setEditClass] = useState<ClassLevel>('初級');
    const [deleteConfirmUserId, setDeleteConfirmUserId] = useState<string | null>(null);
    const [uploadingUserId, setUploadingUserId] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const pendingUploadUserIdRef = useRef<string | null>(null);

    const handleAvatarUpload = async (userId: string, file?: File | null) => {
        if (!file) return;

        const accountId = getAccountId();
        if (!accountId) return;

        if (!navigator.onLine) {
            alert('写真をアップロードするにはインターネット接続が必要です');
            return;
        }

        setUploadingUserId(userId);

        try {
            const resized = await resizeImage(file);
            const avatarUrl = await uploadAvatar(accountId, userId, resized);
            onUpdateUser(userId, { avatarUrl });
        } catch (error) {
            console.warn('[avatar] upload failed:', error);
            alert('写真のアップロードに失敗しました');
        } finally {
            setUploadingUserId(null);
        }
    };

    const openCreateUser = () => {
        setEditingUserId('NEW');
        setEditName('');
        setEditClass('初級');
    };

    const openEditUser = (user: UserProfileStore) => {
        setEditingUserId(user.id);
        setEditName(user.name);
        setEditClass(user.classLevel);
    };

    const closeEditor = () => {
        setEditingUserId(null);
    };

    const saveEditedUser = (userId: string) => {
        onUpdateUser(userId, {
            name: editName.trim() || 'ゲスト',
            classLevel: editClass,
        });
        closeEditor();
    };

    const createUser = () => {
        const name = editName.trim() || 'ゲスト';

        onAddUser({
            name,
            classLevel: editClass,
            fuwafuwaBirthDate: getTodayKey(),
            fuwafuwaType: Math.floor(Math.random() * FUWAFUWA_TYPE_COUNT),
            fuwafuwaCycleCount: 1,
            fuwafuwaName: null,
            pastFuwafuwas: [],
            notifiedFuwafuwaStages: [],
            chibifuwas: [],
        });

        closeEditor();
    };

    return (
        <div className="card" style={{ padding: 0, overflow: 'hidden', flexShrink: 0 }}>
            <UserManagementHeader
                userCount={users.length}
                expanded={showUserManage}
                onToggle={() => setShowUserManage((prev) => !prev)}
            />

            {showUserManage && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    style={{ overflow: 'hidden', borderTop: '1px solid rgba(0,0,0,0.06)' }}
                >
                    <div style={{ padding: '8px 0' }}>
                        {users.map((user) => (
                            <UserListItem
                                key={user.id}
                                user={user}
                                totalUsers={users.length}
                                isEditing={editingUserId === user.id}
                                editorValues={{ name: editName, classLevel: editClass }}
                                uploading={uploadingUserId === user.id}
                                onEditorNameChange={setEditName}
                                onEditorClassChange={setEditClass}
                                onCancelEdit={closeEditor}
                                onSaveEdit={() => saveEditedUser(user.id)}
                                onStartEdit={() => openEditUser(user)}
                                onRequestDelete={() => setDeleteConfirmUserId(user.id)}
                                onRequestUpload={() => {
                                    pendingUploadUserIdRef.current = user.id;
                                    fileInputRef.current?.click();
                                }}
                            />
                        ))}

                        {editingUserId !== 'NEW' && (
                            <AddUserButton onClick={openCreateUser} />
                        )}

                        {editingUserId === 'NEW' && (
                            <div style={{ padding: '0 20px 20px', marginTop: 12 }}>
                                <UserEditorForm
                                    values={{ name: editName, classLevel: editClass }}
                                    submitLabel="追加"
                                    submitDisabled={!editName.trim()}
                                    onNameChange={setEditName}
                                    onClassChange={setEditClass}
                                    onCancel={closeEditor}
                                    onSubmit={createUser}
                                />
                            </div>
                        )}
                    </div>
                </motion.div>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(event) => {
                    const userId = pendingUploadUserIdRef.current;
                    if (userId) {
                        handleAvatarUpload(userId, event.target.files?.[0]);
                    }
                    event.target.value = '';
                    pendingUploadUserIdRef.current = null;
                }}
            />

            <DeleteUserModal
                userId={deleteConfirmUserId}
                onCancel={() => setDeleteConfirmUserId(null)}
                onConfirm={(userId) => {
                    onDeleteUser(userId);
                    setDeleteConfirmUserId(null);
                }}
            />
        </div>
    );
};
