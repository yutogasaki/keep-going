import { describe, expect, it } from 'vitest';
import { buildMenuGroupItemsFromExerciseIds } from '../../data/menuGroups';
import {
    buildPublicMenuExercisePreview,
    getPublicMenuBadgeLabel,
    getTeacherExerciseLead,
    getTeacherMenuLead,
    pickTeacherExerciseDiscovery,
} from './homeMenuUtils';

describe('homeMenuUtils', () => {
    it('prioritizes custom exercise discovery for public menu badges', () => {
        expect(getPublicMenuBadgeLabel({
            id: 'menu-1',
            name: 'みんなのメニュー',
            emoji: '🌍',
            description: '',
            exerciseIds: ['custom-1', 'S01'],
            items: buildMenuGroupItemsFromExerciseIds(['custom-1', 'S01']),
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
            sourceMenuGroupId: null,
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
            items: buildMenuGroupItemsFromExerciseIds(['S01', 'S02', 'S03', 'S04']),
            customExerciseData: [],
            authorName: 'すず',
            accountId: 'account-2',
            downloadCount: 12,
            sourceMenuGroupId: null,
            createdAt: '2026-03-05T00:00:00Z',
        })).toBe('開脚、前屈、前後開脚、+1');
    });

    it('builds teacher exercise lead copy from new state when description is empty', () => {
        expect(getTeacherExerciseLead({
            id: 'teacher-ex-1',
            name: '先生の種目',
            sec: 45,
            emoji: '✨',
            placement: 'stretch',
            hasSplit: false,
            description: '',
            classLevels: ['初級'],
            visibility: 'public',
            focusTags: [],
            recommended: false,
            recommendedOrder: null,
            displayMode: 'teacher_section',
            createdBy: 'teacher-1',
            createdAt: '2026-03-09T00:00:00Z',
        }, new Date('2026-03-10T00:00:00Z').getTime())).toBe('先生から届いた新しい種目');
    });

    it('picks a new teacher-section exercise for home discovery', () => {
        expect(pickTeacherExerciseDiscovery([
            {
                id: 'teacher-ex-old',
                name: 'ふるい種目',
                sec: 30,
                emoji: '🪶',
                placement: 'stretch',
                hasSplit: false,
                description: '',
                classLevels: ['初級'],
                visibility: 'public',
                focusTags: [],
                recommended: false,
                recommendedOrder: null,
                displayMode: 'teacher_section',
                createdBy: 'teacher-1',
                createdAt: '2026-02-01T00:00:00Z',
            },
            {
                id: 'teacher-ex-inline',
                name: '標準欄の新しい種目',
                sec: 40,
                emoji: '🌟',
                placement: 'stretch',
                hasSplit: false,
                description: '',
                classLevels: ['初級'],
                visibility: 'public',
                focusTags: [],
                recommended: true,
                recommendedOrder: 1,
                displayMode: 'standard_inline',
                createdBy: 'teacher-1',
                createdAt: '2026-03-09T00:00:00Z',
            },
            {
                id: 'teacher-ex-new',
                name: '先生の新しい種目',
                sec: 50,
                emoji: '✨',
                placement: 'core',
                hasSplit: false,
                description: '',
                classLevels: ['初級'],
                visibility: 'public',
                focusTags: [],
                recommended: true,
                recommendedOrder: 1,
                displayMode: 'teacher_section',
                createdBy: 'teacher-1',
                createdAt: '2026-03-09T00:00:00Z',
            },
        ], new Date('2026-03-10T00:00:00Z').getTime())?.id).toBe('teacher-ex-new');
    });
});
