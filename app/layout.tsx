import { Analytics } from '@vercel/analytics/next';
import type { Metadata, Viewport } from 'next';
import { Manrope, Roboto_Mono } from 'next/font/google';
import { PwaRegister } from '@/components/pwa-register';
import './globals.css';
const manrope = Manrope({
    variable: '--font-manrope',
    weight: ['500', '600', '700', '800'],
    subsets: ['latin'],
});
const robotoMono = Roboto_Mono({
    variable: '--font-roboto-mono',
    weight: ['500', '700'],
    subsets: ['latin'],
});
export const metadata: Metadata = {
    title: 'GYMBROS — Seguimiento de progreso físico',
    description: 'Rastrea tus medidas, rutinas y calorías. Una app de progreso físico de alto impacto para dos atletas.',
    generator: 'v0.app',
    manifest: '/manifest.webmanifest',
    icons: {
        icon: [
            { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
        apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
    },
    appleWebApp: {
        capable: true,
        statusBarStyle: 'black-translucent',
        title: 'Gymbros',
    },
};

export const viewport: Viewport = {
    themeColor: '#fabc00',
};
export default function RootLayout({ children, }: Readonly<{
    children: React.ReactNode;
}>) {
    return (<html lang="es" className={`${manrope.variable} ${robotoMono.variable} bg-background`}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes"/>
      </head>
      <body className="font-sans antialiased">
        {children}
        <PwaRegister/>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>);
}
