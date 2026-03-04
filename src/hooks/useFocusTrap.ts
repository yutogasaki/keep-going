import { useEffect, useRef } from 'react';

/**
 * Traps keyboard focus within a modal while it is open.
 * Returns a ref to attach to the modal container element.
 */
export function useFocusTrap<T extends HTMLElement>(open: boolean) {
    const ref = useRef<T>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!open) return;

        previousFocusRef.current = document.activeElement as HTMLElement;

        const el = ref.current;
        if (!el) return;

        const focusableSelector =
            'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;

            const focusable = el.querySelectorAll<HTMLElement>(focusableSelector);
            if (focusable.length === 0) {
                e.preventDefault();
                return;
            }

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (e.shiftKey) {
                if (document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                }
            } else {
                if (document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        };

        // Focus the first focusable element inside the modal
        requestAnimationFrame(() => {
            const focusable = el.querySelectorAll<HTMLElement>(focusableSelector);
            if (focusable.length > 0) {
                focusable[0].focus();
            }
        });

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            // Restore focus to previous element
            previousFocusRef.current?.focus();
        };
    }, [open]);

    return ref;
}
