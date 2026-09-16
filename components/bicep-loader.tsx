export function BicepLoader({ className }: { className?: string }) {
    return (<span className={`relative block ${className ?? ''}`}>
      <style>{`
        @keyframes bicep-frame-a { 0%, 49.9% { opacity: 1; } 50%, 100% { opacity: 0; } }
        @keyframes bicep-frame-b { 0%, 49.9% { opacity: 0; } 50%, 100% { opacity: 1; } }
      `}</style>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/bicep-flex-1.webp" alt="" className="absolute inset-0 h-full w-full object-contain" style={{ animation: 'bicep-frame-a 1s linear infinite' }}/>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/bicep-flex-2.webp" alt="" className="absolute inset-0 h-full w-full object-contain" style={{ animation: 'bicep-frame-b 1s linear infinite' }}/>
    </span>);
}
