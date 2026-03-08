export {
    CLASS_EMOJI,
    CLASS_LEVELS,
    EXERCISES,
    EXERCISE_COLORS,
    USER_CLASS_LEVELS,
    getExerciseById,
    getExerciseColor,
    getExercisePlacementLabel,
    getExercisesByClass,
    isRestExercise,
    type ClassLevel,
    type ClassLevelInfo,
    type Exercise,
    type Priority,
} from './exerciseCatalog';

export {
    DEFAULT_SESSION_TARGET_SECONDS,
    calculateTotalSeconds,
    generateSession,
    generateSessionFromIds,
    getReplacementExercise,
    type GenerateSessionOptions,
    type SessionPoolExercise,
} from './exerciseSession';
