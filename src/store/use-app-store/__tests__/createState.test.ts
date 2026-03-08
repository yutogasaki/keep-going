import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createStore } from 'zustand/vanilla';
import { createAppState } from '../createState';
import type { AppState } from '../types';

vi.mock('../../../lib/db', () => ({
    getTodayKey: vi.fn(() => '2026-03-07'),
}));

const MOCK_UUID = 'store-test-uuid';
vi.stubGlobal('crypto', {
    randomUUID: () => MOCK_UUID,
});

function makeStore() {
    return createStore<AppState>()(createAppState);
}

beforeEach(() => {
    vi.restoreAllMocks();
});

describe('session resume state', () => {
    it('startSession resumes the same-day draft for the same users', () => {
        const store = makeStore();

        store.setState({
            currentTab: 'record',
            sessionUserIds: ['user-1'],
            sessionDraft: {
                date: '2026-03-07',
                exerciseIds: ['S01', 'S02'],
                userIds: ['user-1'],
                returnTab: 'home',
            },
        });

        store.getState().startSession();

        expect(store.getState().isInSession).toBe(true);
        expect(store.getState().sessionExerciseIds).toEqual(['S01', 'S02']);
        expect(store.getState().sessionReturnTab).toBe('home');
        expect(store.getState().sessionKind).toBe('auto');
    });

    it('startSession ignores stale drafts and starts a fresh auto session', () => {
        const store = makeStore();

        store.setState({
            currentTab: 'record',
            sessionUserIds: ['user-1'],
            sessionDraft: {
                date: '2026-03-06',
                exerciseIds: ['S01', 'S02'],
                userIds: ['user-1'],
                returnTab: 'home',
            },
        });

        store.getState().startSession();

        expect(store.getState().isInSession).toBe(true);
        expect(store.getState().sessionExerciseIds).toBeNull();
        expect(store.getState().sessionReturnTab).toBe('record');
        expect(store.getState().sessionKind).toBe('auto');
    });

    it('startSession ignores drafts for different user selections', () => {
        const store = makeStore();

        store.setState({
            currentTab: 'menu',
            sessionUserIds: ['user-2'],
            sessionDraft: {
                date: '2026-03-07',
                exerciseIds: ['S01'],
                userIds: ['user-1'],
                returnTab: 'home',
            },
        });

        store.getState().startSession();

        expect(store.getState().sessionExerciseIds).toBeNull();
        expect(store.getState().sessionReturnTab).toBe('menu');
        expect(store.getState().sessionKind).toBe('auto');
    });

    it('startSessionWithExercises prepares a home return draft', () => {
        const store = makeStore();

        store.setState({
            currentTab: 'menu',
            sessionUserIds: ['user-1', 'user-2'],
        });

        store.getState().startSessionWithExercises(['S03', 'S04']);

        expect(store.getState().isInSession).toBe(true);
        expect(store.getState().sessionExerciseIds).toEqual(['S03', 'S04']);
        expect(store.getState().sessionReturnTab).toBe('home');
        expect(store.getState().sessionKind).toBe('fixed');
        expect(store.getState().sessionDraft).toEqual({
            date: '2026-03-07',
            exerciseIds: ['S03', 'S04'],
            userIds: ['user-1', 'user-2'],
            returnTab: 'home',
        });
    });

    it('completeSession clears the draft after an auto session finishes', () => {
        const store = makeStore();

        store.setState({
            currentTab: 'home',
            previousTab: 'record',
            isInSession: true,
            sessionExerciseIds: ['S01', 'S02'],
            sessionReturnTab: 'home',
            sessionKind: 'auto',
            sessionDraft: {
                date: '2026-03-07',
                exerciseIds: ['S01', 'S02'],
                userIds: ['user-1'],
                returnTab: 'home',
            },
        });

        store.getState().completeSession();

        expect(store.getState().isInSession).toBe(false);
        expect(store.getState().sessionExerciseIds).toBeNull();
        expect(store.getState().sessionDraft).toBeNull();
        expect(store.getState().sessionKind).toBeNull();
    });

    it('completeSession returns to the configured tab without clearing a fixed-session draft', () => {
        const store = makeStore();

        store.setState({
            currentTab: 'menu',
            previousTab: 'record',
            isInSession: true,
            sessionExerciseIds: ['S01'],
            sessionReturnTab: 'home',
            sessionKind: 'fixed',
            sessionDraft: {
                date: '2026-03-07',
                exerciseIds: ['S01'],
                userIds: ['user-1'],
                returnTab: 'home',
            },
        });

        store.getState().completeSession();

        expect(store.getState().isInSession).toBe(false);
        expect(store.getState().sessionExerciseIds).toBeNull();
        expect(store.getState().currentTab).toBe('home');
        expect(store.getState().previousTab).toBe('menu');
        expect(store.getState().sessionDraft).not.toBeNull();
        expect(store.getState().sessionKind).toBeNull();
    });
});
