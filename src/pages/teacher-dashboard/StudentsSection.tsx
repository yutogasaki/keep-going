import React from 'react';
import { StudentsList } from './students-section/StudentsList';
import { StudentsOverviewCards } from './students-section/StudentsOverviewCards';
import type { IndividualStudent, WeeklyStats } from './types';

interface StudentsSectionProps {
    loading: boolean;
    individualStudents: IndividualStudent[];
    studentsByClass: Array<[string, IndividualStudent[]]>;
    expandedClass: string | null;
    onToggleClass: (classLevel: string) => void;
    expandedStudent: string | null;
    onToggleStudent: (studentId: string) => void;
    activeToday: number;
    activeYesterday: number;
    weeklyStats: WeeklyStats | null;
}

export const StudentsSection: React.FC<StudentsSectionProps> = ({
    loading,
    individualStudents,
    studentsByClass,
    expandedClass,
    onToggleClass,
    expandedStudent,
    onToggleStudent,
    activeToday,
    activeYesterday,
    weeklyStats,
}) => {
    return (
        <>
            {!loading && (
                <StudentsOverviewCards
                    individualStudents={individualStudents}
                    activeToday={activeToday}
                    activeYesterday={activeYesterday}
                    weeklyStats={weeklyStats}
                />
            )}

            <StudentsList
                loading={loading}
                individualStudents={individualStudents}
                studentsByClass={studentsByClass}
                expandedClass={expandedClass}
                onToggleClass={onToggleClass}
                expandedStudent={expandedStudent}
                onToggleStudent={onToggleStudent}
            />
        </>
    );
};
