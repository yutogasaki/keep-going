import type { MenuGroupItem } from '../data/menuGroups';
import type { CustomExercise } from './db';
import type { Database } from './supabase-types';

export type PublicMenuRow = Database['public']['Tables']['public_menus']['Row'];

export interface CustomExerciseData {
    id: string;
    name: string;
    sec: number;
    emoji: string;
    placement: CustomExercise['placement'];
    hasSplit?: boolean;
}

export interface PublicMenu {
    id: string;
    name: string;
    emoji: string;
    description: string;
    exerciseIds: string[];
    items: MenuGroupItem[];
    customExerciseData: CustomExerciseData[];
    authorName: string;
    accountId: string;
    downloadCount: number;
    createdAt: string;
}
