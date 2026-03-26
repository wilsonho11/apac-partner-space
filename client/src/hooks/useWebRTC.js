import { useEffect, useRef, useState, useCallback } from 'react';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  // Free open relay TURN — handles strict NAT (e.g. corporate networks)
  {
    urls: 'turn:openrelay.metered.ca:80',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:openrelay.metered.ca:443',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
];

export function useWebRTC({ socketRef, myId, tableOccupants, myTableId }) {
  const peersRef = useRef({});            // peerId -> RTCPeerConnection
  const localStreamRef = useRef(null);
  const pendingCandidates = useRef({});   // peerId -> [RTCIceCandidate]
  const activeTableRef = useRef(null);

  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});  // peerId -> MediaStream
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [mediaError, setMediaError] = useState(null);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const emit = (event, data) => socketRef.current?.emit(event, data);

  function addRemoteStream(peerId, stream) {
    setRemoteStreams(prev => ({ ...prev, [peerId]: stream }));
  }

  function removeRemoteStream(peerId) {
    setRemoteStreams(prev => {
      const next = { ...prev };
      delete next[peerId];
      return next;
    });
  }

  function closePeer(peerId) {
    peersRef.current[peerId]?.close();
    delete peersRef.current[peerId];
    delete pendingCandidates.current[peerId];
    removeRemoteStream(peerId);
  }

  function createPeer(peerId) {
    if (peersRef.current[peerId]) return peersRef.current[peerId];

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    peersRef.current[peerId] = pc;

    // Attach local tracks
    localStreamRef.current?.getTracks().forEach(track =>
      pc.addTrack(track, localStreamRef.current)
    );

    // Receive remote stream
    const remoteStream = new MediaStream();
    addRemoteStream(peerId, remoteStream);
    pc.ontrack = ({ track }) => remoteStream.addTrack(track);

    // Send ICE candidates
    pc.onicecandidate = ({ candidate }) => {
      if (candidate) emit('webrtc:signal', { to: peerId, signal: candidate.toJSON() });
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        closePeer(peerId);
      }
    };

    return pc;
  }

  async function initiateOffer(peerId) {
    const pc = createPeer(peerId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    emit('webrtc:signal', { to: peerId, signal: { type: offer.type, sdp: offer.sdp } });
  }

  async function handleSignal({ from, signal }) {
    if (signal.type === 'offer') {
      const pc = createPeer(from);
      await pc.setRemoteDescription(new RTCSessionDescription(signal));
      // Flush queued candidates
      for (const c of (pendingCandidates.current[from] ?? [])) {
        await pc.addIceCandidate(c).catch(() => {});
      }
      delete pendingCandidates.current[from];
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      emit('webrtc:signal', { to: from, signal: { type: answer.type, sdp: answer.sdp } });

    } else if (signal.type === 'answer') {
      const pc = peersRef.current[from];
      if (pc?.signalingState === 'have-local-offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(signal));
      }

    } else if (signal.candidate !== undefined) {
      const pc = peersRef.current[from];
      const candidate = new RTCIceCandidate(signal);
      if (pc?.remoteDescription) {
        await pc.addIceCandidate(candidate).catch(() => {});
      } else {
        pendingCandidates.current[from] = [...(pendingCandidates.current[from] ?? []), candidate];
      }
    }
  }

  // ── Media ──────────────────────────────────────────────────────────────────

  async function startMedia() {
    if (localStreamRef.current) return localStreamRef.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      setLocalStream(stream);
      setMediaError(null);
      return stream;
    } catch {
      // Try audio-only fallback
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        localStreamRef.current = stream;
        setLocalStream(stream);
        setIsCameraOff(true);
        setMediaError(null);
        return stream;
      } catch (err) {
        setMediaError(err.message);
        return null;
      }
    }
  }

  function stopMedia() {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);
  }

  // ── Table presence ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!myTableId) {
      // Left the table — close all peers and stop media
      Object.keys(peersRef.current).forEach(closePeer);
      stopMedia();
      activeTableRef.current = null;
      return;
    }

    const peerIds = tableOccupants
      .filter(u => u.id !== myId)
      .map(u => u.id);

    startMedia().then(stream => {
      if (!stream) return;
      peerIds.forEach(peerId => {
        if (!peersRef.current[peerId]) {
          // Deterministic: higher socket ID creates the offer
          if (myId > peerId) initiateOffer(peerId);
          else createPeer(peerId); // wait for their offer
        }
      });
    });

    // Close peers who left the table
    Object.keys(peersRef.current).forEach(peerId => {
      if (!peerIds.includes(peerId)) closePeer(peerId);
    });
  }, [myTableId, tableOccupants.map(u => u.id).sort().join(',')]);

  // ── Signal listener ────────────────────────────────────────────────────────

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    socket.on('webrtc:signal', handleSignal);
    return () => socket.off('webrtc:signal', handleSignal);
  });

  // ── Controls ───────────────────────────────────────────────────────────────

  const toggleMic = useCallback(() => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) { track.enabled = !track.enabled; setIsMuted(!track.enabled); }
  }, []);

  const toggleCamera = useCallback(() => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) { track.enabled = !track.enabled; setIsCameraOff(!track.enabled); }
  }, []);

  return { localStream, remoteStreams, isMuted, isCameraOff, mediaError, toggleMic, toggleCamera };
}
