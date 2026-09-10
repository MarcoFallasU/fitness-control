'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Ruler, Dumbbell, Flame, LogOut, } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { logoutAction } from '@/app/(app)/actions';
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
    const NavLinks = () => (<nav className="flex flex-col gap-1">
      {NAV.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (<Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold tracking-wide transition-colors ${active
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}`}>
            <Icon className="size-5 shrink-0"/>
            {item.label}
          </Link>);
        })}
    </nav>);
    return (<div className="flex min-h-screen">

      <aside className="glass sticky top-4 m-4 hidden h-[calc(100vh-2rem)] w-64 shrink-0 flex-col justify-between rounded-3xl p-5 lg:flex">
        <div>
          <Link href="/dashboard" className="mb-8 block px-1">
            <span className="font-heading text-2xl font-extrabold tracking-tight">
              Gymbros
            </span>
          </Link>
          <NavLinks />
        </div>
        <div className="glass rounded-2xl p-3">
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
          <form action={logoutAction}>
            <button type="submit" className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
              <LogOut className="size-4"/>
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>


      <div className="flex min-w-0 flex-1 flex-col">
        <header className="glass sticky top-4 z-40 mx-4 mt-4 flex items-center justify-between rounded-2xl px-4 py-3 lg:hidden">
          <Link href="/dashboard">
            <span className="font-heading text-xl font-extrabold tracking-tight">
              Gymbros
            </span>
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
            <form action={logoutAction}>
              <button type="submit" className="flex w-full items-center gap-2 rounded-xl px-4 py-3 text-sidebar-foreground/70 hover:bg-sidebar-accent">
                <LogOut className="size-4"/>
                Cerrar sesión
              </button>
            </form>
          </div>)}

        <main className="min-w-0 flex-1 pb-28 lg:pb-0">{children}</main>

        <nav className="glass-nav fixed inset-x-4 bottom-4 z-40 flex items-center justify-around rounded-2xl px-2 py-2 lg:hidden">
          {NAV.map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;
                return (<Link key={item.href} href={item.href} className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-semibold transition-colors ${active ? 'text-brand' : 'text-sidebar-foreground/50'}`}>
              <Icon className="size-5"/>
              {item.label}
            </Link>);
            })}
        </nav>
      </div>
    </div>);
}
