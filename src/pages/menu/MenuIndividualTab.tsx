import React from 'react';
import { CustomExerciseList } from './individual-tab/CustomExerciseList';
import { StandardExerciseList } from './individual-tab/StandardExerciseList';
import { CreateCustomExerciseCard } from './individual-tab/CreateCustomExerciseCard';
import type { MenuIndividualTabProps } from './individual-tab/types';

export const MenuIndividualTab: React.FC<MenuIndividualTabProps> = ({
    exercises,
    requiredExercises,
    customExercises,
    isTogetherMode,
    getCreatorName,
    onStartExercise,
    onEditCustomExercise,
    onDeleteCustomExercise,
    onStartCustomExercise,
    onCreateCustomExercise,
    teacherExerciseIds,
    isNewTeacherContent,
}) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '0 20px' }}>
            <StandardExerciseList
                exercises={exercises}
                requiredExerciseIds={requiredExercises}
                onStartExercise={onStartExercise}
                teacherExerciseIds={teacherExerciseIds}
                isNewTeacherContent={isNewTeacherContent}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
                <h2 style={{
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#8395A7',
                    marginBottom: 10,
                    letterSpacing: 1,
                }}>
                    じぶん種目
                </h2>

                <CustomExerciseList
                    customExercises={customExercises}
                    isTogetherMode={isTogetherMode}
                    getCreatorName={getCreatorName}
                    onEdit={onEditCustomExercise}
                    onDelete={onDeleteCustomExercise}
                    onStart={onStartCustomExercise}
                />

                <CreateCustomExerciseCard onCreate={onCreateCustomExercise} />
            </div>
        </div>
    );
};
