import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { WebSocketServer } from 'ws';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// routineId -> Map<userId, { ws, displayName, color, state }>
const rooms = new Map();

function broadcast(room, exceptUserId, payload) {
  const data = JSON.stringify(payload);
  for (const [userId, peer] of room) {
    if (userId !== exceptUserId && peer.ws.readyState === peer.ws.OPEN) {
      peer.ws.send(data);
    }
  }
}

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res, parse(req.url, true));
  });

  const wss = new WebSocketServer({ noServer: true });

  wss.on('connection', (ws) => {
    let joined = null; // { routineId, userId }

    ws.on('message', (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }

      if (msg.type === 'join' && msg.routineId && msg.userId) {
        joined = { routineId: msg.routineId, userId: msg.userId };
        if (!rooms.has(joined.routineId))
          rooms.set(joined.routineId, new Map());
        const room = rooms.get(joined.routineId);
        room.set(joined.userId, {
          ws,
          displayName: msg.displayName ?? '',
          color: msg.color ?? '#fabc00',
          state: room.get(joined.userId)?.state ?? null,
        });
        // Catch the new joiner up on everyone already in the room.
        for (const [userId, peer] of room) {
          if (userId !== joined.userId && peer.state) {
            ws.send(JSON.stringify({ type: 'update', userId, displayName: peer.displayName, color: peer.color, state: peer.state }));
          }
        }
        return;
      }

      if (msg.type === 'update' && joined) {
        const room = rooms.get(joined.routineId);
        const entry = room?.get(joined.userId);
        if (!entry)
          return;
        entry.state = msg.state;
        if (msg.displayName)
            entry.displayName = msg.displayName;
        if (msg.color)
            entry.color = msg.color;
        broadcast(room, joined.userId, { type: 'update', userId: joined.userId, displayName: entry.displayName, color: entry.color, state: entry.state });
      }
    });

    ws.on('close', () => {
      if (!joined)
        return;
      const room = rooms.get(joined.routineId);
      if (!room)
        return;
      room.delete(joined.userId);
      broadcast(room, joined.userId, { type: 'leave', userId: joined.userId });
      if (room.size === 0)
        rooms.delete(joined.routineId);
    });
  });

  server.on('upgrade', (req, socket, head) => {
    const { pathname } = parse(req.url);
    if (pathname === '/ws') {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit('connection', ws, req);
      });
    }
    else if (typeof app.getUpgradeHandler === 'function') {
      app.getUpgradeHandler()(req, socket, head);
    }
    else {
      socket.destroy();
    }
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
