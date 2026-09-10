'use client';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, } from 'recharts';
const AXIS = 'rgba(255,255,255,0.45)';
const GRID = 'rgba(255,255,255,0.08)';
interface TooltipProps {
    active?: boolean;
    payload?: {
        name: string;
        value: number;
        color: string;
    }[];
    label?: string;
    unit?: string;
}
function ChartTooltip({ active, payload, label, unit }: TooltipProps) {
    if (!active || !payload?.length)
        return null;
    return (<div className="glass-strong rounded-xl px-3 py-2 text-popover-foreground shadow-lg">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      {payload.map((p) => (<p key={p.name} className="text-sm font-semibold" style={{ color: p.color }}>
          {p.name}: {p.value}
          {unit ?? ''}
        </p>))}
    </div>);
}
interface Series {
    key: string;
    name: string;
    color: string;
}
interface LineChartProps {
    data: Record<string, string | number>[];
    xKey: string;
    series: Series[];
    unit?: string;
    height?: number;
    showLegend?: boolean;
}
export function ThemedLineChart({ data, xKey, series, unit, height = 280, showLegend = true, }: LineChartProps) {
    if (!data.length) {
        return <EmptyChart height={height}/>;
    }
    return (<ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid stroke={GRID} vertical={false}/>
        <XAxis dataKey={xKey} stroke={AXIS} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={24}/>
        <YAxis stroke={AXIS} tick={{ fontSize: 11 }} tickLine={false} axisLine={false}/>
        <Tooltip content={<ChartTooltip unit={unit}/>}/>
        {showLegend && series.length > 1 && (<Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }}/>)}
        {series.map((s) => (<Line key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} connectNulls/>))}
      </LineChart>
    </ResponsiveContainer>);
}
interface BarChartProps {
    data: Record<string, string | number>[];
    xKey: string;
    series: Series[];
    unit?: string;
    height?: number;
    showLegend?: boolean;
}
export function ThemedBarChart({ data, xKey, series, unit, height = 280, showLegend = false, }: BarChartProps) {
    if (!data.length) {
        return <EmptyChart height={height}/>;
    }
    return (<ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid stroke={GRID} vertical={false}/>
        <XAxis dataKey={xKey} stroke={AXIS} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={16}/>
        <YAxis stroke={AXIS} tick={{ fontSize: 11 }} tickLine={false} axisLine={false}/>
        <Tooltip cursor={{ fill: 'rgba(255,255,255,0.06)' }} content={<ChartTooltip unit={unit}/>}/>
        {showLegend && series.length > 1 && (<Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }}/>)}
        {series.map((s) => (<Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} radius={[3, 3, 0, 0]}/>))}
      </BarChart>
    </ResponsiveContainer>);
}
function EmptyChart({ height }: {
    height: number;
}) {
    return (<div className="flex items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground" style={{ height }}>
      Sin datos para mostrar
    </div>);
}
