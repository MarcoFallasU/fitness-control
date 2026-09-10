'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { loginAction } from '@/app/login/actions';
export function LoginForm() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [pending, setPending] = useState(false);
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setPending(true);
        const result = await loginAction(username, password);
        setPending(false);
        if (result?.error) {
            setError(result.error);
        }
    }
    return (<section className="glass-strong w-full max-w-sm shrink-0 rounded-3xl p-8">
      <Link href="/" className="mb-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="size-4"/>
        Volver
      </Link>

      <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.2em] text-brand">
        Acceso de atletas
      </p>
      <h2 className="font-heading text-2xl font-extrabold">
        Iniciar sesión
      </h2>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="username" className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Usuario
          </label>
          <input id="username" type="text" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} className="rounded-2xl border border-input bg-white/5 px-4 py-3 text-foreground outline-none transition-colors focus:border-ring" placeholder="marco"/>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
            Contraseña
          </label>
          <input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="rounded-2xl border border-input bg-white/5 px-4 py-3 text-foreground outline-none transition-colors focus:border-ring" placeholder="••••••"/>
        </div>

        {error && (<p className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
            {error}
          </p>)}

        <button type="submit" disabled={pending} className="group mt-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-brand px-6 py-3.5 font-heading text-sm font-extrabold text-brand-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-60">
          {pending ? 'Entrando…' : 'Entrar'}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1"/>
        </button>
      </form>
    </section>);
}
