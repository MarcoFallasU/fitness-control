export function BicepLoader({ className }: { className?: string }) {
    return (<svg viewBox="0 0 200 250" className={className} role="img" aria-label="Cargando">
      <circle cx="100" cy="38" r="30" fill="currentColor"/>
      <rect x="72" y="38" width="56" height="100" rx="28" fill="currentColor"/>
      <ellipse cx="100" cy="85" rx="34" ry="32" fill="currentColor">
        <animate attributeName="rx" values="34;48;34" keyTimes="0;0.5;1" dur="1.3s" repeatCount="indefinite"/>
        <animate attributeName="ry" values="32;42;32" keyTimes="0;0.5;1" dur="1.3s" repeatCount="indefinite"/>
      </ellipse>
      <circle cx="100" cy="132" r="24" fill="currentColor"/>
      <g>
        <animateTransform attributeName="transform" type="rotate" values="0 100 132; -125 100 132; 0 100 132" keyTimes="0;0.5;1" dur="1.3s" repeatCount="indefinite" calcMode="spline" keySplines="0.45 0 0.2 1;0.45 0 0.2 1"/>
        <rect x="78" y="132" width="44" height="80" rx="22" fill="currentColor"/>
        <circle cx="100" cy="210" r="32" fill="currentColor"/>
      </g>
    </svg>);
}
