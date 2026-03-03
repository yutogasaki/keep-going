import React from 'react';
import { motion } from 'framer-motion';
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
    canPublish,
    findPublishedExercise,
    onPublishExercise,
    onUnpublishExercise,
    onOpenPublicExerciseBrowser,
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
                    canPublish={canPublish}
                    findPublishedExercise={findPublishedExercise}
                    onPublish={onPublishExercise}
                    onUnpublish={onUnpublishExercise}
                />

                <CreateCustomExerciseCard onCreate={onCreateCustomExercise} />
            </div>

            {/* みんなの種目 section */}
            {onOpenPublicExerciseBrowser && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
                    <h2 style={{
                        fontFamily: "'Noto Sans JP', sans-serif",
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#8395A7',
                        marginBottom: 10,
                        letterSpacing: 1,
                    }}>
                        みんなの種目
                    </h2>
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={onOpenPublicExerciseBrowser}
                        className="card"
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 16,
                            padding: '16px 20px',
                            border: 'none',
                            background: 'white',
                            cursor: 'pointer',
                            textAlign: 'left',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                        }}
                    >
                        <div style={{
                            width: 44,
                            height: 44,
                            borderRadius: 14,
                            background: 'linear-gradient(135deg, #E8F4FD, #BEE3F8)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            boxShadow: '0 2px 8px rgba(190, 227, 248, 0.5)',
                        }}>
                            <span style={{ fontSize: 22 }}>🌍</span>
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 15,
                                fontWeight: 700,
                                color: '#2D3436',
                                marginBottom: 4,
                            }}>
                                みんなの種目を見る
                            </div>
                            <div style={{
                                fontFamily: "'Noto Sans JP', sans-serif",
                                fontSize: 12,
                                color: '#8395A7',
                                lineHeight: 1.4,
                            }}>
                                他の人が作った種目をもらおう
                            </div>
                        </div>
                    </motion.button>
                </div>
            )}
        </div>
    );
};
