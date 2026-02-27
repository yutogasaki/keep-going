import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Camera, ChevronRight, Edit2, Loader2, Trash2, UserPlus, Users } from 'lucide-react';
import { CLASS_LEVELS, type ClassLevel } from '../../data/exercises';
import { getTodayKey } from '../../lib/db';
import type { UserProfileStore } from '../../store/useAppStore';
import { UserAvatar } from '../../components/UserAvatar';
import { resizeImage, uploadAvatar } from '../../lib/avatar';
import { getAccountId } from '../../lib/sync';

type NewUserInput = Omit<UserProfileStore, 'id' | 'dailyTargetMinutes' | 'excludedExercises' | 'requiredExercises'>;

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
            const url = await uploadAvatar(accountId, userId, resized);
            onUpdateUser(userId, { avatarUrl: url });
        } catch (err) {
            console.warn('[avatar] upload failed:', err);
            alert('写真のアップロードに失敗しました');
        } finally {
            setUploadingUserId(null);
        }
    };

    return (
        <div className="card" style={{ padding: 0, overflow: 'hidden', flexShrink: 0 }}>
            <div
                onClick={() => setShowUserManage(!showUserManage)}
                style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '16px 20px',
                    cursor: 'pointer',
                }}
            >
                <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #E8F8F0, #D4F0E7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                }}>
                    <Users size={20} color="#2BBAA0" />
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 14,
                        fontWeight: 700,
                        color: '#2D3436',
                    }}>ユーザー・クラス設定</div>
                    <div style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 12,
                        color: '#8395A7',
                    }}>{users.length}人のユーザーが登録されています</div>
                </div>
                <ChevronRight size={18} color="#B2BEC3" style={{
                    transform: showUserManage ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                }} />
            </div>

            {showUserManage && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    style={{ overflow: 'hidden', borderTop: '1px solid rgba(0,0,0,0.06)' }}
                >
                    <div style={{ padding: '8px 0' }}>
                        {users.map(u => {
                            const uClass = CLASS_LEVELS.find(c => c.id === u.classLevel) || CLASS_LEVELS[1];
                            const isEditing = editingUserId === u.id;

                            return (
                                <div key={u.id} style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    padding: '12px 20px',
                                    borderBottom: '1px solid rgba(0,0,0,0.04)',
                                    background: 'transparent',
                                }}>
                                    {isEditing ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={e => setEditName(e.target.value)}
                                                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #DFE6E9', fontFamily: "'Noto Sans JP'", fontSize: 14 }}
                                            />
                                            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                                                {CLASS_LEVELS.map(c => (
                                                    <button
                                                        key={c.id}
                                                        onClick={() => setEditClass(c.id)}
                                                        style={{
                                                            padding: '6px 12px',
                                                            borderRadius: 20,
                                                            whiteSpace: 'nowrap',
                                                            background: editClass === c.id ? '#2BBAA0' : '#F0F3F5',
                                                            color: editClass === c.id ? 'white' : '#2D3436',
                                                            border: 'none',
                                                            fontSize: 12,
                                                            fontWeight: 700,
                                                        }}
                                                    >
                                                        {c.emoji} {c.label}
                                                    </button>
                                                ))}
                                            </div>
                                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                                <button onClick={() => setEditingUserId(null)} style={{ padding: '6px 16px', borderRadius: 20, border: 'none', background: '#F0F3F5', fontWeight: 700, color: '#636E72' }}>キャンセル</button>
                                                <button
                                                    onClick={() => {
                                                        onUpdateUser(u.id, { name: editName.trim() || 'ゲスト', classLevel: editClass });
                                                        setEditingUserId(null);
                                                    }}
                                                    style={{ padding: '6px 16px', borderRadius: 20, border: 'none', background: '#2BBAA0', color: 'white', fontWeight: 700 }}
                                                >
                                                    保存
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            {/* Avatar with upload */}
                                            <div
                                                onClick={() => {
                                                    pendingUploadUserIdRef.current = u.id;
                                                    fileInputRef.current?.click();
                                                }}
                                                style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}
                                            >
                                                {uploadingUserId === u.id ? (
                                                    <div style={{
                                                        width: 40, height: 40, borderRadius: '50%',
                                                        background: '#F0F3F5',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    }}>
                                                        <Loader2 size={18} color="#2BBAA0" style={{ animation: 'spin 1s linear infinite' }} />
                                                    </div>
                                                ) : (
                                                    <>
                                                        <UserAvatar avatarUrl={u.avatarUrl} name={u.name} size={40} />
                                                        <div style={{
                                                            position: 'absolute', bottom: -2, right: -2,
                                                            width: 18, height: 18, borderRadius: '50%',
                                                            background: '#2BBAA0', color: 'white',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            border: '2px solid white',
                                                        }}>
                                                            <Camera size={9} />
                                                        </div>
                                                    </>
                                                )}
                                            </div>

                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontFamily: "'Noto Sans JP'", fontSize: 15, fontWeight: 700, color: '#2D3436', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    {u.name}
                                                </div>
                                                <div style={{ fontFamily: "'Noto Sans JP'", fontSize: 12, color: '#8395A7', marginTop: 2 }}>
                                                    {uClass.emoji} {uClass.label}
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button
                                                    onClick={() => {
                                                        setEditingUserId(u.id);
                                                        setEditName(u.name);
                                                        setEditClass(u.classLevel);
                                                    }}
                                                    style={{ border: 'none', background: 'rgba(0,0,0,0.05)', padding: 8, borderRadius: 8, color: '#636E72' }}
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                {users.length > 1 && (
                                                    <button onClick={() => setDeleteConfirmUserId(u.id)} style={{ border: 'none', background: 'rgba(231,76,60,0.1)', padding: 8, borderRadius: 8, color: '#E74C3C' }}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {editingUserId !== 'NEW' && (
                            <button
                                onClick={() => {
                                    setEditingUserId('NEW');
                                    setEditName('');
                                    setEditClass('初級');
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    justifyContent: 'center',
                                    width: 'calc(100% - 40px)',
                                    margin: '12px auto',
                                    padding: '12px',
                                    borderRadius: 12,
                                    border: '2px dashed #2BBAA0',
                                    background: 'rgba(43,186,160,0.05)',
                                    color: '#2BBAA0',
                                    fontFamily: "'Noto Sans JP'",
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                }}
                            >
                                <UserPlus size={18} />
                                新しいユーザーを追加
                            </button>
                        )}

                        {editingUserId === 'NEW' && (
                            <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
                                <input
                                    type="text"
                                    placeholder="おなまえ"
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #DFE6E9', fontFamily: "'Noto Sans JP'", fontSize: 14 }}
                                />
                                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                                    {CLASS_LEVELS.map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => setEditClass(c.id)}
                                            style={{
                                                padding: '6px 12px',
                                                borderRadius: 20,
                                                whiteSpace: 'nowrap',
                                                background: editClass === c.id ? '#2BBAA0' : '#F0F3F5',
                                                color: editClass === c.id ? 'white' : '#2D3436',
                                                border: 'none',
                                                fontSize: 12,
                                                fontWeight: 700,
                                            }}
                                        >
                                            {c.emoji} {c.label}
                                        </button>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                    <button onClick={() => setEditingUserId(null)} style={{ padding: '6px 16px', borderRadius: 20, border: 'none', background: '#F0F3F5', fontWeight: 700, color: '#636E72' }}>キャンセル</button>
                                    <button
                                        onClick={() => {
                                            const name = editName.trim() || 'ゲスト';
                                            onAddUser({
                                                name,
                                                classLevel: editClass,
                                                fuwafuwaBirthDate: getTodayKey(),
                                                fuwafuwaType: Math.floor(Math.random() * 10),
                                                fuwafuwaCycleCount: 1,
                                                fuwafuwaName: null,
                                                pastFuwafuwas: [],
                                                notifiedFuwafuwaStages: [],
                                            });
                                            setEditingUserId(null);
                                        }}
                                        disabled={!editName.trim()}
                                        style={{ padding: '6px 16px', borderRadius: 20, border: 'none', background: editName.trim() ? '#2BBAA0' : '#B2BEC3', color: 'white', fontWeight: 700 }}
                                    >
                                        追加
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            )}

            {/* Hidden file input shared across all avatar uploads */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                    const userId = pendingUploadUserIdRef.current;
                    if (userId) {
                        handleAvatarUpload(userId, e.target.files?.[0]);
                    }
                    e.target.value = '';
                    pendingUploadUserIdRef.current = null;
                }}
            />

            {deleteConfirmUserId && createPortal(
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.4)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 100000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        style={{
                            background: 'white',
                            borderRadius: 24,
                            padding: 24,
                            width: 'calc(100% - 64px)',
                            maxWidth: 320,
                            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                        }}
                    >
                        <h3 style={{
                            margin: '0 0 12px 0',
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 18,
                            fontWeight: 700,
                            color: '#2D3436',
                            textAlign: 'center',
                        }}>
                            ユーザーの削除
                        </h3>
                        <p style={{
                            margin: '0 0 24px 0',
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 14,
                            color: '#636E72',
                            textAlign: 'center',
                            lineHeight: 1.5,
                        }}>
                            本当に削除しますか？<br />この操作は取り消せません。
                        </p>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button
                                onClick={() => setDeleteConfirmUserId(null)}
                                style={{
                                    flex: 1,
                                    padding: '14px',
                                    borderRadius: 16,
                                    border: 'none',
                                    background: '#F0F3F5',
                                    color: '#636E72',
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 15,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                }}
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={() => {
                                    onDeleteUser(deleteConfirmUserId);
                                    setDeleteConfirmUserId(null);
                                }}
                                style={{
                                    flex: 1,
                                    padding: '14px',
                                    borderRadius: 16,
                                    border: 'none',
                                    background: '#E74C3C',
                                    color: 'white',
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 15,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                }}
                            >
                                削除する
                            </button>
                        </div>
                    </motion.div>
                </div>,
                document.body,
            )}
        </div>
    );
};
