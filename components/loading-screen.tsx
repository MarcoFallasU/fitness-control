import { BicepLoader } from '@/components/bicep-loader';

export function LoadingScreen() {
    return (<div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background">
      <BicepLoader className="h-28 w-28 text-primary sm:h-36 sm:w-36"/>
      <p className="font-heading text-sm font-bold uppercase tracking-[0.3em] text-muted-foreground">
        Cargando
      </p>
    </div>);
}
