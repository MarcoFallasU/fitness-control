'use client';
import Link from 'next/link';
import { ArrowRight, Ruler, Dumbbell, Flame, LineChart, Trophy, Users } from 'lucide-react';
const FEATURES = [
    {
        icon: Ruler,
        title: 'Medidas corporales',
        body: 'Registra cada zona cuando quieras y mira tu evolución centímetro a centímetro.',
    },
    {
        icon: Dumbbell,
        title: 'Rutinas y ejercicios',
        body: 'Crea rutinas, registra ejecuciones y rastrea el peso que mueves en cada sesión.',
    },
    {
        icon: Flame,
        title: 'Calorías diarias',
        body: 'Un registro por día con promedios semanales, mensuales y anuales.',
    },
    {
        icon: LineChart,
        title: 'Reportes visuales',
        body: 'Gráficas de progreso para entender qué funciona y qué no.',
    },
    {
        icon: Trophy,
        title: 'Records personales',
        body: 'Tus PR siempre a la vista. Cada kilo cuenta.',
    },
    {
        icon: Users,
        title: 'Dos atletas',
        body: 'Compara tu rendimiento contra tu rival de entrenamiento.',
    },
];
const MARQUEE = ['FUERZA', 'CONSTANCIA', 'PROGRESO', 'POTENCIA', 'DISCIPLINA', 'RECORDS'];
export function Landing() {
    return (<main className="min-h-screen overflow-hidden bg-background text-foreground">
      
      <header className="relative z-20 flex items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <span className="font-heading text-3xl tracking-tight">
          GYM<span className="text-brand">BROS</span>
        </span>
        <Link href="/login" className="rounded-md bg-primary px-5 py-2.5 font-heading text-sm uppercase tracking-widest text-primary-foreground transition-transform hover:-translate-y-0.5">
          Entrar
        </Link>
      </header>

      
      <section className="relative px-5 pb-20 pt-10 sm:px-8 lg:px-12 lg:pt-16">
        <div className="texture-dots pointer-events-none absolute inset-0 opacity-60"/>
        
        <span aria-hidden className="text-stroke pointer-events-none absolute -right-6 top-24 select-none font-heading text-[8rem] leading-none opacity-[0.06] sm:text-[14rem] lg:text-[20rem]">
          GYM
        </span>

        <div className="relative">
          <p className="animate-rise mb-4 font-mono text-xs uppercase tracking-[0.4em] text-secondary">
            Seguimiento de progreso físico
          </p>
          <h1 className="font-heading text-[3.5rem] uppercase leading-[0.95] tracking-tight text-balance sm:text-8xl lg:text-[9rem]">
            <span className="animate-rise block" style={{ animationDelay: '60ms' }}>
              Levanta
            </span>
            <span className="animate-rise block text-brand" style={{ animationDelay: '140ms' }}>
              registra
            </span>
            <span className="animate-rise relative z-10 block" style={{ animationDelay: '220ms' }}>
              <span className="text-secondary">supera</span>
            </span>
          </h1>

          <div className="animate-rise mt-8 flex max-w-xl flex-col gap-6" style={{ animationDelay: '320ms' }}>
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              GYMBROS es tu cuaderno de entrenamiento de alto impacto. Mide tu cuerpo,
              construye rutinas, registra cada repetición y observa el progreso real en
              gráficas que no mienten.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/login" className="group inline-flex items-center gap-2 rounded-md bg-brand px-7 py-4 font-heading text-lg uppercase tracking-wide text-brand-foreground transition-transform hover:-translate-y-1">
                Empezar ahora
                <ArrowRight className="size-5 transition-transform group-hover:translate-x-1"/>
              </Link>
              <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                2 perfiles · 90 días de datos
              </span>
            </div>
          </div>
        </div>
      </section>

      
      <div className="relative border-y-2 border-foreground bg-primary py-4 text-primary-foreground">
        <div className="flex w-max animate-marquee gap-8 whitespace-nowrap">
          {[...MARQUEE, ...MARQUEE, ...MARQUEE, ...MARQUEE].map((word, i) => (<span key={i} className="flex items-center gap-8 font-heading text-2xl uppercase tracking-wide">
              {word}
              <span className="text-brand">/</span>
            </span>))}
        </div>
      </div>

      
      <section className="relative px-5 py-20 sm:px-8 lg:px-12">
        <div className="mb-12 flex items-end justify-between">
          <h2 className="font-heading text-4xl uppercase leading-none tracking-tight sm:text-6xl">
            Todo lo que<br />
            <span className="text-secondary">necesitas medir</span>
          </h2>
          <span className="hidden font-mono text-xs uppercase tracking-widest text-muted-foreground sm:block">
            (06) módulos
          </span>
        </div>

        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (<article key={f.title} className="group relative bg-card p-7 transition-colors hover:bg-primary hover:text-primary-foreground">
                <span className="absolute right-5 top-5 font-mono text-xs text-muted-foreground group-hover:text-primary-foreground/50">
                  0{i + 1}
                </span>
                <Icon className="size-9 text-secondary transition-colors group-hover:text-brand"/>
                <h3 className="mt-5 font-heading text-2xl uppercase tracking-wide">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground group-hover:text-primary-foreground/70">
                  {f.body}
                </p>
              </article>);
        })}
        </div>
      </section>

      
      <section className="relative overflow-hidden bg-secondary px-5 py-24 text-secondary-foreground sm:px-8 lg:px-12">
        <div className="texture-diagonal pointer-events-none absolute inset-0 opacity-40"/>
        <div className="relative flex flex-col items-start gap-6">
          <h2 className="font-heading text-5xl uppercase leading-[0.85] tracking-tight text-balance sm:text-7xl lg:text-8xl">
            Deja de adivinar.<br />
            <span className="text-brand">Empieza a medir.</span>
          </h2>
          <Link href="/login" className="group inline-flex items-center gap-2 rounded-md bg-brand px-8 py-4 font-heading text-lg uppercase tracking-wide text-brand-foreground transition-transform hover:-translate-y-1">
            Iniciar sesión
            <ArrowRight className="size-5 transition-transform group-hover:translate-x-1"/>
          </Link>
        </div>
      </section>

      <footer className="bg-primary px-5 py-8 text-primary-foreground/60 sm:px-8 lg:px-12">
        <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
          <span className="font-heading text-xl tracking-tight text-primary-foreground">
            IRON<span className="text-brand">LOG</span>
          </span>
          <p className="font-mono text-xs uppercase tracking-widest">
            Cuaderno de entrenamiento · 2026
          </p>
        </div>
      </footer>
    </main>);
}
