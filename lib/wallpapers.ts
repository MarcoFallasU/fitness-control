/** Wallpapers are CSS gradients defined in globals.css as --wp-<id>. 'auto' follows the system theme. */
export const WALLPAPERS = [
    { id: 'aurora', label: 'Aurora' },
    { id: 'midnight', label: 'Medianoche' },
    { id: 'sunset', label: 'Atardecer' },
    { id: 'ocean', label: 'Océano' },
    { id: 'forest', label: 'Bosque' },
    { id: 'dawn', label: 'Amanecer' },
] as const;

export type WallpaperId = (typeof WALLPAPERS)[number]['id'];
export type WallpaperChoice = WallpaperId | 'auto';

export const isWallpaperId = (v: unknown): v is WallpaperId => WALLPAPERS.some((w) => w.id === v);
