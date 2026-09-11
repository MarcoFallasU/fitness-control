import { writeFile } from 'fs/promises';
import { ImageResponse } from 'next/og.js';

const YELLOW = '#fabc00';
const INK = '#14150f';

function icon(size, radiusPct) {
    const r = Math.round(size * radiusPct);
    const barW = Math.round(size * 0.62);
    const barH = Math.round(size * 0.135);
    const headW = Math.round(size * 0.135);
    const headH = Math.round(size * 0.34);
    return new ImageResponse(
        {
            type: 'div',
            props: {
                style: {
                    width: size,
                    height: size,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: YELLOW,
                    borderRadius: r,
                },
                children: {
                    type: 'div',
                    props: {
                        style: {
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: barW,
                            height: headH,
                            position: 'relative',
                        },
                        children: [
                            {
                                type: 'div',
                                props: {
                                    style: {
                                        position: 'absolute',
                                        left: 0,
                                        top: (headH - barH) / 2,
                                        width: barW,
                                        height: barH,
                                        background: INK,
                                        borderRadius: barH / 2,
                                    },
                                },
                            },
                            {
                                type: 'div',
                                props: {
                                    style: {
                                        position: 'absolute',
                                        left: 0,
                                        top: 0,
                                        width: headW,
                                        height: headH,
                                        background: INK,
                                        borderRadius: headW * 0.35,
                                    },
                                },
                            },
                            {
                                type: 'div',
                                props: {
                                    style: {
                                        position: 'absolute',
                                        right: 0,
                                        top: 0,
                                        width: headW,
                                        height: headH,
                                        background: INK,
                                        borderRadius: headW * 0.35,
                                    },
                                },
                            },
                        ],
                    },
                },
            },
        },
        { width: size, height: size },
    );
}

async function run() {
    const targets = [
        { size: 192, radiusPct: 0.22, file: 'public/icons/icon-192.png' },
        { size: 512, radiusPct: 0.22, file: 'public/icons/icon-512.png' },
        { size: 512, radiusPct: 0, file: 'public/icons/icon-maskable-512.png' },
        { size: 180, radiusPct: 0.22, file: 'public/apple-icon.png' },
    ];
    for (const t of targets) {
        const res = icon(t.size, t.radiusPct);
        const buf = Buffer.from(await res.arrayBuffer());
        await writeFile(t.file, buf);
        console.log('wrote', t.file, buf.length, 'bytes');
    }
}

run();
