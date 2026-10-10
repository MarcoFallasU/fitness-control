const SOURCES = {
    horizontal: { src: '/brand/gymbros-horizontal-white.svg', ratio: 1019 / 256 },
    symbol: { src: '/brand/gymbros-symbol-white.svg', ratio: 1 },
    'symbol-small': { src: '/brand/gymbros-symbol-small-white.svg', ratio: 1 },
} as const;

interface BrandLogoProps {
    variant?: keyof typeof SOURCES;
    height: number;
    className?: string;
}

export function BrandLogo({ variant = 'horizontal', height, className }: BrandLogoProps) {
    const { src, ratio } = SOURCES[variant];
    return (<img src={src} alt="GYM BROS" width={Math.round(height * ratio)} height={height} className={className} style={{ filter: 'drop-shadow(0 1px 6px rgba(0, 0, 0, 0.3))' }}/>);
}
