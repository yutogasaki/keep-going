import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { RefreshCw, Settings, Trophy, Users } from 'lucide-react';
import { fetchAllStudents, calculateStreak, type StudentSummary } from '../lib/teacher';
import { getAllSessions, getTodayKey, getDateKeyOffset } from '../lib/db';
import { CLASS_LEVELS } from '../data/exercises';
import {
    fetchAllChallenges,
    fetchTeacherChallengeAttempts,
    fetchTeacherChallengeCompletions,
    fetchTeacherChallengeEnrollments,
    type Challenge,
    type ChallengeAttempt,
    type ChallengeCompletion,
    type ChallengeEnrollment,
} from '../lib/challenges';
import { useAuth } from '../contexts/AuthContext';
import { ChallengeManagement } from './teacher-dashboard/ChallengeManagement';
import { StudentsSection } from './teacher-dashboard/StudentsSection';
import { MenuSettingsSection } from './teacher-dashboard/MenuSettingsSection';
import type { IndividualStudent, WeeklyStats } from './teacher-dashboard/types';
import { useAppStore } from '../store/useAppStore';
import { getAccountId } from '../lib/sync/authState';
import { PageHeader } from '../components/PageHeader';
import { ScreenScaffold } from '../components/ScreenScaffold';
import { COLOR, HEADER_ICON_BUTTON_SIZE, SCREEN_PADDING_X } from '../lib/styles';

const CLASS_ORDER = CLASS_LEVELS.map((c) => c.id);

interface TeacherDashboardProps {
    onBack: () => void;
}

type DashboardTab = 'students' | 'challenges' | 'menu-settings';

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onBack }) => {
    const { user } = useAuth();
    const users = useAppStore((state) => state.users);
    const [activeTab, setActiveTab] = useState<DashboardTab>('students');
    const [students, setStudents] = useState<StudentSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedClass, setExpandedClass] = useState<string | null>(null);
    const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
    const hasAutoExpandedClassRef = useRef(false);

    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [challengeCompletions, setChallengeCompletions] = useState<ChallengeCompletion[]>([]);
    const [challengeEnrollments, setChallengeEnrollments] = useState<ChallengeEnrollment[]>([]);
    const [challengeAttempts, setChallengeAttempts] = useState<ChallengeAttempt[]>([]);
    const [challengesLoading, setChallengesLoading] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const currentAccountId = getAccountId();
            const localSessions = currentAccountId ? await getAllSessions() : [];
            const data = await fetchAllStudents({
                currentAccountId,
                localMembers: currentAccountId
                    ? users.map((member) => ({
                        id: member.id,
                        name: member.name,
                        classLevel: member.classLevel,
                        avatarUrl: member.avatarUrl,
                    }))
                    : [],
                localSessions,
            });
            setStudents(data);
        } catch (err) {
            console.warn('[teacher] Failed to load students:', err);
        } finally {
            setLoading(false);
        }
    }, [users]);

    const loadChallenges = useCallback(async () => {
        setChallengesLoading(true);
        try {
            const [challengeRows, completionRows, enrollmentRows, attemptRows] = await Promise.all([
                fetchAllChallenges(),
                fetchTeacherChallengeCompletions(),
                fetchTeacherChallengeEnrollments(),
                fetchTeacherChallengeAttempts(),
            ]);
            setChallenges(challengeRows);
            setChallengeCompletions(completionRows);
            setChallengeEnrollments(enrollmentRows);
            setChallengeAttempts(attemptRows);
        } catch (err) {
            console.warn('[teacher] Failed to load challenges:', err);
        } finally {
            setChallengesLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        const handleSessionSaved = () => {
            void load();
            if (activeTab === 'challenges') {
                void loadChallenges();
            }
        };
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                void load();
                if (activeTab === 'challenges') {
                    void loadChallenges();
                }
            }
        };

        window.addEventListener('sessionSaved', handleSessionSaved);
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            window.removeEventListener('sessionSaved', handleSessionSaved);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, [activeTab, load, loadChallenges]);

    useEffect(() => {
        if (activeTab === 'challenges') {
            loadChallenges();
        }
    }, [activeTab, loadChallenges]);

    const individualStudents = useMemo(() => {
        const result: IndividualStudent[] = [];
        for (const summary of students) {
            const memberIds = new Set(summary.members.map((m) => m.id));
            const isSingleMember = summary.members.length === 1;
            for (const member of summary.members) {
                const memberSessions = summary.sessions.filter((s) => {
                    if (s.userIds.length === 0) return true;
                    if (s.userIds.includes(member.id)) return true;
                    if (isSingleMember) return true;
                    const hasAnyMatch = s.userIds.some((id) => memberIds.has(id));
                    return !hasAnyMatch;
                });
                result.push({
                    memberId: member.id,
                    name: member.name,
                    classLevel: member.classLevel,
                    avatarUrl: member.avatarUrl,
                    accountId: summary.accountId,
                    sessions: memberSessions,
                    streak: calculateStreak(memberSessions),
                    totalSessions: memberSessions.length,
                    lastActiveDate: memberSessions.length > 0 ? memberSessions[0].date : null,
                });
            }
        }
        return result;
    }, [students]);

    const studentsByClass = useMemo(() => {
        const groups = new Map<string, IndividualStudent[]>();
        for (const level of CLASS_ORDER) {
            groups.set(level, []);
        }
        for (const student of individualStudents) {
            const level = CLASS_ORDER.includes(student.classLevel as typeof CLASS_ORDER[number])
                ? student.classLevel
                : 'その他';
            groups.get(level)!.push(student);
        }
        for (const [, list] of groups) {
            list.sort((a, b) => (b.lastActiveDate ?? '').localeCompare(a.lastActiveDate ?? ''));
        }
        return [...groups.entries()].filter(([, list]) => list.length > 0);
    }, [individualStudents]);

    const challengeMemberNameMap = useMemo(
        () => new Map(individualStudents.map((student) => [student.memberId, student.name])),
        [individualStudents],
    );

    const challengeSessionsByMemberId = useMemo(
        () => new Map(individualStudents.map((student) => [student.memberId, student.sessions])),
        [individualStudents],
    );
    const challengeStudentByMemberId = useMemo(
        () => new Map(individualStudents.map((student) => [student.memberId, student])),
        [individualStudents],
    );

    const today = getTodayKey();
    const activeToday = individualStudents.filter((s) => s.lastActiveDate === today).length;

    const weeklyStats = useMemo<WeeklyStats | null>(() => {
        if (individualStudents.length === 0) return null;
        const weekDates = new Set(Array.from({ length: 7 }, (_, i) => getDateKeyOffset(-i)));

        let activeCount = 0;
        let totalMinutes = 0;
        let totalSessions = 0;

        for (const student of individualStudents) {
            const weekSessions = student.sessions.filter((session) => weekDates.has(session.date));
            if (weekSessions.length > 0) activeCount += 1;
            totalSessions += weekSessions.length;
            totalMinutes += weekSessions.reduce((sum, session) => sum + session.totalSeconds, 0);
        }

        return {
            activeCount,
            totalMinutes: Math.floor(totalMinutes / 60),
            totalSessions,
            rate: Math.round((activeCount / individualStudents.length) * 100),
        };
    }, [individualStudents]);

    useEffect(() => {
        if (loading) {
            return;
        }
        if (studentsByClass.length === 0) {
            hasAutoExpandedClassRef.current = false;
            setExpandedClass(null);
            setExpandedStudent(null);
            return;
        }
        if (!hasAutoExpandedClassRef.current && expandedClass === null) {
            hasAutoExpandedClassRef.current = true;
            setExpandedClass(studentsByClass[0][0]);
        }
    }, [loading, studentsByClass, expandedClass]);

    const handleToggleClass = useCallback((classLevel: string) => {
        setExpandedStudent(null);
        setExpandedClass((current) => (current === classLevel ? null : classLevel));
    }, []);

    const handleToggleStudent = useCallback((studentId: string) => {
        setExpandedStudent((current) => (current === studentId ? null : studentId));
    }, []);

    const handleOpenStudentRecord = useCallback((memberId: string) => {
        const student = challengeStudentByMemberId.get(memberId);
        setActiveTab('students');
        if (student) {
            setExpandedClass(student.classLevel);
            setExpandedStudent(memberId);
        }
    }, [challengeStudentByMemberId]);

    const isRefreshing = activeTab === 'students'
        ? loading
        : activeTab === 'challenges'
            ? challengesLoading
            : false;

    const handleRefresh = activeTab === 'students'
        ? () => {
            void load();
        }
        : activeTab === 'challenges'
            ? () => {
                void Promise.all([load(), loadChallenges()]);
            }
            : undefined;

    return (
        <ScreenScaffold
            withBottomNav
            header={(
                <PageHeader
                    title="先生ダッシュボード"
                    onBack={onBack}
                    rightElement={(
                        <button
                            type="button"
                            onClick={handleRefresh}
                            disabled={!handleRefresh || isRefreshing}
                            aria-label="データを更新"
                            style={{
                                width: HEADER_ICON_BUTTON_SIZE,
                                height: HEADER_ICON_BUTTON_SIZE,
                                borderRadius: '50%',
                                border: 'none',
                                background: COLOR.bgMuted,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: !handleRefresh || isRefreshing ? 'not-allowed' : 'pointer',
                                color: COLOR.muted,
                                flexShrink: 0,
                                opacity: !handleRefresh ? 0.45 : 1,
                            }}
                        >
                            <RefreshCw size={16} style={isRefreshing ? { animation: 'spin 1s linear infinite' } : undefined} />
                        </button>
                    )}
                />
            )}
        >
            <div style={{
                display: 'flex',
                padding: `0 ${SCREEN_PADDING_X}px`,
                gap: 8,
                marginBottom: 16,
            }}>
                {([
                    { id: 'students' as DashboardTab, label: '生徒一覧', icon: <Users size={14} /> },
                    { id: 'challenges' as DashboardTab, label: 'チャレンジ', icon: <Trophy size={14} /> },
                    { id: 'menu-settings' as DashboardTab, label: 'メニュー設定', icon: <Settings size={14} /> },
                ]).map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            flex: 1,
                            padding: '10px 0',
                            borderRadius: 12,
                            border: 'none',
                            background: activeTab === tab.id ? '#2BBAA0' : '#F0F3F5',
                            color: activeTab === tab.id ? '#FFF' : '#8395A7',
                            fontFamily: "'Noto Sans JP', sans-serif",
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            transition: 'all 0.2s',
                        }}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'challenges' && (
                <ChallengeManagement
                    challenges={challenges}
                    challengeCompletions={challengeCompletions}
                    challengeEnrollments={challengeEnrollments}
                    challengeAttempts={challengeAttempts}
                    memberNameMap={challengeMemberNameMap}
                    sessionsByMemberId={challengeSessionsByMemberId}
                    loading={challengesLoading}
                    showCreateForm={showCreateForm}
                    setShowCreateForm={setShowCreateForm}
                    teacherEmail={user?.email ?? ''}
                    onCreated={loadChallenges}
                    onDeleted={loadChallenges}
                    onOpenStudentRecord={handleOpenStudentRecord}
                />
            )}

            {activeTab === 'menu-settings' && (
                <MenuSettingsSection
                    teacherEmail={user?.email ?? ''}
                    loading={false}
                />
            )}

            {activeTab === 'students' && (
                <StudentsSection
                    loading={loading}
                    individualStudents={individualStudents}
                    studentsByClass={studentsByClass}
                    expandedClass={expandedClass}
                    onToggleClass={handleToggleClass}
                    expandedStudent={expandedStudent}
                    onToggleStudent={handleToggleStudent}
                    activeToday={activeToday}
                    weeklyStats={weeklyStats}
                />
            )}
        </ScreenScaffold>
    );
};
