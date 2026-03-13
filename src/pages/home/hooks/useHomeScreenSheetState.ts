import { useState } from 'react';
import type { PublicExercise } from '../../../lib/publicExercises';
import type { PublicMenu } from '../../../lib/publicMenus';
import type { TeacherExercise, TeacherMenu } from '../../../lib/teacherContent';

export function useHomeScreenSheetState() {
    const [menuBrowserOpen, setMenuBrowserOpen] = useState(false);
    const [exerciseBrowserOpen, setExerciseBrowserOpen] = useState(false);
    const [selectedPublicMenu, setSelectedPublicMenu] = useState<PublicMenu | null>(null);
    const [selectedPublicExercise, setSelectedPublicExercise] = useState<PublicExercise | null>(null);
    const [selectedTeacherMenu, setSelectedTeacherMenu] = useState<TeacherMenu | null>(null);
    const [selectedTeacherExercise, setSelectedTeacherExercise] = useState<TeacherExercise | null>(null);

    return {
        exerciseBrowserOpen,
        menuBrowserOpen,
        selectedPublicExercise,
        selectedPublicMenu,
        selectedTeacherExercise,
        selectedTeacherMenu,
        setExerciseBrowserOpen,
        setMenuBrowserOpen,
        setSelectedPublicExercise,
        setSelectedPublicMenu,
        setSelectedTeacherExercise,
        setSelectedTeacherMenu,
    };
}
