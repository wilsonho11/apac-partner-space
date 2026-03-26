import { useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.PROD ? window.location.origin : 'http://localhost:3001';

export function useSocket(name) {
  const socketRef = useRef(null);
  const [state, setState] = useState({ tables: [], lobby: [] });
  const [myId, setMyId] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null); // { roomId, from }
  const [activeCall, setActiveCall] = useState(null);     // { roomId, with }
  const [callDeclined, setCallDeclined] = useState(null); // { by }

  useEffect(() => {
    if (!name) return;

    const socket = io(SERVER_URL);
    socketRef.current = socket;

    socket.on('connect', () => {
      setMyId(socket.id);
      socket.emit('join', { name });
    });

    socket.on('state', (s) => setState(s));

    socket.on('incoming_call', ({ roomId, from }) => {
      setIncomingCall({ roomId, from });
    });

    // Caller receives this once server routes the call
    socket.on('call_started', ({ roomId, with: peer }) => {
      setActiveCall({ roomId, with: peer });
    });

    socket.on('call_declined', ({ by }) => {
      setActiveCall(null);
      setCallDeclined(by);
      setTimeout(() => setCallDeclined(null), 3000);
    });

    socket.on('disconnect', () => setMyId(null));

    return () => socket.disconnect();
  }, [name]);

  const joinTable = useCallback((tableId) => {
    socketRef.current?.emit('join_table', { tableId });
  }, []);

  const leaveTable = useCallback(() => {
    socketRef.current?.emit('leave_table');
  }, []);

  const callUser = useCallback((targetId) => {
    socketRef.current?.emit('call_user', { targetId });
  }, []);

  const acceptCall = useCallback(() => {
    if (!incomingCall) return;
    setActiveCall({ roomId: incomingCall.roomId, with: incomingCall.from });
    setIncomingCall(null);
  }, [incomingCall]);

  const declineCall = useCallback(() => {
    if (!incomingCall) return;
    socketRef.current?.emit('decline_call', { callerId: incomingCall.from.id });
    setIncomingCall(null);
  }, [incomingCall]);

  const endCall = useCallback(() => {
    setActiveCall(null);
  }, []);

  return {
    socketRef,
    state,
    myId,
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
