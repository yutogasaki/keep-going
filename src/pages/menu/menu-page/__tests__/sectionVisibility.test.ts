import { describe, expect, it } from 'vitest';
import { toggleMenuSection } from '../sectionVisibility';

describe('toggleMenuSection', () => {
    it('opens only the selected section', () => {
        expect(toggleMenuSection({}, 'teacher', true)).toEqual({
            standard: false,
            teacher: true,
            custom: false,
        });
    });

    it('closes the selected section without reopening others', () => {
        expect(toggleMenuSection({
            standard: false,
            teacher: true,
            custom: false,
        }, 'teacher', false)).toEqual({
            standard: false,
            teacher: false,
            custom: false,
        });
    });

    it('switches from one open section to another', () => {
        expect(toggleMenuSection({
            standard: true,
            teacher: false,
            custom: false,
        }, 'custom', true)).toEqual({
            standard: false,
            teacher: false,
            custom: true,
        });
    });
});
