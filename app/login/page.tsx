import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { LoginForm } from '@/components/login-form';

export default async function LoginPage() {
    const user = await getCurrentUser();
    if (user)
        redirect('/dashboard');
    return (<main className="flex min-h-screen items-center justify-center px-5 py-10">
      <div className="flex w-full max-w-4xl items-center gap-16">

        <section className="hidden flex-1 lg:block">
          <Link href="/" className="font-heading text-2xl font-extrabold tracking-tight">
            Gymbros
          </Link>
          <h1 className="font-heading mt-5 text-4xl font-extrabold leading-tight">
            Tu progreso,<br />en un solo lugar.
          </h1>
          <p className="mt-4 max-w-[26ch] text-sm leading-relaxed text-muted-foreground">
            Rastrea tus medidas, rutinas y calorías junto a tu compañero de entreno.
          </p>
        </section>

        <LoginForm />
      </div>
    </main>);
}
