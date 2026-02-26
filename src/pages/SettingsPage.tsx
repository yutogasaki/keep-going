import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown, Trash2, Volume2, Mic, Bell, Clock, X, HelpCircle, Music, Smartphone, RotateCcw, RefreshCw, Bug, Users, UserPlus, Edit2 } from 'lucide-react';
import { clearAllData, getDateKeyOffset } from '../lib/db';
import { useAppStore } from '../store/useAppStore';
import { PageHeader } from '../components/PageHeader';
import { CurrentContextBadge } from '../components/CurrentContextBadge';
import { audio } from '../lib/audio';
import type { ClassLevel } from '../data/exercises';

const CLASS_LEVELS: { id: ClassLevel; label: string; emoji: string }[] = [
    { id: 'プレ', label: 'プレバレエ', emoji: '🐣' },
    { id: '初級', label: '初級', emoji: '🌱' },
    { id: '中級', label: '中級', emoji: '🌸' },
    { id: '上級', label: '上級', emoji: '⭐' },
];

// ─── Help Data ─────────────────────────────────

interface HelpItemData {
    id: string;
    q: string;
    a: string;
}

interface HelpSectionData {
    title: string;
    emoji: string;
    items: HelpItemData[];
}

const HELP_SECTIONS: HelpSectionData[] = [
    {
        title: 'はじめかた',
        emoji: '📱',
        items: [
            {
                id: 'start-1',
                q: 'KeepGoingってどんなアプリ？',
                a: '考えずに毎日ストレッチを続けるためのアプリです。ホーム画面のSTARTボタンを押すだけで、あなたのレベルに合ったメニューが自動で再生されます。',
            },
            {
                id: 'start-2',
                q: '最初に何をすればいい？',
                a: 'ホーム画面の中央にあるSTARTを押すか、メニュー画面から好きなメニューを選んでスタートしましょう。ホーム画面を横にスワイプすると、家族の分や「みんなで！」モードに変更できます。',
            },
            {
                id: 'start-3',
                q: 'クラス（レベル）って何？',
                a: 'プレバレエ🐣・初級🌱・中級🌸・上級⭐の4段階があります。クラスによって出てくる種目の種類や難易度が変わります。設定ページからいつでも変更できます。',
            },
        ],
    },
    {
        title: 'ストレッチ中の操作',
        emoji: '🎯',
        items: [
            {
                id: 'session-1',
                q: '操作方法は？',
                a: '画面を上にスワイプ → スキップ（次の種目へ）\n画面を下にスワイプ → ひとつ前の種目に戻る\n画面をタップ → 一時停止／再開\n\n画面下部のボタンからもスキップやミュートが操作できます。',
            },
            {
                id: 'session-2',
                q: '途中でやめるには？',
                a: '画面をタップして一時停止してから、右上の✕ボタンで終了できます。途中でやめても、そこまでの進捗は記録に残ります。',
            },
            {
                id: 'session-3',
                q: '前の種目にもどれる？',
                a: '画面を下にスワイプすると、ひとつ前の種目に戻れます。セッションの最初の種目では戻れません。',
            },
        ],
    },
    {
        title: '音と振動',
        emoji: '🔊',
        items: [
            {
                id: 'audio-1',
                q: 'BGMとは？',
                a: 'ストレッチ中に流れるやさしいアンビエント音楽です。リラックスしながらストレッチできます。設定ページからオン・オフを切り替えられます。',
            },
            {
                id: 'audio-2',
                q: '音声ガイダンスとは？',
                a: '種目名の読み上げ、残り時間のカウントダウン、左右の切り替えなどを声でお知らせする機能です。設定ページからオン・オフを切り替えられます。',
            },
            {
                id: 'audio-3',
                q: '振動はオフにできる？',
                a: 'はい、設定ページの「振動フィードバック」をオフにするとバイブレーションが止まります。なお、振動機能はデバイスによって対応状況が異なります。',
            },
        ],
    },
    {
        title: 'メニューとおまかせ',
        emoji: '📋',
        items: [
            {
                id: 'menu-1',
                q: 'おまかせメニューとは？',
                a: 'ホーム画面のSTARTで始まる自動生成メニュー群です。メニュー画面の「カスタマイズ」タブにある「おまかせの設定」から、1日の目標時間の変更や、必須（優先的に入る）・除外（絶対に入らない）する種目を設定できます。',
            },
            {
                id: 'menu-2',
                q: 'セットメニューとは？',
                a: 'メニュー画面の「セット」タブにある、あらかじめ用意されたメニューです。「基本ストレッチ」「開脚じゅうてん」「体幹つよくなる」「バレエのまえに」「ぜんぶやる」の5種類があります。',
            },
            {
                id: 'menu-3',
                q: 'じぶんのメニューを作るには？',
                a: 'メニュー画面の「セット」タブで「じぶんでつくる」ボタンを押すと、好きな種目を組み合わせてオリジナルメニューを作成できます。',
            },
            {
                id: 'menu-4',
                q: 'じぶん種目とは？',
                a: 'メニュー画面の「カスタマイズ」タブで、名前・時間・絵文字・左右分割を設定してオリジナルのストレッチ種目を作成できます。作った種目はメニューにも追加できます。',
            },
            {
                id: 'menu-5',
                q: 'プレクラスで体幹メニューが出ない',
                a: '無理なく続けられるよう、プレクラスでは初期設定でプランク等の体幹メニューを「除外」にしています。やってみたい場合は「カスタマイズ」タブの「おまかせの設定」から「⚪ おまかせ」や「★ 必須」に変更してください。',
            },
        ],
    },
    {
        title: 'きろくとストリーク',
        emoji: '📊',
        items: [
            {
                id: 'record-1',
                q: '記録はどうやって見るの？',
                a: '画面下の「きろく」タブで確認できます。ホーム画面で「個人」を選んでいるときはその人の記録だけ、「みんなで！」を選んでいるときは家族全体の合計記録が表示されます。',
            },
            {
                id: 'record-2',
                q: '「みんなで！」のタンクの仕組みは？',
                a: '「みんなで！」モードでは、魔法のタンクや目標時間は「家族全員の合計（目標時間×人数分）」になります。自分の分だけでなく、家族が頑張った分もタンクに貯まっていきます。',
            },
            {
                id: 'record-3',
                q: 'ホーム画面のリング（進捗）は？',
                a: '1日の目標時間に対する進捗を表しています。リングが1周するとタンクが満タンになります。目標時間はメニュー画面の「おまかせの設定」から変更できます（初期値は10分）。毎日リセットされます。',
            },
            {
                id: 'record-4',
                q: 'ストリーク（連続日数）の仕組みは？',
                a: '毎日1回以上ストレッチをすると日数が増え、1日でも休むとリセットされます。ストリークは各ユーザーごとに個別に計算されます。',
            },
        ],
    },
    {
        title: '休憩と終了のしくみ',
        emoji: '☕',
        items: [
            {
                id: 'break-1',
                q: '休憩はいつ入る？',
                a: '約5分ごとに短い休憩（小休憩）、約15分ごとに長い休憩（大休憩）が入ります。1番短いメニューでは休憩は入りません。',
            },
            {
                id: 'break-2',
                q: 'いつ終わるの？',
                a: 'あらかじめ設定された「目標時間（初期設定は10分）」分のメニューを完走した時点で終了となります。「おつかれさま」画面が出たら、今日はおしまいです！',
            },
        ],
    },
    {
        title: 'ホーム画面への追加',
        emoji: '📲',
        items: [
            {
                id: 'install-1',
                q: 'ホーム画面に追加するとどうなるの？',
                a: 'KeepGoingをスマホのホーム画面に追加すると、アプリのようにアイコンから直接起動できます。ブラウザのアドレスバーも表示されないので、より快適に使えます。',
            },
            {
                id: 'install-2',
                q: 'iPhone／iPadで追加するには？（Safari）',
                a: '1. Safariで KeepGoing を開く\n2. 画面下の共有ボタン（□に↑のアイコン）をタップ\n3. 「ホーム画面に追加」を選ぶ\n4. 右上の「追加」をタップ\n\n※ Safari以外のブラウザ（Chrome等）では追加できません。必ずSafariをお使いください。',
            },
            {
                id: 'install-3',
                q: 'Androidで追加するには？（Chrome）',
                a: '1. Chromeで KeepGoing を開く\n2. 右上の「︙」メニューをタップ\n3. 「ホーム画面に追加」または「アプリをインストール」を選ぶ\n4. 「追加」をタップ\n\n※ 「アプリをインストール」と表示される場合もあります。',
            },
            {
                id: 'install-4',
                q: 'パソコンで追加するには？（Chrome／Edge）',
                a: 'Chrome：アドレスバー右側のインストールアイコン（＋マーク）をクリック → 「インストール」\n\nEdge：アドレスバー右側の「…」→「アプリ」→「このサイトをアプリとしてインストール」',
            },
        ],
    },
    {
        title: 'データとプライバシー',
        emoji: '🔒',
        items: [
            {
                id: 'data-1',
                q: 'データはどこに保存される？',
                a: 'すべてのデータはお使いのデバイスにのみ保存されます。アカウント登録やクラウド同期はなく、データが外部に送信されることはありません。',
            },
            {
                id: 'data-2',
                q: 'データをリセットするとどうなる？',
                a: 'すべての記録・設定・カスタム種目・カスタムメニューが削除され、最初からやり直しになります。この操作は元に戻せません。',
            },
            {
                id: 'data-3',
                q: '「今日」の区切りはいつ？',
                a: '午前3時が1日の区切りです。深夜0時〜2時台のストレッチは「前日分」としてカウントされるので、夜ふかしストレッチも安心です。',
            },
        ],
    },
];

// ─── Help Sub-components ─────────────────────────────────

const HelpItem: React.FC<{
    item: HelpItemData;
    isOpen: boolean;
    onToggle: () => void;
}> = ({ item, isOpen, onToggle }) => (
    <div style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
        <button
            onClick={onToggle}
            style={{
                width: '100%',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                padding: '14px 0',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                color: '#2D3436',
            }}
        >
            <span style={{
                fontFamily: "'Noto Sans JP', sans-serif",
                fontSize: 13,
                fontWeight: 700,
                color: '#2BBAA0',
                flexShrink: 0,
                marginTop: 1,
            }}>Q:</span>
            <span style={{
                fontFamily: "'Noto Sans JP', sans-serif",
                fontSize: 13,
                fontWeight: 600,
                color: '#2D3436',
                flex: 1,
                lineHeight: 1.5,
            }}>{item.q}</span>
            <ChevronDown
                size={16}
                color="#B2BEC3"
                style={{
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                    flexShrink: 0,
                    marginTop: 2,
                }}
            />
        </button>
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ overflow: 'hidden' }}
                >
                    <div style={{
                        padding: '0 0 14px 22px',
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 13,
                        color: '#636E72',
                        lineHeight: 1.7,
                        whiteSpace: 'pre-line',
                    }}>
                        {item.a}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
);

// ─── Toggle Button Component ─────────────────────────────────

const ToggleButton: React.FC<{
    enabled: boolean;
    onToggle: () => void;
    color: string;
}> = ({ enabled, onToggle, color }) => (
    <button
        onClick={onToggle}
        style={{
            width: 44,
            height: 24,
            borderRadius: 12,
            background: enabled ? color : '#DFE6E9',
            border: 'none',
            position: 'relative',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            padding: 2,
            transition: 'background 0.3s ease',
            flexShrink: 0,
        }}
    >
        <motion.div
            animate={{ x: enabled ? 20 : 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            style={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: 'white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
        />
    </button>
);

// ─── Main Component ─────────────────────────────────

export const SettingsPage: React.FC = () => {
    const users = useAppStore(s => s.users);
    const addUser = useAppStore(s => s.addUser);
    const updateUser = useAppStore(s => s.updateUser);
    const deleteUser = useAppStore(s => s.deleteUser);

    // Settings state
    const soundVolume = useAppStore(s => s.soundVolume);
    const setSoundVolume = useAppStore(s => s.setSoundVolume);
    const ttsEnabled = useAppStore(s => s.ttsEnabled);
    const setTtsEnabled = useAppStore(s => s.setTtsEnabled);
    const bgmEnabled = useAppStore(s => s.bgmEnabled);
    const setBgmEnabled = useAppStore(s => s.setBgmEnabled);
    const hapticEnabled = useAppStore(s => s.hapticEnabled);
    const setHapticEnabled = useAppStore(s => s.setHapticEnabled);
    const notificationsEnabled = useAppStore(s => s.notificationsEnabled);
    const setNotificationsEnabled = useAppStore(s => s.setNotificationsEnabled);
    const notificationTime = useAppStore(s => s.notificationTime);
    const setNotificationTime = useAppStore(s => s.setNotificationTime);
    const setOnboardingCompleted = useAppStore(s => s.setOnboardingCompleted);

    const [showUserManage, setShowUserManage] = useState(false);
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editClass, setEditClass] = useState<ClassLevel>('初級');
    const [deleteConfirmUserId, setDeleteConfirmUserId] = useState<string | null>(null);
    const [showConfirmReset, setShowConfirmReset] = useState(false);
    const [showConfirmRedo, setShowConfirmRedo] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [openHelpItems, setOpenHelpItems] = useState<Set<string>>(new Set());
    const [showDeveloperDebug, setShowDeveloperDebug] = useState(false);
    const [showDevPasswordModal, setShowDevPasswordModal] = useState(false);
    const [devPasswordInput, setDevPasswordInput] = useState('');

    // Subscribe to debug state reactively (so selects re-render on change)
    const debugFuwafuwaType = useAppStore(s => s.debugFuwafuwaType);
    const debugFuwafuwaStage = useAppStore(s => s.debugFuwafuwaStage);
    const debugFuwafuwaScale = useAppStore(s => s.debugFuwafuwaScale);
    const debugActiveDays = useAppStore(s => s.debugActiveDays);

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setSoundVolume(val);
        // Play tick to preview volume
        audio.playTick();
    };

    const requestNotificationPermission = async (enable: boolean) => {
        if (!enable) {
            setNotificationsEnabled(false);
            return;
        }

        if (!('Notification' in window)) {
            alert('お使いのブラウザは通知に対応していません。');
            return;
        }

        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            setNotificationsEnabled(true);
        } else {
            alert('通知が許可されていません。ブラウザの設定をご確認ください。');
            setNotificationsEnabled(false);
        }
    };

    const handleReset = async () => {
        await clearAllData();
        setShowConfirmReset(false);
        window.location.reload();
    };

    const handleRedoOnboarding = () => {
        setOnboardingCompleted(false);
        setShowConfirmRedo(false);
        // Using slight delay to allow React state to settle if needed, or simply relying on App.tsx to remount
        setTimeout(() => {
            window.location.reload();
        }, 50);
    };

    const toggleHelpItem = (id: string) => {
        setOpenHelpItems(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };



    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            paddingBottom: 100,
        }}>
            <PageHeader
                title="せってい"
                rightElement={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button
                            onClick={async () => {
                                if ('serviceWorker' in navigator) {
                                    const registrations = await navigator.serviceWorker.getRegistrations();
                                    for (const reg of registrations) {
                                        await reg.update();
                                    }
                                }
                                if ('caches' in window) {
                                    const names = await caches.keys();
                                    for (const name of names) {
                                        await caches.delete(name);
                                    }
                                }
                                window.location.reload();
                            }}
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: '50%',
                                border: 'none',
                                background: '#F0F3F5',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: '#8395A7',
                            }}
                            title="アプリを最新版に更新"
                        >
                            <RefreshCw size={16} />
                        </button>
                        <CurrentContextBadge />
                    </div>
                }
            />

            <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* User Management */}
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
                            }}>{users?.length || 0}人のユーザーが登録されています</div>
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
                            {/* List Users */}
                            <div style={{ padding: '8px 0' }}>
                                {users && users.map(u => {
                                    const uClass = CLASS_LEVELS.find(c => c.id === u.classLevel) || CLASS_LEVELS[1];
                                    const isEditing = editingUserId === u.id;

                                    return (
                                        <div key={u.id} style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            padding: '12px 20px',
                                            borderBottom: '1px solid rgba(0,0,0,0.04)',
                                            background: 'transparent'
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
                                                                    padding: '6px 12px', borderRadius: 20, whiteSpace: 'nowrap',
                                                                    background: editClass === c.id ? '#2BBAA0' : '#F0F3F5',
                                                                    color: editClass === c.id ? 'white' : '#2D3436',
                                                                    border: 'none', fontSize: 12, fontWeight: 700
                                                                }}
                                                            >
                                                                {c.emoji} {c.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                                        <button onClick={() => setEditingUserId(null)} style={{ padding: '6px 16px', borderRadius: 20, border: 'none', background: '#F0F3F5', fontWeight: 700, color: '#636E72' }}>キャンセル</button>
                                                        <button onClick={() => {
                                                            updateUser(u.id, { name: editName.trim() || 'ゲスト', classLevel: editClass });
                                                            setEditingUserId(null);
                                                        }} style={{ padding: '6px 16px', borderRadius: 20, border: 'none', background: '#2BBAA0', color: 'white', fontWeight: 700 }}>保存</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontFamily: "'Noto Sans JP'", fontSize: 15, fontWeight: 700, color: '#2D3436', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            {u.name}
                                                        </div>
                                                        <div style={{ fontFamily: "'Noto Sans JP'", fontSize: 12, color: '#8395A7', marginTop: 2 }}>
                                                            {uClass.emoji} {uClass.label}
                                                        </div>
                                                    </div>

                                                    <div style={{ display: 'flex', gap: 8 }}>
                                                        <button onClick={() => {
                                                            setEditingUserId(u.id);
                                                            setEditName(u.name);
                                                            setEditClass(u.classLevel);
                                                        }} style={{ border: 'none', background: 'rgba(0,0,0,0.05)', padding: 8, borderRadius: 8, color: '#636E72' }}>
                                                            <Edit2 size={16} />
                                                        </button>
                                                        {(users?.length || 0) > 1 && (
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

                                {/* Add User Button */}
                                {editingUserId !== 'NEW' && (
                                    <button
                                        onClick={() => {
                                            setEditingUserId('NEW');
                                            setEditName('');
                                            setEditClass('初級');
                                        }}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center',
                                            width: 'calc(100% - 40px)', margin: '12px auto', padding: '12px',
                                            borderRadius: 12, border: '2px dashed #2BBAA0', background: 'rgba(43,186,160,0.05)',
                                            color: '#2BBAA0', fontFamily: "'Noto Sans JP'", fontWeight: 700, cursor: 'pointer'
                                        }}
                                    >
                                        <UserPlus size={18} />
                                        新しいユーザーを追加
                                    </button>
                                )}

                                {/* New User Form Inline */}
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
                                                        padding: '6px 12px', borderRadius: 20, whiteSpace: 'nowrap',
                                                        background: editClass === c.id ? '#2BBAA0' : '#F0F3F5',
                                                        color: editClass === c.id ? 'white' : '#2D3436',
                                                        border: 'none', fontSize: 12, fontWeight: 700
                                                    }}
                                                >
                                                    {c.emoji} {c.label}
                                                </button>
                                            ))}
                                        </div>
                                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                            <button onClick={() => setEditingUserId(null)} style={{ padding: '6px 16px', borderRadius: 20, border: 'none', background: '#F0F3F5', fontWeight: 700, color: '#636E72' }}>キャンセル</button>
                                            <button onClick={() => {
                                                const name = editName.trim() || 'ゲスト';
                                                addUser({
                                                    name,
                                                    classLevel: editClass,
                                                    fuwafuwaBirthDate: new Date().toISOString().split('T')[0],
                                                    fuwafuwaType: Math.floor(Math.random() * 10),
                                                    fuwafuwaCycleCount: 1,
                                                    fuwafuwaName: null,
                                                    pastFuwafuwas: [],
                                                    notifiedFuwafuwaStages: []
                                                });
                                                setEditingUserId(null);
                                            }} disabled={!editName.trim()} style={{ padding: '6px 16px', borderRadius: 20, border: 'none', background: editName.trim() ? '#2BBAA0' : '#B2BEC3', color: 'white', fontWeight: 700 }}>追加</button>
                                        </div>
                                    </div>
                                )}

                            </div>
                        </motion.div>
                    )}
                    {/* User Delete Confirmation Modal */}
                    {deleteConfirmUserId && createPortal(
                        <div style={{
                            position: 'fixed',
                            top: 0, left: 0, right: 0, bottom: 0,
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
                                    textAlign: 'center'
                                }}>ユーザーの削除</h3>
                                <p style={{
                                    margin: '0 0 24px 0',
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 14,
                                    color: '#636E72',
                                    textAlign: 'center',
                                    lineHeight: 1.5
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
                                            cursor: 'pointer'
                                        }}
                                    >
                                        キャンセル
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (deleteConfirmUserId) {
                                                deleteUser(deleteConfirmUserId);
                                                setDeleteConfirmUserId(null);
                                            }
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
                                            cursor: 'pointer'
                                        }}
                                    >
                                        削除する
                                    </button>
                                </div>
                            </motion.div>
                        </div>,
                        document.body
                    )}
                </div>

                {/* Audio Settings */}
                <div className="card" style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                            <div style={{
                                width: 32,
                                height: 32,
                                borderRadius: 10,
                                background: 'rgba(43, 186, 160, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <Volume2 size={16} color="#2BBAA0" />
                            </div>
                            <div style={{
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 14,
                                fontWeight: 700,
                                color: '#2D3436',
                            }}>音量</div>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={soundVolume}
                            onChange={handleVolumeChange}
                            style={{
                                width: '100%',
                                accentColor: '#2BBAA0',
                            }}
                        />
                    </div>

                    <div style={{
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: '1px solid rgba(0,0,0,0.06)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                                width: 32,
                                height: 32,
                                borderRadius: 10,
                                background: 'rgba(225, 112, 85, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <Mic size={16} color="#E17055" />
                            </div>
                            <div>
                                <div style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 14,
                                    fontWeight: 700,
                                    color: '#2D3436',
                                }}>音声ガイダンス</div>
                                <div style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 11,
                                    color: '#8395A7',
                                    marginTop: 2,
                                }}>残り時間などを声でお知らせ</div>
                            </div>
                        </div>
                        <ToggleButton
                            enabled={ttsEnabled}
                            onToggle={() => {
                                const next = !ttsEnabled;
                                setTtsEnabled(next);
                                if (next) {
                                    audio.initTTS();
                                    audio.speak('音声ガイダンスをオンにしました');
                                }
                            }}
                            color="#2BBAA0"
                        />
                    </div>

                    {/* BGM Toggle */}
                    <div style={{
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                                width: 32,
                                height: 32,
                                borderRadius: 10,
                                background: 'rgba(108, 92, 231, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <Music size={16} color="#6C5CE7" />
                            </div>
                            <div>
                                <div style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 14,
                                    fontWeight: 700,
                                    color: '#2D3436',
                                }}>BGM</div>
                                <div style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 11,
                                    color: '#8395A7',
                                    marginTop: 2,
                                }}>ストレッチ中のBGM</div>
                            </div>
                        </div>
                        <ToggleButton
                            enabled={bgmEnabled}
                            onToggle={() => setBgmEnabled(!bgmEnabled)}
                            color="#6C5CE7"
                        />
                    </div>
                </div>

                {/* Feedback Settings */}
                <div className="card" style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
                    <div style={{
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                                width: 32,
                                height: 32,
                                borderRadius: 10,
                                background: 'rgba(253, 203, 110, 0.15)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <Smartphone size={16} color="#E17055" />
                            </div>
                            <div>
                                <div style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 14,
                                    fontWeight: 700,
                                    color: '#2D3436',
                                }}>振動フィードバック</div>
                                <div style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 11,
                                    color: '#8395A7',
                                    marginTop: 2,
                                }}>対応デバイスのみ</div>
                            </div>
                        </div>
                        <ToggleButton
                            enabled={hapticEnabled}
                            onToggle={() => setHapticEnabled(!hapticEnabled)}
                            color="#FDCB6E"
                        />
                    </div>
                </div>

                {/* Notifications Settings */}
                <div className="card" style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
                    <div style={{
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: notificationsEnabled ? '1px solid rgba(0,0,0,0.06)' : 'none',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                                width: 32,
                                height: 32,
                                borderRadius: 10,
                                background: 'rgba(9, 132, 227, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <Bell size={16} color="#0984e3" />
                            </div>
                            <div>
                                <div style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 14,
                                    fontWeight: 700,
                                    color: '#2D3436',
                                }}>まいにち通知</div>
                                <div style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 11,
                                    color: '#8395A7',
                                    marginTop: 2,
                                }}>忘れないようにリマインド</div>
                            </div>
                        </div>
                        <ToggleButton
                            enabled={notificationsEnabled}
                            onToggle={() => requestNotificationPermission(!notificationsEnabled)}
                            color="#0984e3"
                        />
                    </div>

                    {notificationsEnabled && (
                        <div style={{
                            padding: '16px 20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 32, display: 'flex', justifyContent: 'center' }}>
                                    <Clock size={16} color="#B2BEC3" />
                                </div>
                                <div style={{
                                    fontFamily: "'Noto Sans JP', sans-serif",
                                    fontSize: 14,
                                    fontWeight: 700,
                                    color: '#2D3436',
                                }}>お知らせ時間</div>
                            </div>
                            <input
                                type="time"
                                value={notificationTime}
                                onChange={(e) => setNotificationTime(e.target.value)}
                                style={{
                                    border: '1px solid rgba(0,0,0,0.1)',
                                    borderRadius: 8,
                                    padding: '6px 12px',
                                    fontFamily: "'Outfit', sans-serif",
                                    fontSize: 16,
                                    fontWeight: 600,
                                    color: '#2D3436',
                                    background: '#F8F9FA',
                                    outline: 'none',
                                }}
                            />
                        </div>
                    )}
                </div>

                {/* Help */}
                <div
                    className="card"
                    onClick={() => setShowHelp(true)}
                    style={{
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
                        background: 'linear-gradient(135deg, #E8F8F0, #F0F8FF)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 20,
                        flexShrink: 0,
                    }}>
                        <HelpCircle size={22} color="#2BBAA0" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 14,
                            fontWeight: 700,
                            color: '#2D3436',
                        }}>ヘルプと使い方</div>
                        <div style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 12,
                            color: '#8395A7',
                        }}>よくある質問や操作について</div>
                    </div>
                    <ChevronRight size={18} color="#B2BEC3" />
                </div>

                {/* App info */}
                <div className="card card-sm" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                }}>
                    <div style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 14,
                        fontWeight: 700,
                        color: '#2D3436',
                    }}>
                        アプリ情報
                    </div>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 13,
                    }}>
                        <span style={{ color: '#8395A7' }}>バージョン</span>
                        <span style={{ color: '#2D3436', fontFamily: "'Outfit', sans-serif", fontWeight: 600 }}>0.1.0</span>
                    </div>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 13,
                    }}>
                        <span style={{ color: '#8395A7' }}>KeepGoing</span>
                        <span style={{ color: '#B2BEC3', fontSize: 11 }}>今日のちょっとが、未来のちからに。</span>
                    </div>
                </div>

                {/* Re-do onboarding */}
                <div
                    className="card card-sm"
                    onClick={() => setShowConfirmRedo(true)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '14px 20px',
                        cursor: 'pointer',
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 14,
                        color: '#2BBAA0',
                    }}
                >
                    <RotateCcw size={16} />
                    <span>チュートリアルをやりなおす</span>
                </div>

                {/* Reset */}
                <div
                    className="card card-sm"
                    onClick={() => setShowConfirmReset(true)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '14px 20px',
                        cursor: 'pointer',
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 14,
                        color: '#E17055',
                    }}
                >
                    <Trash2 size={16} />
                    <span>データをリセット</span>
                </div>

                {/* Developer Mode Entry */}
                {!showDeveloperDebug && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
                        <button
                            onClick={() => {
                                setDevPasswordInput('');
                                setShowDevPasswordModal(true);
                            }}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#B2BEC3',
                                fontSize: 11,
                                cursor: 'pointer',
                                padding: '8px 16px',
                                fontFamily: "'Noto Sans JP', sans-serif"
                            }}
                        >
                            開発者モード
                        </button>
                    </div>
                )}

                {/* Developer Password Modal (numeric keypad) */}
                {showDevPasswordModal && createPortal(
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.3)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 200,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 24,
                    }}>
                        <motion.div
                            className="card"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            style={{
                                textAlign: 'center',
                                padding: '32px 24px',
                                maxWidth: 280,
                                width: '100%',
                            }}
                        >
                            <h3 style={{
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 16,
                                fontWeight: 700,
                                color: '#2D3436',
                                marginBottom: 16,
                            }}>
                                パスワードを入力
                            </h3>
                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                gap: 8,
                                marginBottom: 20,
                            }}>
                                {[0, 1, 2, 3].map(i => (
                                    <div key={i} style={{
                                        width: 40,
                                        height: 48,
                                        borderRadius: 8,
                                        border: '2px solid #DFE6E9',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 24,
                                        fontWeight: 700,
                                        color: '#2D3436',
                                        background: devPasswordInput[i] ? '#F0FDFA' : '#fff',
                                    }}>
                                        {devPasswordInput[i] ? '●' : ''}
                                    </div>
                                ))}
                            </div>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, 1fr)',
                                gap: 8,
                                maxWidth: 220,
                                margin: '0 auto',
                            }}>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                                    <button
                                        key={n}
                                        onClick={() => {
                                            const next = devPasswordInput + String(n);
                                            if (next.length <= 4) {
                                                setDevPasswordInput(next);
                                                if (next.length === 4) {
                                                    if (next === '0320') {
                                                        setShowDevPasswordModal(false);
                                                        setShowDeveloperDebug(true);
                                                    } else {
                                                        setTimeout(() => setDevPasswordInput(''), 300);
                                                    }
                                                }
                                            }
                                        }}
                                        style={{
                                            width: '100%',
                                            aspectRatio: '1',
                                            borderRadius: 12,
                                            border: '1px solid #DFE6E9',
                                            background: '#fff',
                                            fontSize: 20,
                                            fontWeight: 700,
                                            color: '#2D3436',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        {n}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setShowDevPasswordModal(false)}
                                    style={{
                                        width: '100%',
                                        aspectRatio: '1',
                                        borderRadius: 12,
                                        border: '1px solid #DFE6E9',
                                        background: '#fff',
                                        fontSize: 14,
                                        color: '#8395A7',
                                        cursor: 'pointer',
                                    }}
                                >
                                    ✕
                                </button>
                                <button
                                    onClick={() => {
                                        const next = devPasswordInput + '0';
                                        if (next.length <= 4) {
                                            setDevPasswordInput(next);
                                            if (next.length === 4) {
                                                if (next === '0320') {
                                                    setShowDevPasswordModal(false);
                                                    setShowDeveloperDebug(true);
                                                } else {
                                                    setTimeout(() => setDevPasswordInput(''), 300);
                                                }
                                            }
                                        }
                                    }}
                                    style={{
                                        width: '100%',
                                        aspectRatio: '1',
                                        borderRadius: 12,
                                        border: '1px solid #DFE6E9',
                                        background: '#fff',
                                        fontSize: 20,
                                        fontWeight: 700,
                                        color: '#2D3436',
                                        cursor: 'pointer',
                                    }}
                                >
                                    0
                                </button>
                                <button
                                    onClick={() => setDevPasswordInput(devPasswordInput.slice(0, -1))}
                                    style={{
                                        width: '100%',
                                        aspectRatio: '1',
                                        borderRadius: 12,
                                        border: '1px solid #DFE6E9',
                                        background: '#fff',
                                        fontSize: 14,
                                        color: '#8395A7',
                                        cursor: 'pointer',
                                    }}
                                >
                                    ←
                                </button>
                            </div>
                        </motion.div>
                    </div>,
                    document.body
                )}

                {/* --- DEVELOPER / DEBUG --- */}
                {showDeveloperDebug && (
                    <div className="card card-sm" style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                        marginTop: 24,
                        border: '1px dashed #E17055'
                    }}>
                        <div style={{
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 14,
                            fontWeight: 700,
                            color: '#E17055',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8
                        }}>
                            <Bug size={16} />
                            デバッグ機能 (開発専用)
                        </div>

                        {/* Age Falsification */}
                        <p style={{ fontSize: 11, color: '#8395A7', margin: 0 }}>
                            ふわふわの年齢を偽装します (Homeに即時反映)
                        </p>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <button onClick={() => { updateUser(users[0]?.id, { fuwafuwaBirthDate: getDateKeyOffset(-4) }); }}
                                style={{ padding: '6px 12px', fontSize: 12, borderRadius: 6, border: '1px solid #ccc', background: '#fff' }}>
                                Day 5 (たまご)
                            </button>
                            <button onClick={() => { updateUser(users[0]?.id, { fuwafuwaBirthDate: getDateKeyOffset(-14) }); }}
                                style={{ padding: '6px 12px', fontSize: 12, borderRadius: 6, border: '1px solid #ccc', background: '#fff' }}>
                                Day 15 (妖精)
                            </button>
                            <button onClick={() => { updateUser(users[0]?.id, { fuwafuwaBirthDate: getDateKeyOffset(-25) }); }}
                                style={{ padding: '6px 12px', fontSize: 12, borderRadius: 6, border: '1px solid #ccc', background: '#fff' }}>
                                Day 26 (成体)
                            </button>
                            <button onClick={() => { updateUser(users[0]?.id, { fuwafuwaBirthDate: getDateKeyOffset(-29) }); }}
                                style={{ padding: '6px 12px', fontSize: 12, borderRadius: 6, border: '1px solid #ccc', background: '#fff' }}>
                                Day 30 (お別れ)
                            </button>
                        </div>

                        {/* Appearance Override */}
                        <div style={{ marginTop: '12px', borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '12px' }}>
                            <p style={{ fontSize: 12, color: '#2D3436', margin: '0 0 8px', fontWeight: 700 }}>姿を強制上書き (即時反映)</p>
                            <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontSize: 12, width: 50, color: '#8395A7', flexShrink: 0 }}>種類:</span>
                                    <select
                                        value={debugFuwafuwaType ?? ''}
                                        onChange={(e) => {
                                            useAppStore.getState().setDebugFuwafuwaType(e.target.value !== '' ? Number(e.target.value) : null);
                                        }}
                                        style={{ padding: 4, borderRadius: 4, flex: 1, border: '1px solid #ccc' }}
                                    >
                                        <option value="">(デフォルト)</option>
                                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(v => <option key={v} value={v}>タイプ {v}</option>)}
                                    </select>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontSize: 12, width: 50, color: '#8395A7', flexShrink: 0 }}>段階:</span>
                                    <select
                                        value={debugFuwafuwaStage ?? ''}
                                        onChange={(e) => {
                                            useAppStore.getState().setDebugFuwafuwaStage(e.target.value !== '' ? Number(e.target.value) : null);
                                        }}
                                        style={{ padding: 4, borderRadius: 4, flex: 1, border: '1px solid #ccc' }}
                                    >
                                        <option value="">(デフォルト)</option>
                                        <option value="1">たまご (Stage 1)</option>
                                        <option value="2">妖精 (Stage 2)</option>
                                        <option value="3">成体 (Stage 3)</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontSize: 12, width: 50, color: '#8395A7', flexShrink: 0 }}>サイズ:</span>
                                    <select
                                        value={debugFuwafuwaScale ?? ''}
                                        onChange={(e) => {
                                            useAppStore.getState().setDebugFuwafuwaScale(e.target.value !== '' ? Number(e.target.value) : null);
                                        }}
                                        style={{ padding: 4, borderRadius: 4, flex: 1, border: '1px solid #ccc' }}
                                    >
                                        <option value="">(デフォルト)</option>
                                        <option value="0.5">小 (0.5)</option>
                                        <option value="0.75">中 (0.75)</option>
                                        <option value="1">大 (1.0)</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontSize: 12, width: 50, color: '#8395A7', flexShrink: 0 }}>活動日:</span>
                                    <select
                                        value={debugActiveDays ?? ''}
                                        onChange={(e) => {
                                            useAppStore.getState().setDebugActiveDays(e.target.value !== '' ? Number(e.target.value) : null);
                                        }}
                                        style={{ padding: 4, borderRadius: 4, flex: 1, border: '1px solid #ccc' }}
                                    >
                                        <option value="">(デフォルト)</option>
                                        <option value="0">0日 (オーラなし)</option>
                                        <option value="2">2日 (ピンクオーラ)</option>
                                        <option value="5">5日 (金オーラ+蛍)</option>
                                        <option value="10">10日 (金オーラ+蛍)</option>
                                    </select>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    useAppStore.getState().setDebugFuwafuwaType(null);
                                    useAppStore.getState().setDebugFuwafuwaStage(null);
                                    useAppStore.getState().setDebugFuwafuwaScale(null);
                                    useAppStore.getState().setDebugActiveDays(null);
                                }}
                                style={{ marginTop: 8, padding: '4px 12px', fontSize: 11, borderRadius: 6, border: '1px solid #E17055', background: '#fff', color: '#E17055', cursor: 'pointer' }}
                            >
                                すべてリセット
                            </button>
                        </div>

                        {/* Milestone Modal Test */}
                        <div style={{ marginTop: '12px', borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '12px' }}>
                            <p style={{ fontSize: 12, color: '#2D3436', margin: '0 0 8px', fontWeight: 700 }}>メッセージ確認</p>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={() => {
                                    useAppStore.getState().setActiveMilestoneModal('egg');
                                    useAppStore.getState().setTab('home');
                                }} style={{ padding: '6px 12px', fontSize: 12, borderRadius: 6, border: '1px solid #ccc', background: '#fff' }}>
                                    たまご
                                </button>
                                <button onClick={() => {
                                    useAppStore.getState().setActiveMilestoneModal('fairy');
                                    useAppStore.getState().setTab('home');
                                }} style={{ padding: '6px 12px', fontSize: 12, borderRadius: 6, border: '1px solid #ccc', background: '#fff' }}>
                                    かえった
                                </button>
                                <button onClick={() => {
                                    useAppStore.getState().setActiveMilestoneModal('adult');
                                    useAppStore.getState().setTab('home');
                                }} style={{ padding: '6px 12px', fontSize: 12, borderRadius: 6, border: '1px solid #ccc', background: '#fff' }}>
                                    そだった
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Confirm reset dialog */}
                {showConfirmReset && createPortal(
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.3)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 200,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 24,
                    }}>
                        <motion.div
                            className="card"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            style={{
                                textAlign: 'center',
                                padding: '32px 24px',
                                maxWidth: 320,
                                width: '100%',
                            }}
                        >
                            <h3 style={{
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 18,
                                fontWeight: 700,
                                color: '#2D3436',
                                marginBottom: 8,
                            }}>
                                本当にリセットしますか？
                            </h3>
                            <p style={{
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 13,
                                color: '#8395A7',
                                marginBottom: 24,
                                lineHeight: 1.5,
                            }}>
                                すべての記録とプロフィールが<br />削除されます。
                            </p>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button
                                    onClick={() => setShowConfirmReset(false)}
                                    style={{
                                        flex: 1,
                                        padding: '12px 0',
                                        borderRadius: 12,
                                        border: '1px solid rgba(0,0,0,0.1)',
                                        background: 'white',
                                        cursor: 'pointer',
                                        fontFamily: "'Noto Sans JP', sans-serif",
                                        fontSize: 14,
                                        fontWeight: 500,
                                        color: '#8395A7',
                                    }}
                                >
                                    キャンセル
                                </button>
                                <button
                                    onClick={handleReset}
                                    style={{
                                        flex: 1,
                                        padding: '12px 0',
                                        borderRadius: 12,
                                        border: 'none',
                                        background: '#E17055',
                                        color: 'white',
                                        fontFamily: "'Noto Sans JP', sans-serif",
                                        fontSize: 15,
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                    }}
                                >
                                    リセットする
                                </button>
                            </div>
                        </motion.div>
                    </div>,
                    document.body
                )}

                {/* Confirm redo onboarding dialog */}
                {showConfirmRedo && createPortal(
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.3)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 200,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 24,
                    }}>
                        <motion.div
                            className="card"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            style={{
                                textAlign: 'center',
                                padding: '32px 24px',
                                maxWidth: 320,
                                width: '100%',
                            }}
                        >
                            <h3 style={{
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 18,
                                fontWeight: 700,
                                color: '#2D3436',
                                margin: '0 0 16px',
                            }}>
                                チュートリアルをやり直す
                            </h3>
                            <p style={{
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 14,
                                color: '#636E72',
                                margin: '0 0 24px',
                                lineHeight: 1.6,
                            }}>
                                最初の設定画面に戻りますか？<br />
                                <span style={{ fontSize: 13, color: '#8395A7' }}>※これまでの記録は消えません。</span>
                            </p>
                            <div style={{
                                display: 'flex',
                                gap: 12,
                            }}>
                                <button
                                    onClick={() => setShowConfirmRedo(false)}
                                    style={{
                                        flex: 1,
                                        padding: '12px 0',
                                        borderRadius: 12,
                                        border: 'none',
                                        background: '#DFE6E9',
                                        color: '#2D3436',
                                        fontFamily: "'Noto Sans JP', sans-serif",
                                        fontSize: 15,
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                    }}
                                >
                                    キャンセル
                                </button>
                                <button
                                    onClick={handleRedoOnboarding}
                                    style={{
                                        flex: 1,
                                        padding: '12px 0',
                                        borderRadius: 12,
                                        border: 'none',
                                        background: '#2BBAA0',
                                        color: 'white',
                                        fontFamily: "'Noto Sans JP', sans-serif",
                                        fontSize: 15,
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                    }}
                                >
                                    やり直す
                                </button>
                            </div>
                        </motion.div>
                    </div>,
                    document.body
                )}

                {/* Help modal */}
                {showHelp && createPortal(
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgb(248, 249, 250)',
                        zIndex: 200,
                        display: 'flex',
                        flexDirection: 'column',
                    }}>
                        {/* Header */}
                        <div style={{
                            padding: '24px 20px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: 'white',
                            borderBottom: '1px solid rgba(0,0,0,0.06)',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                        }}>
                            <h2 style={{
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 18,
                                fontWeight: 700,
                                color: '#2D3436',
                                margin: 0,
                            }}>
                                ヘルプ・使い方
                            </h2>
                            <button
                                onClick={() => setShowHelp(false)}
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: '50%',
                                    border: 'none',
                                    background: '#F8F9FA',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                }}
                            >
                                <X size={20} color="#2D3436" />
                            </button>
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', paddingBottom: 40 }}>
                            {HELP_SECTIONS.map((section, idx) => (
                                <div
                                    key={section.title}
                                    className="card"
                                    style={{
                                        marginBottom: idx < HELP_SECTIONS.length - 1 ? 16 : 0,
                                        padding: '16px 20px',
                                    }}
                                >
                                    <h3 style={{
                                        fontFamily: "'Noto Sans JP', sans-serif",
                                        fontSize: 15,
                                        fontWeight: 700,
                                        color: '#2D3436',
                                        marginBottom: 8,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                    }}>
                                        <span>{section.emoji}</span>
                                        <span>{section.title}</span>
                                    </h3>
                                    {section.items.map(item => (
                                        <HelpItem
                                            key={item.id}
                                            item={item}
                                            isOpen={openHelpItems.has(item.id)}
                                            onToggle={() => toggleHelpItem(item.id)}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>,
                    document.body
                )}
            </div>
        </div>
    );
};
