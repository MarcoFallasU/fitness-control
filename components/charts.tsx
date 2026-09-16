'use client';
import dynamic from 'next/dynamic';

function ChartSkeleton() {
    return <div className="h-[280px] w-full animate-pulse rounded-md bg-muted/40"/>;
}

export const ThemedLineChart = dynamic(() => import('@/components/charts-impl').then((m) => m.ThemedLineChart), { ssr: false, loading: ChartSkeleton });

export const ThemedBarChart = dynamic(() => import('@/components/charts-impl').then((m) => m.ThemedBarChart), { ssr: false, loading: ChartSkeleton });
