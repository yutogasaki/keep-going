import type { StateCreator } from 'zustand';
import type { AppState } from '../types';

export type AppStateSet = Parameters<StateCreator<AppState, [], [], AppState>>[0];
export type AppStateGet = Parameters<StateCreator<AppState, [], [], AppState>>[1];
