import { useEffect, useRef } from 'react';

function initials(name = '') {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function VideoTile({ stream, user, isLocal, isMuted, isCameraOff }) {
  const videoRef = useRef();

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream ?? null;
    }
  }, [stream]);

  const hasVideo = stream && !isCameraOff;

  return (
    <div style={{
      position: 'relative',
      background: '#0b1120',
      borderRadius: 10,
      overflow: 'hidden',
      aspectRatio: '4/3',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px solid #1e293b',
      minWidth: 0,
    }}>
      {/* Video */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        style={{
          width: '100%', height: '100%',
          objectFit: 'cover',
          display: hasVideo ? 'block' : 'none',
          transform: isLocal ? 'scaleX(-1)' : 'none',
        }}
      />

      {/* Avatar fallback when camera off or no stream */}
      {!hasVideo && (
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: user?.color ?? '#334155',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, fontWeight: 700, color: '#fff',
        }}>
          {initials(user?.name ?? '?')}
        </div>
      )}

      {/* Name bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '4px 8px',
        background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
        fontSize: 11, fontWeight: 600, color: '#fff',
        display: 'flex', alignItems: 'center', gap: 5,
      }}>
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user?.name ?? 'Connecting…'}{isLocal ? ' (you)' : ''}
        </span>
        {isMuted && <span title="Muted">🔇</span>}
        {isCameraOff && <span title="Camera off">📷</span>}
      </div>
    </div>
  );
}

export default function VideoPanel({
  table,
  me,
  tableOccupants,
  localStream,
  remoteStreams,
  isMuted,
  isCameraOff,
  mediaError,
  onToggleMic,
  onToggleCamera,
  onLeave,
}) {
  const peers = tableOccupants.filter(u => u.id !== me?.id);

  return (
    <div style={{
      height: 260,
      background: '#060d1a',
      borderTop: '1px solid #1e293b',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
    }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '0 14px', height: 44,
        borderBottom: '1px solid #1e293b', flexShrink: 0,
      }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: table.color, boxShadow: `0 0 6px ${table.color}` }} />
        <span style={{ fontWeight: 600, fontSize: 13 }}>{table.name}</span>
        <span style={{ color: '#475569', fontSize: 12 }}>{tableOccupants.length} people</span>

        {mediaError && (
          <span style={{ color: '#f59e0b', fontSize: 11, marginLeft: 4 }}>
            ⚠ {mediaError}
          </span>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <ControlBtn onClick={onToggleMic} active={!isMuted} title={isMuted ? 'Unmute' : 'Mute'}>
            {isMuted ? '🔇' : '🎤'}
          </ControlBtn>
          <ControlBtn onClick={onToggleCamera} active={!isCameraOff} title={isCameraOff ? 'Camera on' : 'Camera off'}>
            {isCameraOff ? '📷' : '🎥'}
          </ControlBtn>
          <button
            onClick={onLeave}
            style={{
              background: '#ef444415', color: '#ef4444',
              border: '1px solid #ef444430', borderRadius: 7,
              padding: '4px 12px', cursor: 'pointer',
              fontWeight: 600, fontSize: 12,
            }}
          >
            Leave
          </button>
        </div>
      </div>

      {/* Video grid */}
      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: `repeat(${Math.min(tableOccupants.length, 4)}, 1fr)`,
        gap: 6,
        padding: 8,
        overflow: 'hidden',
      }}>
        {/* Local tile */}
        <VideoTile
          stream={localStream}
          user={me}
          isLocal
          isMuted={isMuted}
          isCameraOff={isCameraOff}
        />

        {/* Remote tiles */}
        {peers.map(peer => (
          <VideoTile
            key={peer.id}
            stream={remoteStreams[peer.id]}
            user={peer}
            isLocal={false}
            isMuted={false}
            isCameraOff={!remoteStreams[peer.id]}
          />
        ))}
      </div>
    </div>
  );
}

function ControlBtn({ children, onClick, active, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: active ? '#1e293b' : '#ef444420',
        border: `1px solid ${active ? '#334155' : '#ef444440'}`,
        borderRadius: 7, padding: '4px 10px',
        cursor: 'pointer', fontSize: 14,
      }}
    >
      {children}
    </button>
  );
}
