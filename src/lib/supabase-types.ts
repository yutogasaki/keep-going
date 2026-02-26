export interface Database {
    public: {
        Tables: {
            family_members: {
                Row: {
                    id: string;
                    account_id: string;
                    name: string;
                    class_level: string;
                    fuwafuwa_birth_date: string;
                    fuwafuwa_type: number;
                    fuwafuwa_cycle_count: number;
                    fuwafuwa_name: string | null;
                    past_fuwafuwas: unknown[];
                    notified_fuwafuwa_stages: number[];
                    daily_target_minutes: number;
                    excluded_exercises: string[];
                    required_exercises: string[];
                    consumed_magic_date: string | null;
                    consumed_magic_seconds: number;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id: string;
                    account_id: string;
                    name: string;
                    class_level?: string;
                    fuwafuwa_birth_date: string;
                    fuwafuwa_type?: number;
                    fuwafuwa_cycle_count?: number;
                    fuwafuwa_name?: string | null;
                    past_fuwafuwas?: unknown[];
                    notified_fuwafuwa_stages?: number[];
                    daily_target_minutes?: number;
                    excluded_exercises?: string[];
                    required_exercises?: string[];
                    consumed_magic_date?: string | null;
                    consumed_magic_seconds?: number;
                };
                Update: Partial<Database['public']['Tables']['family_members']['Insert']>;
            };
            sessions: {
                Row: {
                    id: string;
                    account_id: string;
                    date: string;
                    started_at: string;
                    total_seconds: number;
                    exercise_ids: string[];
                    skipped_ids: string[];
                    user_ids: string[];
                    created_at: string;
                };
                Insert: {
                    id: string;
                    account_id: string;
                    date: string;
                    started_at: string;
                    total_seconds: number;
                    exercise_ids?: string[];
                    skipped_ids?: string[];
                    user_ids?: string[];
                };
                Update: Partial<Database['public']['Tables']['sessions']['Insert']>;
            };
            custom_exercises: {
                Row: {
                    id: string;
                    account_id: string;
                    name: string;
                    sec: number;
                    emoji: string;
                    has_split: boolean;
                    creator_id: string | null;
                    created_at: string;
                };
                Insert: {
                    id: string;
                    account_id: string;
                    name: string;
                    sec: number;
                    emoji?: string;
                    has_split?: boolean;
                    creator_id?: string | null;
                };
                Update: Partial<Database['public']['Tables']['custom_exercises']['Insert']>;
            };
            menu_groups: {
                Row: {
                    id: string;
                    account_id: string;
                    name: string;
                    emoji: string;
                    description: string | null;
                    exercise_ids: string[];
                    is_preset: boolean;
                    creator_id: string | null;
                    created_at: string;
                };
                Insert: {
                    id: string;
                    account_id: string;
                    name: string;
                    emoji?: string;
                    description?: string | null;
                    exercise_ids?: string[];
                    is_preset?: boolean;
                    creator_id?: string | null;
                };
                Update: Partial<Database['public']['Tables']['menu_groups']['Insert']>;
            };
            app_settings: {
                Row: {
                    account_id: string;
                    onboarding_completed: boolean;
                    sound_volume: number;
                    tts_enabled: boolean;
                    bgm_enabled: boolean;
                    haptic_enabled: boolean;
                    notifications_enabled: boolean;
                    notification_time: string;
                    updated_at: string;
                };
                Insert: {
                    account_id: string;
                    onboarding_completed?: boolean;
                    sound_volume?: number;
                    tts_enabled?: boolean;
                    bgm_enabled?: boolean;
                    haptic_enabled?: boolean;
                    notifications_enabled?: boolean;
                    notification_time?: string;
                };
                Update: Partial<Database['public']['Tables']['app_settings']['Insert']>;
            };
        };
    };
}
