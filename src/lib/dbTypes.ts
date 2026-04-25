import type { ExercisePlacement } from '@/data/exercisePlacement';
import type { SessionMenuSource } from '@/store/use-app-store/types';
import type { SessionCountMap } from './sessionRecords';
import type { SessionPlannedItem } from './sessionPlan';

export interface SessionRecord {
    id: string;
    date: string;
    startedAt: string;
    totalSeconds: number;
    exerciseIds: string[];
    plannedExerciseIds?: string[];
    plannedItems?: SessionPlannedItem[];
    skippedIds: string[];
    exerciseCounts?: SessionCountMap;
    skippedCounts?: SessionCountMap;
    userIds?: string[];
    sourceMenuId?: string | null;
    sourceMenuSource?: SessionMenuSource | null;
    sourceMenuName?: string | null;
}

export interface CustomExercise {
    id: string;
    name: string;
    sec: number;
    emoji: string;
    placement: ExercisePlacement;
    hasSplit?: boolean;
    description?: string;
    creatorId?: string;
}
