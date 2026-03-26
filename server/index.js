const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const path = require('path');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// Serve built React client in production
const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

// Unique session token keeps these Jitsi rooms private per server run
const SESSION_ID = Math.random().toString(36).substr(2, 6);

const USER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F1948A', '#82E0AA', '#F8C471', '#76D7C4', '#AED6F1',
];

const TABLE_COLORS = [
  '#3b82f6', '#22c55e', '#a855f7', '#f59e0b',
  '#ef4444', '#06b6d4', '#f97316', '#ec4899',
];

const TABLES = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  name: `Table ${i + 1}`,
  maxSeats: 6,
  color: TABLE_COLORS[i],
  jitsiRoom: `shopify-apac-t${i + 1}-${SESSION_ID}`,
}));

// socketId -> { id, name, color, tableId }
const users = {};
// tableId -> [socketId, ...]
const tableOccupants = {};
TABLES.forEach((t) => { tableOccupants[t.id] = []; });

let colorIndex = 0;

function buildState() {
  return {
    tables: TABLES.map((t) => ({
      ...t,
      occupants: tableOccupants[t.id].map((sid) => users[sid]).filter(Boolean),
    })),
    lobby: Object.values(users).filter((u) => !u.tableId),
  };
}

function broadcast() {
  io.emit('state', buildState());
}

io.on('connection', (socket) => {
  console.log('[connect]', socket.id);

  socket.on('join', ({ name }) => {
    users[socket.id] = {
      id: socket.id,
      name: String(name).trim().slice(0, 40),
      color: USER_COLORS[colorIndex % USER_COLORS.length],
      tableId: null,
    };
    colorIndex++;
    broadcast();
  });

  socket.on('join_table', ({ tableId }) => {
    const user = users[socket.id];
    if (!user) return;

    // Leave existing table
    if (user.tableId) {
      tableOccupants[user.tableId] = tableOccupants[user.tableId].filter((id) => id !== socket.id);
      socket.leave(`table:${user.tableId}`);
      user.tableId = null;
    }

    const table = TABLES.find((t) => t.id === tableId);
    if (table && tableOccupants[tableId].length < table.maxSeats) {
      tableOccupants[tableId].push(socket.id);
      user.tableId = tableId;
      socket.join(`table:${tableId}`);
    }

    broadcast();
  });

  socket.on('leave_table', () => {
    const user = users[socket.id];
    if (!user || !user.tableId) return;

    tableOccupants[user.tableId] = tableOccupants[user.tableId].filter((id) => id !== socket.id);
    socket.leave(`table:${user.tableId}`);
    user.tableId = null;

    broadcast();
  });

  // 1:1 call: generate a private Jitsi room and signal both parties
  socket.on('call_user', ({ targetId }) => {
    const caller = users[socket.id];
    const target = users[targetId];
    if (!caller || !target) return;

    const roomId = `shopify-apac-1on1-${uuidv4().slice(0, 8)}-${SESSION_ID}`;
    socket.emit('call_started', { roomId, with: target });
    io.to(targetId).emit('incoming_call', { roomId, from: caller });
  });

  socket.on('decline_call', ({ callerId }) => {
    const decliner = users[socket.id];
    io.to(callerId).emit('call_declined', { by: decliner });
  });

  // WebRTC signaling — just relay to target peer
  socket.on('webrtc:signal', ({ to, signal }) => {
    io.to(to).emit('webrtc:signal', { from: socket.id, signal });
  });

  socket.on('disconnect', () => {
    const user = users[socket.id];
    if (user?.tableId) {
      tableOccupants[user.tableId] = tableOccupants[user.tableId].filter((id) => id !== socket.id);
    }
    delete users[socket.id];
    console.log('[disconnect]', socket.id);
    broadcast();
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Session ID: ${SESSION_ID}`);
});
