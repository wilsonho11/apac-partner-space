import { useSocket } from '../hooks/useSocket';
import { useWebRTC } from '../hooks/useWebRTC';
import FloorMap from './FloorMap';
import Sidebar from './Sidebar';
import VideoPanel from './VideoPanel';

function initials(name) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function Room({ name }) {
  const {
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
  } = useSocket(name);

  const allUsers = [
    ...(state.lobby ?? []),
    ...state.tables.flatMap((t) => t.occupants ?? []),
  ];
  const me = allUsers.find((u) => u.id === myId);
  const myTable = me?.tableId ? state.tables.find((t) => t.id === me.tableId) : null;

  const {
    localStream,
    remoteStreams,
    isMuted,
    isCameraOff,
    mediaError,
    toggleMic,
    toggleCamera,
  } = useWebRTC({
    socketRef,
    myId,
    tableOccupants: myTable?.occupants ?? [],
    myTableId: me?.tableId ?? null,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* ── Header ── */}
      <header style={{
        height: 54,
        background: '#1e293b',
        borderBottom: '1px solid #334155',
        display: 'flex', alignItems: 'center',
        padding: '0 20px', gap: 14, flexShrink: 0,
      }}>
        <span style={{ fontSize: 22 }}>🌏</span>
        <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: -0.3 }}>APAC Partner Space</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            background: '#22c55e18', color: '#22c55e',
            padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
          }}>
            ● {allUsers.length} online
          </span>
          {me && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: me.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: '#fff',
                boxShadow: `0 2px 8px ${me.color}66`,
              }}>
                {initials(me.name)}
              </div>
              <span style={{ fontSize: 13, color: '#cbd5e1' }}>{me.name}</span>
            </div>
          )}
        </div>
      </header>

      {/* ── Body ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar allUsers={allUsers} myId={myId} tables={state.tables} onCallUser={callUser} />
        <FloorMap
          tables={state.tables}
          myId={myId}
          myUser={me}
          onJoinTable={joinTable}
          onLeaveTable={leaveTable}
        />
      </div>

      {/* ── Table video panel ── */}
      {myTable && (
        <VideoPanel
          table={myTable}
          me={me}
          tableOccupants={myTable.occupants}
          localStream={localStream}
          remoteStreams={remoteStreams}
          isMuted={isMuted}
          isCameraOff={isCameraOff}
          mediaError={mediaError}
          onToggleMic={toggleMic}
          onToggleCamera={toggleCamera}
          onLeave={leaveTable}
        />
      )}

      {/* ── Active 1:1 call ── */}
      {activeCall && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.82)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 100,
        }}>
          <div style={{
            background: '#1e293b', borderRadius: 16, overflow: 'hidden',
            width: 'min(760px, 92vw)',
            boxShadow: '0 32px 64px rgba(0,0,0,0.6)',
            border: '1px solid #334155',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 20px', borderBottom: '1px solid #334155',
            }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
              <span style={{ fontWeight: 600, fontSize: 14 }}>
                1:1 with {activeCall.with?.name ?? '…'}
              </span>
              <button onClick={endCall} style={{
                marginLeft: 'auto', background: '#ef4444', color: '#fff',
                border: 'none', borderRadius: 8, padding: '7px 16px',
                cursor: 'pointer', fontWeight: 600, fontSize: 13,
              }}>
                End call
              </button>
            </div>
            <iframe
              src={`https://meet.jit.si/${activeCall.roomId}`}
              allow="camera; microphone; display-capture; autoplay; clipboard-write"
              style={{ width: '100%', height: 500, border: 'none', display: 'block' }}
              title="1:1 video call"
            />
          </div>
        </div>
      )}

      {/* ── Incoming call toast ── */}
      {incomingCall && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24,
          background: '#1e293b', borderRadius: 14, padding: '18px 20px',
          boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
          border: '1px solid #334155', zIndex: 200, width: 290,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: incomingCall.from.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: '#fff',
            }}>
              {initials(incomingCall.from.name)}
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Incoming call</div>
              <div style={{ color: '#94a3b8', fontSize: 12 }}>{incomingCall.from.name} wants to talk</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={acceptCall} style={{ flex: 1, background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, padding: '9px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Accept</button>
            <button onClick={declineCall} style={{ flex: 1, background: '#ef444420', color: '#ef4444', border: '1px solid #ef444430', borderRadius: 8, padding: '9px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Decline</button>
          </div>
        </div>
      )}

      {/* ── Call declined toast ── */}
      {callDeclined && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24,
          background: '#1e293b', borderRadius: 10, padding: '12px 18px',
          border: '1px solid #334155', zIndex: 200, fontSize: 13, color: '#94a3b8',
        }}>
          {callDeclined.name} declined the call
        </div>
      )}
    </div>
  );
}
