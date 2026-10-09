// Liquid Glass — Fusión loader. Two bubbles merge through an SVG gooey filter with a glass rim.
// Styles live in globals.css (.lg-fusion).
const FILTER = `<filter id="lg-goo" x="-50%" y="-50%" width="200%" height="200%" color-interpolation-filters="sRGB">
        <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="b"></feGaussianBlur>
        <feColorMatrix in="b" mode="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 26 -11" result="goo"></feColorMatrix>
        <feMorphology in="goo" operator="erode" radius="1.4" result="er"></feMorphology>
        <feComposite in="goo" in2="er" operator="out" result="rim"></feComposite>
        <feGaussianBlur in="rim" stdDeviation="3.5" result="rimB"></feGaussianBlur>
        <feComposite in="rimB" in2="goo" operator="in" result="glow"></feComposite>
        <feOffset in="er" dx="2.2" dy="2.2" result="erO"></feOffset>
        <feComposite in="er" in2="erO" operator="out" result="hl"></feComposite>
        <feGaussianBlur in="hl" stdDeviation="0.6" result="hlB"></feGaussianBlur>
        <feFlood flood-color="#ffffff" flood-opacity="0.07"></feFlood>
        <feComposite in2="goo" operator="in" result="fill"></feComposite>
        <feComponentTransfer in="rim" result="rimA"><feFuncA type="linear" slope="0.5"></feFuncA></feComponentTransfer>
        <feComponentTransfer in="glow" result="glowA"><feFuncA type="linear" slope="0.55"></feFuncA></feComponentTransfer>
        <feGaussianBlur in="goo" stdDeviation="5" result="sh"></feGaussianBlur>
        <feOffset in="sh" dy="5" result="shO"></feOffset>
        <feColorMatrix in="shO" mode="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.18 0" result="shC"></feColorMatrix>
        <feComposite in="shC" in2="goo" operator="out" result="drop"></feComposite>
        <feMerge><feMergeNode in="drop"></feMergeNode><feMergeNode in="fill"></feMergeNode><feMergeNode in="glowA"></feMergeNode><feMergeNode in="rimA"></feMergeNode><feMergeNode in="hlB"></feMergeNode></feMerge>
      </filter>`;

export function FusionLoader({ label = 'Cargando', className }: {
    label?: string;
    className?: string;
}) {
    return (<>
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" dangerouslySetInnerHTML={{ __html: FILTER }}/>
      <div className={`lg-fusion ${className ?? ''}`} role="status" aria-label={label}><span/><span/></div>
    </>);
}
