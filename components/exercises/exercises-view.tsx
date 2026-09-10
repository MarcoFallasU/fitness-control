'use client';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { RoutinesPanel } from './routines-panel';
import { ProgressPanel } from './progress-panel';
import type { User, Routine, RoutineGroup, RoutineExecution } from '@/lib/types';
type Tab = 'routines' | 'progress';
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
    return (<div className="pb-16">
      <PageHeader eyebrow="ENTRENO" title="Rutinas y" highlight="ejercicios" description="Crea rutinas, registra cada ejecución y observa cómo crece el peso que mueves." action={tab === 'routines' ? (<button onClick={() => setNewRoutineSignal((s) => s + 1)} className="inline-flex items-center gap-2 rounded-md bg-brand px-5 py-3 font-heading text-base uppercase tracking-wide text-brand-foreground transition-transform hover:-translate-y-0.5">
              <Plus className="size-5"/>
              Nueva rutina
            </button>) : undefined}/>


      <div className="border-b border-border bg-card px-5 sm:px-8 lg:px-12">
        <div className="flex gap-1">
          {([
            { key: 'routines', label: 'Rutinas' },
            { key: 'progress', label: 'Progreso & PRs' },
        ] as {
            key: Tab;
            label: string;
        }[]).map((t) => (<button key={t.key} onClick={() => setTab(t.key)} className={`relative -mb-px border-b-2 px-4 py-4 font-heading text-lg uppercase tracking-wide transition-colors ${tab === t.key
                ? 'border-brand text-card-foreground'
                : 'border-transparent text-muted-foreground hover:text-card-foreground'}`}>
              {t.label}
            </button>))}
        </div>
      </div>

      <div className="px-5 py-8 sm:px-8 lg:px-12">
        {tab === 'routines' ? (<RoutinesPanel userId={me.id} other={other} routines={routines} groups={groups} executions={executions} activeExecutions={activeExecutions} otherActiveExecutions={otherActiveExecutions} newRoutineSignal={newRoutineSignal}/>) : (<ProgressPanel me={me} other={other} myExecutions={executions} otherExecutions={otherExecutions}/>)}
      </div>
    </div>);
}
