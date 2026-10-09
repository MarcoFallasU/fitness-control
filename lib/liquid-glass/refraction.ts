// Liquid Glass edge refraction (Chromium only).
// Generates a per-element displacement map shaped to the element's size + radius
// and applies it through backdrop-filter: url(#filter).

const NS = 'http://www.w3.org/2000/svg';
let seq = 0;

export const supportsRefraction = () =>
    typeof navigator !== 'undefined' && /Chrome|Chromium|Edg/.test(navigator.userAgent);

function filterHost(): SVGSVGElement {
    let svg = document.getElementById('lg-filters') as SVGSVGElement | null;
    if (!svg) {
        svg = document.createElementNS(NS, 'svg');
        svg.id = 'lg-filters';
        svg.setAttribute('width', '0');
        svg.setAttribute('height', '0');
        svg.setAttribute('aria-hidden', 'true');
        svg.style.position = 'absolute';
        document.body.appendChild(svg);
    }
    return svg;
}

export function makeDisplacementMap(W: number, H: number, r: number, bezel: number): string {
    W = Math.round(W);
    H = Math.round(H);
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d')!;
    const img = ctx.createImageData(W, H);
    const hx = W / 2 - r;
    const hy = H / 2 - r;
    for (let y = 0; y < H; y++)
        for (let x = 0; x < W; x++) {
            const px = x + 0.5 - W / 2;
            const py = y + 0.5 - H / 2;
            const qx = Math.abs(px) - hx;
            const qy = Math.abs(py) - hy;
            let nx: number, ny: number, d: number;
            if (qx > 0 && qy > 0) {
                const l = Math.hypot(qx, qy) || 1;
                nx = qx / l;
                ny = qy / l;
                d = r - l;
            }
            else if (qx > qy) {
                nx = 1;
                ny = 0;
                d = r - qx;
            }
            else {
                nx = 0;
                ny = 1;
                d = r - qy;
            }
            nx *= Math.sign(px) || 1;
            ny *= Math.sign(py) || 1;
            const m = d < bezel ? Math.pow(1 - Math.max(d, 0) / bezel, 2) : 0;
            const i = (y * W + x) * 4;
            img.data[i] = 128 + nx * m * 127;
            img.data[i + 1] = 128 + ny * m * 127;
            img.data[i + 2] = 128;
            img.data[i + 3] = 255;
        }
    ctx.putImageData(img, 0, 0);
    return c.toDataURL();
}

/** Attach refraction to one element. Returns a cleanup function. */
export function attachRefraction(el: HTMLElement, { blur = 1, invert = 0.3, saturate = 170 }: { blur?: number; invert?: number; saturate?: number } = {}): () => void {
    if (!el || !supportsRefraction())
        return () => { };
    const id = 'lg-r' + seq++;
    const filter = document.createElementNS(NS, 'filter');
    filter.id = id;
    filter.setAttribute('x', '0');
    filter.setAttribute('y', '0');
    filter.setAttribute('width', '100%');
    filter.setAttribute('height', '100%');
    filter.setAttribute('color-interpolation-filters', 'sRGB');
    filterHost().appendChild(filter);

    let last = '';
    const build = () => {
        const w = el.offsetWidth;
        const h = el.offsetHeight;
        if (!w || !h)
            return;
        const radius = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
        const key = w + 'x' + h + 'r' + radius;
        if (key === last)
            return;
        last = key;
        const m = Math.min(w, h);
        const r = Math.min(radius, m / 2);
        const bezel = Math.max(6, Math.min(22, m * 0.3));
        const scale = Math.round(Math.min(46, m * 0.5));
        filter.innerHTML =
            `<feImage href="${makeDisplacementMap(w, h, r, bezel)}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="none" result="map"/>` +
                `<feDisplacementMap in="SourceGraphic" in2="map" scale="${scale}" xChannelSelector="R" yChannelSelector="G"/>`;
        el.style.backdropFilter = `blur(${blur}px) url(#${id}) saturate(${saturate}%) invert(${invert}) brightness(1.05)`;
    };

    let t: ReturnType<typeof setTimeout>;
    const ro = new ResizeObserver(() => {
        clearTimeout(t);
        t = setTimeout(build, 80);
    });
    ro.observe(el);
    build();
    return () => {
        ro.disconnect();
        clearTimeout(t);
        filter.remove();
        el.style.backdropFilter = '';
    };
}
