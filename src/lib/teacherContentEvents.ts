const TEACHER_CONTENT_UPDATED_EVENT = 'teacherContentUpdated';

export function dispatchTeacherContentUpdated(): void {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new Event(TEACHER_CONTENT_UPDATED_EVENT));
}

export function subscribeTeacherContentUpdated(listener: () => void): () => void {
    if (typeof window === 'undefined') {
        return () => {};
    }

    window.addEventListener(TEACHER_CONTENT_UPDATED_EVENT, listener);
    return () => {
        window.removeEventListener(TEACHER_CONTENT_UPDATED_EVENT, listener);
    };
}
