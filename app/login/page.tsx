import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { BrandLogo } from '@/components/brand-logo';
import { LoginForm } from '@/components/login-form';

export default async function LoginPage({ searchParams }: {
    searchParams: Promise<{ next?: string }>;
}) {
    const { next } = await searchParams;
    const user = await getCurrentUser();
    if (user)
        redirect(next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard');
    return (<main className="flex min-h-screen items-center justify-center px-5 py-10">
      <div className="flex w-full max-w-4xl items-center gap-16">

        <section className="hidden flex-1 lg:block">
          <Link href="/" className="inline-block" aria-label="GYM BROS">
            <BrandLogo height={48}/>
          </Link>
          <h1 className="font-heading mt-5 text-4xl font-extrabold leading-tight">
            Tu progreso,<br />en un solo lugar.
          </h1>
          <p className="mt-4 max-w-[26ch] text-sm leading-relaxed text-muted-foreground">
            Rastrea tus medidas, rutinas y calorías junto a tu compañero de entreno.
          </p>
        </section>

        <LoginForm next={next}/>
      </div>
    </main>);
}
