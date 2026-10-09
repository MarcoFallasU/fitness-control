'use client';
import { useState } from 'react';
import { Check, LogOut } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { logoutAction } from '@/app/(app)/actions';
import { changePasswordAction, updateProfileAction } from '@/app/(app)/settings/actions';
import { PageHeader } from '@/components/page-header';
import { SectionCard } from '@/components/section-card';
import { Spinner } from '@/components/ui/spinner';
import { SubmitButton } from '@/components/ui/submit-button';
import { setPreferences, usePreferences } from '@/lib/preferences';

const COLORS = ['#fabc00', '#3c78ff', '#8fe0a8', '#ff7a7a', '#c084fc', '#38bdf8', '#fb923c', '#f472b6'];
const REST_OPTIONS: { label: string; value: number | null }[] = [
    { label: 'Sin objetivo', value: null },
    { label: '1 min', value: 60 },
    { label: '1.5 min', value: 90 },
    { label: '2 min', value: 120 },
    { label: '3 min', value: 180 },
];

const inputClass = 'w-full rounded-2xl border border-input bg-white/5 px-4 py-3 text-foreground outline-none transition-colors focus:border-ring';
const labelClass = 'text-[11px] font-bold uppercase tracking-widest text-muted-foreground';
const primaryBtn = 'bg-brand inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 font-heading text-sm font-extrabold disabled:opacity-70';

function Switch({ checked, onChange, label }: {
    checked: boolean;
    onChange: (v: boolean) => void;
    label: string;
}) {
    return (<button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} className="relative h-8 w-[62px] shrink-0 cursor-pointer rounded-full transition-colors" style={{
            background: checked ? 'var(--lg-track-on)' : 'var(--lg-track-off)',
            boxShadow: 'inset 1px 1px 1px rgba(255,255,255,.5), inset 0 0 0 1px rgba(255,255,255,.28), inset 0 2px 6px rgba(0,0,0,.15)',
        }}>
      <span className="absolute top-0.5 h-7 w-9 rounded-full" style={{
            left: checked ? 24 : 2,
            background: 'rgba(255,255,255,.85)',
            boxShadow: 'inset 1px 1px 1px #fff, 0 2px 6px rgba(0,0,0,.2)',
            transition: 'left .22s cubic-bezier(.3,1.4,.5,1)',
        }}/>
    </button>);
}

function Feedback({ error, ok }: {
    error: string;
    ok: string;
}) {
    if (error)
        return <p className="text-sm font-semibold text-destructive" role="alert">{error}</p>;
    if (ok)
        return <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--lime)]"><Check className="size-4"/>{ok}</p>;
    return null;
}

function ProfileSection() {
    const { user } = useAuth();
    const [name, setName] = useState(user.displayName);
    const [color, setColor] = useState(user.color);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [ok, setOk] = useState('');

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setOk('');
        setSaving(true);
        const result = await updateProfileAction(name, color);
        setSaving(false);
        if (result.error)
            setError(result.error);
        else
            setOk('Perfil actualizado.');
    }

    return (<SectionCard title="Perfil">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-full font-heading text-xl font-extrabold text-ink" style={{ backgroundColor: color }}>
            {(name.trim()[0] ?? '?').toUpperCase()}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <label htmlFor="displayName" className={labelClass}>Nombre</label>
            <input id="displayName" value={name} maxLength={30} onChange={(e) => setName(e.target.value)} className={inputClass}/>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className={labelClass}>Color</span>
          <div className="flex flex-wrap gap-2.5">
            {COLORS.map((c) => (<button key={c} type="button" aria-label={`Color ${c}`} aria-pressed={color === c} onClick={() => setColor(c)} className="flex size-9 items-center justify-center rounded-full border-2 transition-transform hover:scale-110" style={{ backgroundColor: c, borderColor: color === c ? '#fff' : 'transparent' }}>
                {color === c && <Check className="size-4 text-ink"/>}
              </button>))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={saving} className={primaryBtn}>
            {saving && <Spinner/>}
            {saving ? 'Guardando…' : 'Guardar perfil'}
          </button>
          <Feedback error={error} ok={ok}/>
        </div>
      </form>
    </SectionCard>);
}

function PasswordSection() {
    const [current, setCurrent] = useState('');
    const [next, setNext] = useState('');
    const [confirm, setConfirm] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [ok, setOk] = useState('');

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setOk('');
        if (next !== confirm) {
            setError('Las contraseñas nuevas no coinciden.');
            return;
        }
        setSaving(true);
        const result = await changePasswordAction(current, next);
        setSaving(false);
        if (result.error) {
            setError(result.error);
            return;
        }
        setCurrent('');
        setNext('');
        setConfirm('');
        setOk('Contraseña actualizada.');
    }

    return (<SectionCard title="Cambiar contraseña">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="currentPassword" className={labelClass}>Contraseña actual</label>
          <input id="currentPassword" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} className={inputClass} required/>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="newPassword" className={labelClass}>Nueva contraseña</label>
            <input id="newPassword" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} className={inputClass} required minLength={6}/>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="confirmPassword" className={labelClass}>Repetir nueva</label>
            <input id="confirmPassword" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputClass} required minLength={6}/>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={saving} className={primaryBtn}>
            {saving && <Spinner/>}
            {saving ? 'Guardando…' : 'Cambiar contraseña'}
          </button>
          <Feedback error={error} ok={ok}/>
        </div>
      </form>
    </SectionCard>);
}

function PreferencesSection() {
    const prefs = usePreferences();
    return (<SectionCard title="Preferencias del dispositivo">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2.5">
          <span className={labelClass}>Descanso por defecto</span>
          <div className="flex flex-wrap gap-2">
            {REST_OPTIONS.map((o) => (<button key={o.label} type="button" aria-pressed={prefs.restSeconds === o.value} onClick={() => setPreferences({ restSeconds: o.value })} className={`rounded-full border border-[var(--glass-border)] px-3.5 py-2 text-xs font-bold ${prefs.restSeconds === o.value ? 'bg-[var(--lg-fill-active)] shadow-[var(--lg-active-shadow)]' : 'bg-white/[0.06] text-muted-foreground'}`}>
                {o.label}
              </button>))}
          </div>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold">Vibrar al terminar el descanso</p>
            <p className="text-xs text-muted-foreground">Solo en dispositivos compatibles.</p>
          </div>
          <Switch checked={prefs.vibrate} onChange={(v) => setPreferences({ vibrate: v })} label="Vibrar al terminar el descanso"/>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold">Reducir efectos de vidrio</p>
            <p className="text-xs text-muted-foreground">Desactiva la refracción de bordes; útil si la app va lenta.</p>
          </div>
          <Switch checked={prefs.reduceEffects} onChange={(v) => setPreferences({ reduceEffects: v })} label="Reducir efectos de vidrio"/>
        </div>
      </div>
    </SectionCard>);
}

export function SettingsView() {
    return (<div className="pb-16">
      <PageHeader eyebrow="CUENTA" title="Configuración"/>
      <div className="mx-auto flex max-w-2xl flex-col gap-5 px-5 py-6 sm:px-8 lg:mx-0 lg:px-12">
        <ProfileSection/>
        <PasswordSection/>
        <PreferencesSection/>
        <form action={logoutAction}>
          <SubmitButton className="inline-flex items-center gap-2 rounded-full border border-border bg-[var(--lg-fill-danger)] px-6 py-3 text-sm font-bold">
            <LogOut className="size-4"/>
            Cerrar sesión
          </SubmitButton>
        </form>
      </div>
    </div>);
}
