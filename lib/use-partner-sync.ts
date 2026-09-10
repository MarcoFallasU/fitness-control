'use client';
import { useEffect, useRef, useState } from 'react';
import type { ExerciseExecution } from '@/lib/types';

export interface PartnerState {
    displayName: string;
    color: string;
    routineName: string;
    exercises: ExerciseExecution[];
    index: number;
}

interface Me {
    id: string;
    displayName: string;
    color: string;
}

interface PendingState {
    routineName: string;
    exercises: ExerciseExecution[];
    index: number;
}

export function usePartnerSync(routineId: string, me: Me) {
    const [partner, setPartner] = useState<PartnerState | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const pendingStateRef = useRef<PendingState | null>(null);

    useEffect(() => {
        const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const ws = new WebSocket(`${proto}://${window.location.host}/ws`);
        wsRef.current = ws;

        ws.onopen = () => {
            ws.send(JSON.stringify({ type: 'join', routineId, userId: me.id, displayName: me.displayName, color: me.color }));
            // The state may have already changed before the socket finished connecting — flush it now.
            if (pendingStateRef.current) {
                ws.send(JSON.stringify({ type: 'update', routineId, userId: me.id, displayName: me.displayName, color: me.color, state: pendingStateRef.current }));
            }
        };
        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                if (msg.type === 'update' && msg.userId !== me.id) {
                    setPartner({ displayName: msg.displayName, color: msg.color, ...msg.state });
                }
                else if (msg.type === 'leave' && msg.userId !== me.id) {
                    setPartner(null);
                }
            }
            catch {
                // ignore malformed messages
            }
        };

        return () => {
            ws.close();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [routineId, me.id]);

    function sendUpdate(state: PendingState) {
        pendingStateRef.current = state;
        const ws = wsRef.current;
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'update', routineId, userId: me.id, displayName: me.displayName, color: me.color, state }));
        }
    }

    return { partner, sendUpdate };
}
