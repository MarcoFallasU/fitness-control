import { Analytics } from '@vercel/analytics/next';
import type { Metadata } from 'next';
import { Manrope, Roboto_Mono } from 'next/font/google';
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
    title: 'IRONLOG — Seguimiento de progreso físico',
    description: 'Rastrea tus medidas, rutinas y calorías. Una app de progreso físico de alto impacto para dos atletas.',
    generator: 'v0.app',
};
export default function RootLayout({ children, }: Readonly<{
    children: React.ReactNode;
}>) {
    return (<html lang="es" className={`${manrope.variable} ${robotoMono.variable} bg-background`}>
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>);
}
