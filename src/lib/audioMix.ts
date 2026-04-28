export const normalizeSpeechText = (text: string) =>
    // Some browser voices misread `次は` as `じは`, so normalize only the spoken form.
    text.replace(/次は/gu, 'つぎは');

const clampVolume = (volume: number) => Math.max(0, Math.min(1, volume));

export const getSpeechVolume = (soundVolume: number) => {
    const clamped = clampVolume(soundVolume);
    if (clamped === 0) return 0;

    // Speech synthesis is quieter than Web Audio on many mobile devices,
    // so keep a small boost while still letting the slider behave predictably.
    return Math.min(1, 0.2 + clamped * 0.8);
};

export const getEffectsVolume = (soundVolume: number) => {
    const clamped = clampVolume(soundVolume);
    if (clamped === 0) return 0;

    // Let short cues punch through more clearly, especially on small mobile speakers.
    return Math.min(1.15, 0.4 + clamped * 0.75);
};

export const getBgmMixVolume = (bgmVolume: number) => {
    const clamped = clampVolume(bgmVolume);
    if (clamped === 0) return 0;

    // Give the lower half of the slider more usable range so BGM sits behind guidance more easily.
    return Math.pow(clamped, 1.45) * 0.225;
};

export const getBgmDuckMultiplier = ({
    speechActive,
    effectActive,
}: {
    speechActive: boolean;
    effectActive: boolean;
}) => {
    const speechMultiplier = speechActive ? 0.08 : 1;
    const effectMultiplier = effectActive ? 0.1 : 1;
    return Math.min(speechMultiplier, effectMultiplier);
};
