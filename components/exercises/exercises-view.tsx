'use client';
import { useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { RoutinesPanel } from './routines-panel';
import { ProgressPanel } from './progress-panel';
import { LiquidBubble, useLiquidBubble } from '@/components/ui/liquid-bubble';
import type { User, Routine, RoutineGroup, RoutineExecution } from '@/lib/types';
type Tab = 'routines' | 'progress';
const TABS: {
    key: Tab;
    label: string;
}[] = [
    { key: 'routines', label: 'Rutinas' },
    { key: 'progress', label: 'Progreso & PRs' },
];
interface ExercisesViewProps {
    me: User;
    other?: User;
    routines: Routine[];
    groups: RoutineGroup[];
    executions: RoutineExecution[];
    activeExecutions: RoutineExecution[];
    otherExecutions: RoutineExecution[];
    otherActiveExecutions: RoutineExecution[];
}
export function ExercisesView({ me, other, routines, groups, executions, activeExecutions, otherExecutions, otherActiveExecutions }: ExercisesViewProps) {
    const [tab, setTab] = useState<Tab>('routines');
    const [newRoutineSignal, setNewRoutineSignal] = useState(0);
    const tabsRef = useRef<HTMLDivElement>(null);
    const tabBubble = useLiquidBubble(tabsRef, tab);
    return (<div className="pb-16">
      <PageHeader eyebrow="ENTRENO" title="Rutinas y" highlight="ejercicios" action={tab === 'routines' ? (<button onClick={() => setNewRoutineSignal((s) => s + 1)} className="inline-flex items-center gap-2 rounded-md bg-brand px-5 py-3 font-heading text-base uppercase tracking-wide text-brand-foreground transition-transform hover:-translate-y-0.5">
              <Plus className="size-5"/>
              Nueva rutina
            </button>) : undefined}/>


      <div className="px-5 pt-4 sm:px-8 lg:px-12">
        <div ref={tabsRef} className="glass relative inline-flex gap-1 rounded-full p-1.5">
          <LiquidBubble box={tabBubble}/>
          {TABS.map((t) => (<button key={t.key} data-lg-item={t.key} aria-pressed={tab === t.key} onClick={() => setTab(t.key)} className={`relative min-w-32 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${tab === t.key ? 'text-white' : 'text-white/75 hover:text-white'}`}>
              {t.label}
            </button>))}
        </div>
      </div>

      <div className="px-5 py-8 sm:px-8 lg:px-12">
        {tab === 'routines' ? (<RoutinesPanel userId={me.id} other={other} routines={routines} groups={groups} executions={executions} activeExecutions={activeExecutions} otherActiveExecutions={otherActiveExecutions} newRoutineSignal={newRoutineSignal}/>) : (<ProgressPanel me={me} other={other} myExecutions={executions} otherExecutions={otherExecutions}/>)}
      </div>
    </div>);
}
