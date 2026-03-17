export interface BgmTrack {
    id: string;
    label: string;
    src: string;
    gain: number;
}

const FRIENDLY_BGM_LABELS: Record<string, string> = {
    'Fairy Meadow Stretch': 'ようせいの はらっぱ',
    'Fairy Meadow Stretch(1)': 'ようせいの はらっぱ きらり',
    'Gentle Morning Stretch': 'あさの のびのび',
    'Gentle Morning Stretch(1)': 'あさの のびのび ひだまり',
    'Pixel Stretch Playground': 'ぴこぴこ ストレッチひろば',
    'Pixel Stretch Playground(1)': 'ぴこぴこ ストレッチひろば ダッシュ',
    'Sunshine Skipping Stones': 'おひさま みずあそび',
    'Sunshine Skipping Stones(1)': 'おひさま みずあそび きらきら',
    'Tiny Paws Parade': 'こねこの パレード',
    'Tiny Paws Parade(1)': 'こねこの パレード るんるん',
};

// Attenuate louder imported tracks so the Music folder feels more even at one slider value.
const BGM_TRACK_GAINS: Record<string, number> = {
    'Fairy Meadow Stretch': 0.88,
    'Fairy Meadow Stretch(1)': 0.82,
    'Gentle Morning Stretch': 0.87,
    'Gentle Morning Stretch(1)': 0.75,
    'Pixel Stretch Playground': 0.93,
    'Pixel Stretch Playground(1)': 0.83,
    'Sunshine Skipping Stones': 0.78,
    'Sunshine Skipping Stones(1)': 0.93,
    'Tiny Paws Parade': 1,
    'Tiny Paws Parade(1)': 0.9,
};

interface RawBgmTrack {
    id: string;
    baseLabel: string;
    sortLabel: string;
    src: string;
    gain: number;
    variantHint: number;
}

function getFileStem(filePath: string): string {
    return filePath.split('/').pop()?.replace(/\.mp3$/i, '') ?? filePath;
}

function normalizeTrackLabel(stem: string): string {
    return stem
        .replace(/\(\d+\)\s*$/u, '')
        .replace(/[_-]+/gu, ' ')
        .replace(/\s+/gu, ' ')
        .trim();
}

function getVariantHint(stem: string): number {
    const match = stem.match(/\((\d+)\)\s*$/u);
    if (!match) {
        return 0;
    }

    return Number.parseInt(match[1], 10) || 0;
}

function createTrackId(stem: string): string {
    const normalized = stem
        .toLowerCase()
        .replace(/\.mp3$/u, '')
        .replace(/[^a-z0-9]+/gu, '-')
        .replace(/^-+|-+$/gu, '');

    return normalized || 'bgm-track';
}

function getFriendlyTrackLabel(stem: string, fallbackLabel: string): string {
    return FRIENDLY_BGM_LABELS[stem] ?? fallbackLabel;
}

function getTrackGain(stem: string): number {
    return BGM_TRACK_GAINS[stem] ?? 1;
}

function buildTracks(): BgmTrack[] {
    const modules = import.meta.glob('../../Music/*.mp3', {
        eager: true,
        import: 'default',
    }) as Record<string, string>;

    const rawTracks = Object.entries(modules)
        .map(([filePath, src]) => {
            const stem = getFileStem(filePath);
            const baseLabel = normalizeTrackLabel(stem);

            return {
                id: createTrackId(stem),
                baseLabel: getFriendlyTrackLabel(stem, baseLabel),
                sortLabel: `${getFriendlyTrackLabel(stem, baseLabel)}\u0000${stem}`,
                src,
                gain: getTrackGain(stem),
                variantHint: getVariantHint(stem),
            } satisfies RawBgmTrack;
        })
        .sort((a, b) => {
            if (a.baseLabel === b.baseLabel) {
                if (a.variantHint !== b.variantHint) {
                    return a.variantHint - b.variantHint;
                }

                return a.id.localeCompare(b.id);
            }

            return a.sortLabel.localeCompare(b.sortLabel);
        });

    const counts = new Map<string, number>();
    for (const track of rawTracks) {
        counts.set(track.baseLabel, (counts.get(track.baseLabel) ?? 0) + 1);
    }

    const seen = new Map<string, number>();
    return rawTracks.map((track) => {
        const nextIndex = (seen.get(track.baseLabel) ?? 0) + 1;
        seen.set(track.baseLabel, nextIndex);

        return {
            id: track.id,
            label: (counts.get(track.baseLabel) ?? 0) > 1
                ? `${track.baseLabel} ${nextIndex}`
                : track.baseLabel,
            src: track.src,
            gain: track.gain,
        };
    });
}

export const BGM_TRACKS = buildTracks();
export const DEFAULT_BGM_TRACK_ID = BGM_TRACKS[0]?.id ?? '';

export function findBgmTrack(trackId: string | null | undefined): BgmTrack | null {
    if (typeof trackId === 'string' && trackId.length > 0) {
        const matched = BGM_TRACKS.find((track) => track.id === trackId);
        if (matched) {
            return matched;
        }
    }

    return BGM_TRACKS[0] ?? null;
}
