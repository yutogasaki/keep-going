const CUSTOM_CONTENT_UPDATED_EVENT = 'customContentUpdated';

export function dispatchCustomContentUpdated(): void {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new Event(CUSTOM_CONTENT_UPDATED_EVENT));
}

export function subscribeCustomContentUpdated(listener: () => void): () => void {
    if (typeof window === 'undefined') {
        return () => {};
    }

    window.addEventListener(CUSTOM_CONTENT_UPDATED_EVENT, listener);
    return () => {
        window.removeEventListener(CUSTOM_CONTENT_UPDATED_EVENT, listener);
    };
}
