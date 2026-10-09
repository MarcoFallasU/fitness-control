'use client';
import { useEffect } from 'react';
import { usePreferences } from '@/lib/preferences';
import { isWallpaperId } from '@/lib/wallpapers';

/**
 * Keeps <html data-wallpaper> in sync with the saved choice. With no attribute ("auto"),
 * globals.css picks the wallpaper from the system color scheme. The first paint is handled by
 * the inline script in layout.tsx, this component handles changes afterwards.
 */
export function WallpaperApplier() {
    const { wallpaper } = usePreferences();
    useEffect(() => {
        const root = document.documentElement;
        if (isWallpaperId(wallpaper))
            root.setAttribute('data-wallpaper', wallpaper);
        else
            root.removeAttribute('data-wallpaper');
    }, [wallpaper]);
    return null;
}
