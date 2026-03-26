import { useState, useEffect, useRef, useCallback } from 'react';

const USER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F1948A', '#82E0AA', '#F8C471', '#76D7C4', '#AED6F1',
];

const TABLE_COLORS = [
  '#3b82f6', '#22c55e', '#a855f7', '#f59e0b',
  '#ef4444', '#06b6d4', '#f97316', '#ec4899',
];

const BASE_TABLES = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  name: `Table ${i + 1}`,
  maxSeats: 6,
  color: TABLE_COLORS[i],
  jitsiRoom: `shopify-apac-partners-t${i + 1}`,
}));

function colorFromEmail(email = '') {
  let h = 0;
  for (const c of email) h = (Math.imul(31, h) + c.charCodeAt(0)) | 0;
  return USER_COLORS[Math.abs(h) % USER_COLORS.length];
}

function toAppUser(u) {
  return {
    id: u.socketId,
    name: u.name || u.email?.split('@')[0] || 'Unknown',
    color: colorFromEmail(u.email),
    tableId: u.state?.tableId ?? null,
    avatar: u.slackImageUrl ?? null,
  };
}

export function useQuick() {
  const roomRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [myId, setMyId] = useState(null);
  const [tables, setTables] = useState(BASE_TABLES.map((t) => ({ ...t, occupants: [] })));
  const [lobby, setLobby] = useState([]);
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [callDeclined, setCallDeclined] = useState(null);

  const rebuild = useCallback((room) => {
    const all = [...room.users.values()].map(toAppUser);
    setMyId(room.user?.socketId ?? null);
    setTables(BASE_TABLES.map((t) => ({
      ...t,
      occupants: all.filter((u) => u.tableId === t.id),
    })));
    setLobby(all.filter((u) => !u.tableId));
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const room = window.quick.socket.room('apac-partners');
      roomRef.current = room;

      room.on('user:join',  () => rebuild(room));
      room.on('user:leave', () => rebuild(room));
      room.on('user:state', () => rebuild(room));

      room.on('call:request', ({ roomId, targetId, from }) => {
        if (room.user && targetId === room.user.socketId) {
          setIncomingCall({ roomId, from });
        }
      });

      room.on('call:decline', ({ callerId }) => {
        if (room.user && callerId === room.user.socketId) {
          setActiveCall(null);
          setCallDeclined({ name: 'them' });
          setTimeout(() => setCallDeclined(null), 3000);
        }
      });

      // identity + socket join in parallel — no sequential blocking
      await Promise.all([
        window.quick.id.waitForUser(),
        room.join(),
      ]);

      if (!cancelled) {
        rebuild(room);
        setReady(true);
      }
    }

    init();
    return () => { cancelled = true; };
  }, [rebuild]);

  const joinTable = useCallback((tableId) => {
    roomRef.current?.updateUserState({ tableId });
  }, []);

  const leaveTable = useCallback(() => {
    roomRef.current?.updateUserState({ tableId: null });
  }, []);

  const callUser = useCallback((targetId) => {
    const room = roomRef.current;
    if (!room?.user) return;
    const roomId = `shopify-apac-1on1-${Math.random().toString(36).slice(2, 10)}`;
    const from = toAppUser(room.user);
    const peer = [...room.users.values()].map(toAppUser).find((u) => u.id === targetId);
    room.emit('call:request', { roomId, targetId, from });
    setActiveCall({ roomId, with: peer });
  }, []);

  const acceptCall = useCallback(() => {
    if (!incomingCall) return;
    setActiveCall({ roomId: incomingCall.roomId, with: incomingCall.from });
    setIncomingCall(null);
  }, [incomingCall]);

  const declineCall = useCallback(() => {
    if (!incomingCall) return;
    roomRef.current?.emit('call:decline', { callerId: incomingCall.from.id });
    setIncomingCall(null);
  }, [incomingCall]);

  const endCall = useCallback(() => setActiveCall(null), []);

  return {
    ready,
    myId,
    state: { tables, lobby },
    incomingCall,
    activeCall,
    callDeclined,
    joinTable,
    leaveTable,
    callUser,
    acceptCall,
    declineCall,
    endCall,
  };
}
