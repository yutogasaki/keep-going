export type TableName = keyof Database['public']['Tables'];

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
                    consumed_magic_seconds: number;
                    avatar_url: string | null;
                    chibifuwas: unknown[];
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
                    consumed_magic_seconds?: number;
                    avatar_url?: string | null;
                    chibifuwas?: unknown[];
                };
                Update: Partial<Database['public']['Tables']['family_members']['Insert']>;
                Relationships: [];
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
                Relationships: [];
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
                    description: string | null;
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
                    description?: string | null;
                };
                Update: Partial<Database['public']['Tables']['custom_exercises']['Insert']>;
                Relationships: [];
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
                Relationships: [];
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
                    suspended: boolean;
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
                    suspended?: boolean;
                };
                Update: Partial<Database['public']['Tables']['app_settings']['Insert']>;
                Relationships: [];
            };
            challenges: {
                Row: {
                    id: string;
                    title: string;
                    exercise_id: string;
                    target_count: number;
                    start_date: string;
                    end_date: string;
                    created_by: string;
                    reward_fuwafuwa_type: number;
                    class_levels: string[];
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    title: string;
                    exercise_id: string;
                    target_count: number;
                    start_date: string;
                    end_date: string;
                    created_by: string;
                    reward_fuwafuwa_type: number;
                    class_levels?: string[];
                };
                Update: Partial<Database['public']['Tables']['challenges']['Insert']>;
                Relationships: [];
            };
            challenge_completions: {
                Row: {
                    id: string;
                    challenge_id: string;
                    account_id: string;
                    member_id: string;
                    completed_at: string;
                };
                Insert: {
                    id?: string;
                    challenge_id: string;
                    account_id: string;
                    member_id: string;
                };
                Update: Partial<Database['public']['Tables']['challenge_completions']['Insert']>;
                Relationships: [];
            };
            public_menus: {
                Row: {
                    id: string;
                    name: string;
                    emoji: string;
                    description: string | null;
                    exercise_ids: string[];
                    author_name: string;
                    account_id: string;
                    download_count: number;
                    custom_exercise_data: unknown[];
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    name: string;
                    emoji: string;
                    description?: string | null;
                    exercise_ids?: string[];
                    author_name: string;
                    account_id: string;
                    download_count?: number;
                    custom_exercise_data?: unknown[];
                };
                Update: Partial<Database['public']['Tables']['public_menus']['Insert']>;
                Relationships: [];
            };
            teacher_menu_settings: {
                Row: {
                    id: string;
                    item_id: string;
                    item_type: string;
                    class_level: string;
                    status: string;
                    created_by: string;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    item_id: string;
                    item_type: string;
                    class_level: string;
                    status?: string;
                    created_by: string;
                };
                Update: Partial<Database['public']['Tables']['teacher_menu_settings']['Insert']>;
                Relationships: [];
            };
            teacher_exercises: {
                Row: {
                    id: string;
                    name: string;
                    sec: number;
                    emoji: string;
                    has_split: boolean;
                    description: string | null;
                    class_levels: string[];
                    created_by: string;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    name: string;
                    sec?: number;
                    emoji?: string;
                    has_split?: boolean;
                    description?: string | null;
                    class_levels?: string[];
                    created_by: string;
                };
                Update: Partial<Database['public']['Tables']['teacher_exercises']['Insert']>;
                Relationships: [];
            };
            teacher_menus: {
                Row: {
                    id: string;
                    name: string;
                    emoji: string;
                    description: string | null;
                    exercise_ids: string[];
                    class_levels: string[];
                    created_by: string;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    name: string;
                    emoji?: string;
                    description?: string | null;
                    exercise_ids?: string[];
                    class_levels?: string[];
                    created_by: string;
                };
                Update: Partial<Database['public']['Tables']['teacher_menus']['Insert']>;
                Relationships: [];
            };
            public_exercises: {
                Row: {
                    id: string;
                    name: string;
                    sec: number;
                    emoji: string;
                    has_split: boolean;
                    description: string | null;
                    author_name: string;
                    account_id: string;
                    download_count: number;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    name: string;
                    sec: number;
                    emoji?: string;
                    has_split?: boolean;
                    description?: string | null;
                    author_name: string;
                    account_id: string;
                    download_count?: number;
                };
                Update: Partial<Database['public']['Tables']['public_exercises']['Insert']>;
                Relationships: [];
            };
            exercise_downloads: {
                Row: {
                    exercise_id: string;
                    account_id: string;
                    downloaded_at: string;
                };
                Insert: {
                    exercise_id: string;
                    account_id: string;
                };
                Update: Partial<Database['public']['Tables']['exercise_downloads']['Insert']>;
                Relationships: [];
            };
            teacher_item_overrides: {
                Row: {
                    id: string;
                    item_id: string;
                    item_type: string;
                    name_override: string | null;
                    description_override: string | null;
                    emoji_override: string | null;
                    sec_override: number | null;
                    has_split_override: boolean | null;
                    exercise_ids_override: string[] | null;
                    created_by: string;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    item_id: string;
                    item_type: string;
                    name_override?: string | null;
                    description_override?: string | null;
                    emoji_override?: string | null;
                    sec_override?: number | null;
                    has_split_override?: boolean | null;
                    exercise_ids_override?: string[] | null;
                    created_by: string;
                };
                Update: Partial<Database['public']['Tables']['teacher_item_overrides']['Insert']>;
                Relationships: [];
            };
        };
        Views: Record<string, never>;
        Functions: {
            increment_download_count: {
                Args: { menu_id: string };
                Returns: undefined;
            };
            is_developer: {
                Args: Record<string, never>;
                Returns: boolean;
            };
            suspend_account: {
                Args: { target_account_id: string; is_suspended: boolean };
                Returns: undefined;
            };
            delete_account_data: {
                Args: { target_account_id: string };
                Returns: undefined;
            };
            fetch_active_public_menus: {
                Args: { sort_by?: string; max_count?: number };
                Returns: Database['public']['Tables']['public_menus']['Row'][];
            };
            fetch_active_public_exercises: {
                Args: { sort_by?: string; max_count?: number };
                Returns: Database['public']['Tables']['public_exercises']['Row'][];
            };
            try_increment_download_count: {
                Args: { target_menu_id: string; downloader_account_id: string };
                Returns: boolean;
            };
            try_increment_exercise_download_count: {
                Args: { target_exercise_id: string; downloader_account_id: string };
                Returns: boolean;
            };
            teacher_delete_family_member: {
                Args: { target_member_id: string };
                Returns: undefined;
            };
        };
    };
}
