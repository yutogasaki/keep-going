import React from 'react';
import { Loader2 } from 'lucide-react';
import type { IndividualStudent } from '../types';
import { ClassSection } from './ClassSection';

interface StudentsListProps {
    loading: boolean;
    individualStudents: IndividualStudent[];
    studentsByClass: Array<[string, IndividualStudent[]]>;
    expandedClass: string | null;
    onToggleClass: (classLevel: string) => void;
    expandedStudent: string | null;
    onToggleStudent: (studentId: string) => void;
}

export const StudentsList: React.FC<StudentsListProps> = ({
    loading,
    individualStudents,
    studentsByClass,
    expandedClass,
    onToggleClass,
    expandedStudent,
    onToggleStudent,
}) => {
    return (
        <div style={{
            padding: '0 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
        }}>
            {loading ? (
                <div style={{
                    textAlign: 'center',
                    padding: 48,
                    color: '#8395A7',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 12,
                }}>
                    <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
                    <p style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 14,
                        margin: 0,
                    }}>
                        読み込み中...
                    </p>
                </div>
            ) : individualStudents.length === 0 ? (
                <div className="card" style={{
                    textAlign: 'center',
                    padding: 40,
                }}>
                    <p style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 14,
                        color: '#8395A7',
                        margin: 0,
                    }}>
                        登録された生徒がいません
                    </p>
                </div>
            ) : (
                studentsByClass.map(([classLevel, classStudents]) => (
                    <ClassSection
                        key={classLevel}
                        classLevel={classLevel}
                        students={classStudents}
                        expanded={expandedClass === classLevel}
                        onToggle={() => onToggleClass(classLevel)}
                        expandedStudent={expandedStudent}
                        onToggleStudent={onToggleStudent}
                    />
                ))
            )}
        </div>
    );
};
