'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Ruler, Dumbbell, Flame, LogOut, Settings, } from 'lucide-react';
import { useRef, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { logoutAction } from '@/app/(app)/actions';
import { BrandLogo } from '@/components/brand-logo';
import { SubmitButton } from '@/components/ui/submit-button';
import { LiquidBubble, useLiquidBubble } from '@/components/ui/liquid-bubble';
const NAV = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/measurements', label: 'Medidas', icon: Ruler },
    { href: '/exercises', label: 'Ejercicios', icon: Dumbbell },
    { href: '/calories', label: 'Calorías', icon: Flame },
];
export function AppShell({ children }: {
    children: React.ReactNode;
}) {
    const { user } = useAuth();
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    const activeHref = NAV.find((n) => n.href === pathname)?.href ?? null;
    const sideNavRef = useRef<HTMLElement>(null);
    const bottomNavRef = useRef<HTMLElement>(null);
    const sideBubble = useLiquidBubble(sideNavRef, activeHref, 'y');
    const bottomBubble = useLiquidBubble(bottomNavRef, activeHref, 'x');
    // Rendered inline (not as a component) so the nav keeps its identity and the bubble can animate between items.
    const navLinks = (<nav ref={sideNavRef} className="relative flex flex-col gap-1">
      <LiquidBubble box={sideBubble} radius={16}/>
      {NAV.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (<Link key={item.href} href={item.href} data-lg-item={item.href} onClick={() => setOpen(false)} className={`group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold tracking-wide transition-colors ${active
                    ? 'text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}`}>
            <Icon className="size-5 shrink-0"/>
            {item.label}
          </Link>);
        })}
    </nav>);
    return (<div className="flex min-h-screen">

      <aside className="glass sticky top-4 m-4 hidden h-[calc(100vh-2rem)] w-64 shrink-0 flex-col justify-between rounded-3xl p-5 lg:flex">
        <div>
          <Link href="/dashboard" className="mb-8 block px-1" aria-label="GYM BROS">
            <BrandLogo height={36}/>
          </Link>
          {navLinks}
        </div>
        <div className="rounded-2xl bg-white/10 p-3 shadow-[inset_1px_1px_1px_rgba(255,255,255,0.6)]">
          <div className="mb-3 flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full font-heading font-bold text-ink" style={{ backgroundColor: user.color }}>
              {user.displayName[0]}
            </span>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-semibold text-sidebar-foreground">
                {user.displayName}
              </p>
              <p className="truncate text-xs text-sidebar-foreground/50">@{user.username}</p>
            </div>
          </div>
          <Link href="/settings" className="mb-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <Settings className="size-4"/>
            Configuración
          </Link>
          <form action={logoutAction}>
            <SubmitButton className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
              <LogOut className="size-4"/>
              Cerrar sesión
            </SubmitButton>
          </form>
        </div>
      </aside>


      <div className="flex min-w-0 flex-1 flex-col">
        <header className="glass sticky top-4 z-40 mx-4 mt-4 flex items-center justify-between rounded-2xl px-4 py-3 lg:hidden">
          <Link href="/dashboard" aria-label="GYM BROS">
            <BrandLogo height={32}/>
          </Link>
          <button onClick={() => setOpen((v) => !v)} className="flex items-center rounded-full p-1 text-sidebar-foreground" aria-label="Cuenta">
            <span className="flex size-9 items-center justify-center rounded-full font-heading text-sm font-bold text-ink" style={{ backgroundColor: user.color }}>
              {user.displayName[0]}
            </span>
          </button>
        </header>

        {open && (<div className="glass-nav fixed inset-x-4 top-[88px] z-30 rounded-2xl p-5 lg:hidden">
            <div className="mb-3 flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full font-heading font-bold text-ink" style={{ backgroundColor: user.color }}>
                {user.displayName[0]}
              </span>
              <div className="min-w-0 leading-tight">
                <p className="truncate text-sm font-semibold text-sidebar-foreground">
                  {user.displayName}
                </p>
                <p className="truncate text-xs text-sidebar-foreground/50">@{user.username}</p>
              </div>
            </div>
            <Link href="/settings" onClick={() => setOpen(false)} className="flex w-full items-center gap-2 rounded-xl px-4 py-3 text-sidebar-foreground/70 hover:bg-sidebar-accent">
              <Settings className="size-4"/>
              Configuración
            </Link>
            <form action={logoutAction}>
              <SubmitButton className="flex w-full items-center gap-2 rounded-xl px-4 py-3 text-sidebar-foreground/70 hover:bg-sidebar-accent">
                <LogOut className="size-4"/>
                Cerrar sesión
              </SubmitButton>
            </form>
          </div>)}

        <main className="min-w-0 flex-1 pb-28 lg:pb-0">{children}</main>

        <nav ref={bottomNavRef} className="glass-nav fixed inset-x-4 bottom-4 z-40 flex items-center justify-around rounded-full px-2 py-2 lg:hidden">
          <LiquidBubble box={bottomBubble}/>
          {NAV.map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;
                return (<Link key={item.href} href={item.href} data-lg-item={item.href} className={`relative flex flex-1 flex-col items-center gap-1 rounded-full py-2 text-[11px] font-semibold transition-colors ${active ? 'text-white' : 'text-sidebar-foreground/70'}`}>
              <Icon className="size-5"/>
              {item.label}
            </Link>);
            })}
        </nav>
      </div>
    </div>);
}
