import { describe, expect, it } from 'vitest';
import {
    buildPublicMenuExercisePreview,
    getPublicMenuBadgeLabel,
    getTeacherMenuLead,
} from './homeMenuUtils';

describe('homeMenuUtils', () => {
    it('prioritizes custom exercise discovery for public menu badges', () => {
        expect(getPublicMenuBadgeLabel({
            id: 'menu-1',
            name: 'みんなのメニュー',
            emoji: '🌍',
            description: '',
            exerciseIds: ['custom-1', 'S01'],
            customExerciseData: [
                {
                    id: 'custom-1',
                    name: 'きらきらストレッチ',
                    emoji: '✨',
                    sec: 45,
                    placement: 'stretch',
                },
            ],
            authorName: 'えま',
            accountId: 'account-1',
            downloadCount: 0,
            createdAt: '2026-03-01T00:00:00Z',
        }, new Date('2026-03-10T00:00:00Z').getTime())).toBe('みんなの種目あり');
    });

    it('builds teacher lead copy from recommendation state when description is empty', () => {
        expect(getTeacherMenuLead({
            id: 'teacher-1',
            name: '先生メニュー',
            emoji: '🩰',
            description: '',
            exerciseIds: ['S01'],
            classLevels: ['初級'],
            visibility: 'public',
            focusTags: [],
            recommended: true,
            recommendedOrder: 1,
            displayMode: 'teacher_section',
            createdBy: 'teacher-1',
            createdAt: '2026-02-01T00:00:00Z',
        }, new Date('2026-03-10T00:00:00Z').getTime())).toBe('先生がおすすめしているメニュー');
    });

    it('builds compact public menu previews with a remaining count', () => {
        expect(buildPublicMenuExercisePreview({
            id: 'menu-2',
            name: '公開メニュー',
            emoji: '🌸',
            description: '',
            exerciseIds: ['S01', 'S02', 'S03', 'S04'],
            customExerciseData: [],
            authorName: 'すず',
            accountId: 'account-2',
            downloadCount: 12,
            createdAt: '2026-03-05T00:00:00Z',
        })).toBe('開脚、前屈、前後開脚、+1');
    });
});
