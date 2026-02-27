import { supabase } from './supabase';

const BUCKET = 'avatars';

export async function resizeImage(
    file: File,
    maxSize = 200,
    quality = 0.7
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(url);
            // Center-crop to square
            const min = Math.min(img.width, img.height);
            const sx = (img.width - min) / 2;
            const sy = (img.height - min) / 2;

            const canvas = document.createElement('canvas');
            canvas.width = maxSize;
            canvas.height = maxSize;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, sx, sy, min, min, 0, 0, maxSize, maxSize);

            canvas.toBlob(
                (blob) => {
                    if (blob) resolve(blob);
                    else reject(new Error('Canvas toBlob failed'));
                },
                'image/jpeg',
                quality
            );
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image'));
        };
        img.src = url;
    });
}

export async function uploadAvatar(
    accountId: string,
    memberId: string,
    blob: Blob
): Promise<string> {
    if (!supabase) throw new Error('Supabase not configured');

    const path = `${accountId}/${memberId}.jpg`;

    const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, blob, {
            contentType: 'image/jpeg',
            upsert: true,
            cacheControl: '3600',
        });

    if (error) throw error;

    const { data } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(path);

    return `${data.publicUrl}?t=${Date.now()}`;
}

export async function deleteAvatar(
    accountId: string,
    memberId: string
): Promise<void> {
    if (!supabase) return;
    const path = `${accountId}/${memberId}.jpg`;
    await supabase.storage.from(BUCKET).remove([path]);
}
