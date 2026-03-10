import { supabase } from './supabase';
import type { Database } from './supabase-types';
import { normalizeExercisePlacement, type ExercisePlacement } from '../data/exercisePlacement';
import {
    normalizeTeacherContentDisplayMode,
    type TeacherContentDisplayMode,
    type TeacherExerciseVisibility,
    type TeacherMenuVisibility,
} from './teacherExerciseMetadata';

type TeacherExerciseRow = Database['public']['Tables']['teacher_exercises']['Row'];
type TeacherMenuRow = Database['public']['Tables']['teacher_menus']['Row'];

// ─── Types ───────────────────────────────────────────

export interface TeacherExercise {
    id: string;
    name: string;
    sec: number;
    emoji: string;
    placement: ExercisePlacement;
    hasSplit: boolean;
    description: string;
    classLevels: string[];
    visibility: TeacherExerciseVisibility;
    focusTags: string[];
    recommended: boolean;
    recommendedOrder: number | null;
    displayMode: TeacherContentDisplayMode;
    createdBy: string;
    createdAt: string;
}

export interface TeacherMenu {
    id: string;
    name: string;
    emoji: string;
    description: string;
    exerciseIds: string[];
    classLevels: string[];
    visibility: TeacherMenuVisibility;
    focusTags: string[];
    recommended: boolean;
    recommendedOrder: number | null;
    displayMode: TeacherContentDisplayMode;
    createdBy: string;
    createdAt: string;
}

// ─── Cache ───────────────────────────────────────────

let cachedExercises: TeacherExercise[] | null = null;
let cachedMenus: TeacherMenu[] | null = null;
let exerciseCacheTime = 0;
let menuCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

export function invalidateTeacherContentCache(): void {
    cachedExercises = null;
    cachedMenus = null;
}

// ─── Teacher Exercises ───────────────────────────────

export async function fetchTeacherExercises(forceRefresh = false): Promise<TeacherExercise[]> {
    if (!supabase) return [];
    if (!forceRefresh && cachedExercises && Date.now() - exerciseCacheTime < CACHE_TTL) {
        return cachedExercises;
    }

    const { data, error } = await supabase
        .from('teacher_exercises')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.warn('[teacherContent] fetchTeacherExercises failed:', error);
        return cachedExercises ?? [];
    }

    cachedExercises = (data ?? []).map(mapTeacherExercise);
    exerciseCacheTime = Date.now();
    return cachedExercises;
}

export async function createTeacherExercise(data: {
    name: string;
    sec: number;
    emoji: string;
    placement: ExercisePlacement;
    hasSplit: boolean;
    description: string;
    classLevels: string[];
    visibility: TeacherExerciseVisibility;
    focusTags: string[];
    recommended: boolean;
    recommendedOrder: number | null;
    displayMode: TeacherContentDisplayMode;
    createdBy: string;
}): Promise<string | null> {
    if (!supabase) return null;

    const { data: result, error } = await supabase.from('teacher_exercises').insert({
        name: data.name,
        sec: data.sec,
        emoji: data.emoji,
        placement: data.placement,
        has_split: data.hasSplit,
        description: data.description,
        class_levels: data.classLevels,
        visibility: data.visibility,
        focus_tags: data.focusTags,
        recommended: data.recommended,
        recommended_order: data.recommendedOrder,
        display_mode: data.displayMode,
        created_by: data.createdBy,
    }).select('id').single();

    if (error) throw error;
    cachedExercises = null;
    return result?.id ?? null;
}

export async function updateTeacherExercise(id: string, data: {
    name: string;
    sec: number;
    emoji: string;
    placement: ExercisePlacement;
    hasSplit: boolean;
    description: string;
    classLevels: string[];
    visibility: TeacherExerciseVisibility;
    focusTags: string[];
    recommended: boolean;
    recommendedOrder: number | null;
    displayMode: TeacherContentDisplayMode;
}): Promise<void> {
    if (!supabase) return;

    const { error } = await supabase.from('teacher_exercises').update({
        name: data.name,
        sec: data.sec,
        emoji: data.emoji,
        placement: data.placement,
        has_split: data.hasSplit,
        description: data.description,
        class_levels: data.classLevels,
        visibility: data.visibility,
        focus_tags: data.focusTags,
        recommended: data.recommended,
        recommended_order: data.recommendedOrder,
        display_mode: data.displayMode,
    }).eq('id', id);

    if (error) throw error;
    cachedExercises = null;
}

export async function deleteTeacherExercise(id: string): Promise<void> {
    if (!supabase) return;

    const { error } = await supabase.from('teacher_exercises').delete().eq('id', id);
    if (error) throw error;
    cachedExercises = null;
}

// ─── Teacher Menus ───────────────────────────────────

export async function fetchTeacherMenus(forceRefresh = false): Promise<TeacherMenu[]> {
    if (!supabase) return [];
    if (!forceRefresh && cachedMenus && Date.now() - menuCacheTime < CACHE_TTL) {
        return cachedMenus;
    }

    const { data, error } = await supabase
        .from('teacher_menus')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.warn('[teacherContent] fetchTeacherMenus failed:', error);
        return cachedMenus ?? [];
    }

    cachedMenus = (data ?? []).map(mapTeacherMenu);
    menuCacheTime = Date.now();
    return cachedMenus;
}

export async function createTeacherMenu(data: {
    name: string;
    emoji: string;
    description: string;
    exerciseIds: string[];
    classLevels: string[];
    visibility: TeacherMenuVisibility;
    focusTags: string[];
    recommended: boolean;
    recommendedOrder: number | null;
    displayMode: TeacherContentDisplayMode;
    createdBy: string;
}): Promise<string | null> {
    if (!supabase) return null;

    const { data: result, error } = await supabase.from('teacher_menus').insert({
        name: data.name,
        emoji: data.emoji,
        description: data.description,
        exercise_ids: data.exerciseIds,
        class_levels: data.classLevels,
        visibility: data.visibility,
        focus_tags: data.focusTags,
        recommended: data.recommended,
        recommended_order: data.recommendedOrder,
        display_mode: data.displayMode,
        created_by: data.createdBy,
    }).select('id').single();

    if (error) throw error;
    cachedMenus = null;
    return result?.id ?? null;
}

export async function updateTeacherMenu(id: string, data: {
    name: string;
    emoji: string;
    description: string;
    exerciseIds: string[];
    classLevels: string[];
    visibility: TeacherMenuVisibility;
    focusTags: string[];
    recommended: boolean;
    recommendedOrder: number | null;
    displayMode: TeacherContentDisplayMode;
}): Promise<void> {
    if (!supabase) return;

    const { error } = await supabase.from('teacher_menus').update({
        name: data.name,
        emoji: data.emoji,
        description: data.description,
        exercise_ids: data.exerciseIds,
        class_levels: data.classLevels,
        visibility: data.visibility,
        focus_tags: data.focusTags,
        recommended: data.recommended,
        recommended_order: data.recommendedOrder,
        display_mode: data.displayMode,
    }).eq('id', id);

    if (error) throw error;
    cachedMenus = null;
}

export async function deleteTeacherMenu(id: string): Promise<void> {
    if (!supabase) return;

    const { error } = await supabase.from('teacher_menus').delete().eq('id', id);
    if (error) throw error;
    cachedMenus = null;
}

// ─── Mappers ─────────────────────────────────────────

function mapTeacherExercise(row: TeacherExerciseRow): TeacherExercise {
    return {
        id: row.id,
        name: row.name,
        sec: row.sec,
        emoji: row.emoji,
        placement: normalizeExercisePlacement(row.placement),
        hasSplit: row.has_split ?? false,
        description: row.description ?? '',
        classLevels: row.class_levels ?? [],
        visibility: normalizeTeacherExerciseVisibility(row.visibility),
        focusTags: row.focus_tags ?? [],
        recommended: row.recommended ?? false,
        recommendedOrder: row.recommended_order ?? null,
        displayMode: normalizeTeacherContentDisplayMode(row.display_mode, 'standard_inline'),
        createdBy: row.created_by,
        createdAt: row.created_at,
    };
}

function mapTeacherMenu(row: TeacherMenuRow): TeacherMenu {
    return {
        id: row.id,
        name: row.name,
        emoji: row.emoji,
        description: row.description ?? '',
        exerciseIds: (row.exercise_ids as string[]) ?? [],
        classLevels: row.class_levels ?? [],
        visibility: normalizeTeacherExerciseVisibility(row.visibility),
        focusTags: row.focus_tags ?? [],
        recommended: row.recommended ?? false,
        recommendedOrder: row.recommended_order ?? null,
        displayMode: normalizeTeacherContentDisplayMode(row.display_mode, 'teacher_section'),
        createdBy: row.created_by,
        createdAt: row.created_at,
    };
}

function normalizeTeacherExerciseVisibility(value: string | null | undefined): TeacherExerciseVisibility {
    return value === 'class_limited' || value === 'teacher_only' ? value : 'public';
}
