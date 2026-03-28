import { createContext, type Context } from 'react';

type GlobalContextStore = typeof globalThis & {
    __keepGoingContextStore__?: Record<string, Context<unknown>>;
};

export function getSingletonContext<T>(key: string, defaultValue: T): Context<T> {
    const globalStore = globalThis as GlobalContextStore;
    const contextStore = globalStore.__keepGoingContextStore__ ?? {};

    if (!globalStore.__keepGoingContextStore__) {
        globalStore.__keepGoingContextStore__ = contextStore;
    }

    const existing = contextStore[key] as Context<T> | undefined;
    if (existing) {
        return existing;
    }

    const context = createContext(defaultValue);
    contextStore[key] = context as Context<unknown>;
    return context;
}
