import type { toLocalUserFromCloudFamily } from '../mappers';

export const baseCloudFamily: Parameters<typeof toLocalUserFromCloudFamily>[0] = {
    id: 'user-1',
    name: 'テストちゃん',
    class_level: '初級',
    fuwafuwa_birth_date: '2026-03-01',
    fuwafuwa_type: 3,
    fuwafuwa_cycle_count: 2,
    fuwafuwa_name: 'ぽわぽわ',
    past_fuwafuwas: [],
    notified_fuwafuwa_stages: [1, 2],
    daily_target_minutes: 15,
    excluded_exercises: ['ex-hard'],
    required_exercises: ['ex-basic'],
    consumed_magic_seconds: 0,
    avatar_url: null,
    chibifuwas: [],
    account_id: 'account-1',
    created_at: '2026-03-17T00:00:00.000Z',
    updated_at: '2026-03-17T00:00:00.000Z',
};
