

interface ExerciseIconProps {
    id: string;      // The exercise ID (e.g. 'S01', 'C01')
    emoji: string;   // Fallback emoji
    size?: number;   // Icon size in pixels
    color?: string;  // Stroke color for the SVG
}

export const ExerciseIcon: React.FC<ExerciseIconProps> = ({ id, emoji, size = 32, color = '#E17055' }) => {
    // User preferred emojis over the SVG paths, so always use them.
    const useEmoji = true;

    if (useEmoji) {
        return (
            <span style={{
                fontSize: size,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1
            }}>
                {emoji}
            </span>
        );
    }

    // Mapping of Exercise IDs to premium line-art SVG paths.
    // We use a clean, monoline aesthetic (strokeWidth 2, rounded caps/joins).
    const renderPath = () => {
        switch (id) {
            // --- Stretches (S01 - S09) ---
            case 'S01': // 開脚 (Open Legs Split)
                return (
                    // Person sitting, legs spread, leaning forward
                    <>
                        <circle cx="12" cy="6" r="3" />
                        <path d="M12 9 L12 16" />
                        <path d="M12 11 L18 18 M12 11 L6 18" /> {/* Legs open */}
                        <path d="M12 10 L12 14" /> {/* Leaning torso */}
                        <path d="M12 10 L20 14 M12 10 L4 14" /> {/* Arms reaching forward */}
                    </>
                );
            case 'S02': // 前屈 (Forward Bend)
                return (
                    // Person sitting, legs straight, folding forward
                    <>
                        <circle cx="6" cy="14" r="3" />
                        <path d="M6 14 Q10 10 14 18" /> {/* Curved back */}
                        <path d="M14 18 L22 18" /> {/* Straight legs */}
                        <path d="M6 14 L18 16" /> {/* Arms reaching to toes */}
                    </>
                );
            case 'S03': // 前後開脚 (Front-to-Back Split)
                return (
                    // Person doing a front split
                    <>
                        <circle cx="12" cy="8" r="3" />
                        <path d="M12 11 L12 16" /> {/* Torso straight up */}
                        <path d="M12 16 L22 18 M12 16 L2 18" /> {/* Legs split front/back */}
                        <path d="M12 11 L16 16 M12 11 L8 16" /> {/* Arms resting down */}
                    </>
                );
            case 'S04': // ブリッジ (Bridge)
                return (
                    // Person in a bridge pose
                    <>
                        <circle cx="20" cy="14" r="3" />
                        <path d="M20 14 Q12 4 4 14" /> {/* Arched body */}
                        <path d="M4 14 L4 20 M20 14 L20 20" /> {/* Arms and legs planted */}
                    </>
                );
            case 'S05': // アシカさん (Seal Stretch / Cobra)
                return (
                    // Person laying on stomach, chest lifted
                    <>
                        <circle cx="18" cy="8" r="3" />
                        <path d="M18 11 Q12 18 4 18" /> {/* Back curve */}
                        <path d="M18 11 L14 18" /> {/* Arms pushing up */}
                        <path d="M4 18 L0 18" /> {/* Legs flat */}
                    </>
                );
            case 'S06': // ゆりかご (Cradle / Bow Pose)
                return (
                    // Person on stomach, holding ankles, curved like a bow
                    <>
                        <circle cx="20" cy="10" r="3" />
                        <path d="M20 13 Q12 22 4 13" /> {/* Curved body rock */}
                        <path d="M20 13 L12 8 M4 13 L12 8" /> {/* Arms pulling legs */}
                    </>
                );
            case 'S07': // ポイント&フレックス (Point & Flex)
                return (
                    // Focus on ankle/foot pointing and flexing
                    <>
                        <path d="M4 16 L12 16" /> {/* Leg */}
                        <path d="M12 16 L18 20" /> {/* Foot pointed */}
                        <path d="M12 16 L16 10" strokeDasharray="2 2" /> {/* Foot flexed (dashed for motion) */}
                    </>
                );
            case 'S08': // どんぐり (Acorn / Child's Pose variation or Rolling)
                return (
                    // Person balled up tight
                    <>
                        <circle cx="12" cy="12" r="8" />
                        <path d="M12 12 Q8 16 16 16" /> {/* Curled posture line inside */}
                    </>
                );
            case 'S09': // Y字バランス (Y-Balance)
                return (
                    // Person standing on one leg, holding the other high
                    <>
                        <circle cx="12" cy="6" r="3" />
                        <path d="M12 9 L12 16" /> {/* Torso */}
                        <path d="M12 16 L12 22" /> {/* Standing leg */}
                        <path d="M12 16 L4 6" /> {/* Raised leg */}
                        <path d="M12 9 L4 6" /> {/* Arm holding raised leg */}
                        <path d="M12 9 L18 12" /> {/* Other arm out for balance */}
                    </>
                );

            // --- Core (C01 - C02) ---
            case 'C01': // プランク (Plank)
                return (
                    // Person in forearm plank
                    <>
                        <circle cx="20" cy="8" r="3" />
                        <path d="M20 11 L4 16" /> {/* Straight rigid body line */}
                        <path d="M20 11 L20 16 L16 16" /> {/* Forearms planted */}
                        <path d="M4 16 L4 20" /> {/* Toes planted */}
                    </>
                );
            case 'C02': // サイドプランク (Side Plank)
                return (
                    // Person in side plank with arm raised
                    <>
                        <circle cx="18" cy="6" r="3" />
                        <path d="M18 9 L6 18" /> {/* Diagonal rigid body line */}
                        <path d="M18 9 L18 18" /> {/* Supporting arm */}
                        <path d="M18 9 L12 2" /> {/* Raised arm */}
                        <path d="M6 18 L2 20" /> {/* Feet planted */}
                    </>
                );

            // Default generic stretch or custom exercise
            default:
                return (
                    <>
                        <circle cx="12" cy="6" r="3" />
                        <path d="M12 9 L12 16" />
                        <path d="M12 16 L8 22 M12 16 L16 22" />
                        <path d="M12 10 L6 14 M12 10 L18 14" />
                    </>
                );
        }
    };

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
                flexShrink: 0,
                filter: `drop-shadow(0 2px 4px ${color}33)` // Subtle glow matching the stroke
            }}
        >
            {renderPath()}
        </svg>
    );
};
