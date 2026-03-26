import { useState, useRef, useCallback } from 'react';
import PlayerFigure from './PlayerFigure';

const TABLE_POSITIONS = [
  { x: 13, y: 22 }, { x: 36, y: 22 }, { x: 60, y: 22 }, { x: 83, y: 22 },
  { x: 13, y: 68 }, { x: 36, y: 68 }, { x: 60, y: 68 }, { x: 83, y: 68 },
];

function initials(name) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function Table({ table, myId, position, onJoinTable, onLeaveTable, onMovePlayer }) {
  const isAtThisTable = table.occupants.some((u) => u.id === myId);
  const isFull = table.occupants.length >= table.maxSeats;

  const handleClick = (e) => {
    e.stopPropagation(); // don't trigger floor click
    onMovePlayer({ x: position.x, y: position.y });
    if (isAtThisTable) onLeaveTable();
    else if (!isFull) onJoinTable(table.id);
  };

  const seats = Array.from({ length: table.maxSeats }, (_, i) => {
    const angle = (i / table.maxSeats) * 2 * Math.PI - Math.PI / 2;
    const r = 56;
    return {
      sx: 50 + r * Math.cos(angle),
      sy: 50 + r * Math.sin(angle),
      occupant: table.occupants[i],
    };
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        userSelect: 'none',
      }}
    >
      <div
        onClick={handleClick}
        title={isAtThisTable ? 'Leave table' : isFull ? 'Table full' : `Join ${table.name}`}
        style={{
          width: 110,
          height: 110,
          borderRadius: '50%',
          position: 'relative',
          cursor: isFull && !isAtThisTable ? 'not-allowed' : 'pointer',
          boxShadow: isAtThisTable ? `0 0 28px ${table.color}77` : 'none',
          transition: 'box-shadow 0.3s',
        }}
      >
        {/* Table surface */}
        <div style={{
          position: 'absolute',
          inset: 16,
          borderRadius: '50%',
          background: `radial-gradient(circle at 35% 35%, ${table.color}cc, ${table.color}55)`,
          border: isAtThisTable ? `2px solid ${table.color}` : `2px solid ${table.color}44`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'border-color 0.2s',
        }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>
            {table.name}
          </span>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.65)' }}>
            {table.occupants.length}/{table.maxSeats}
          </span>
        </div>

        {/* Seat dots */}
        {seats.map(({ sx, sy, occupant }, i) => (
          <div
            key={i}
            title={occupant?.name}
            style={{
              position: 'absolute',
              left: `${sx}%`,
              top: `${sy}%`,
              transform: 'translate(-50%, -50%)',
              width: 26, height: 26,
              borderRadius: '50%',
              background: occupant ? occupant.color : '#1e293b',
              border: `2px solid ${occupant ? occupant.color : '#334155'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 8, fontWeight: 700, color: '#fff',
              transition: 'all 0.25s',
              boxShadow: occupant ? `0 2px 8px ${occupant.color}77` : 'none',
              zIndex: 1,
            }}
          >
            {occupant ? initials(occupant.name) : ''}
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 38,
        fontSize: 11,
        fontWeight: 500,
        color: isAtThisTable ? '#22c55e' : isFull ? '#ef444466' : '#475569',
      }}>
        {isAtThisTable ? '● You are here' : isFull ? 'Full' : 'Click to join'}
      </div>
    </div>
  );
}

export default function FloorMap({ tables, myId, myUser, onJoinTable, onLeaveTable }) {
  // Player figure position (percentage of floor dimensions)
  const [playerPos, setPlayerPos] = useState({ x: 50, y: 88 });
  const [isMoving, setIsMoving] = useState(false);
  const [facingLeft, setFacingLeft] = useState(false);
  const posRef = useRef({ x: 50, y: 88 });
  const movingTimer = useRef(null);

  const movePlayer = useCallback((newPos) => {
    setFacingLeft(newPos.x < posRef.current.x - 1); // only flip if moving meaningfully left
    posRef.current = newPos;
    setPlayerPos(newPos);
    setIsMoving(true);
    clearTimeout(movingTimer.current);
    movingTimer.current = setTimeout(() => setIsMoving(false), 750);
  }, []);

  // Click on empty floor → walk there
  const handleFloorClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    movePlayer({ x, y });
  };

  return (
    <div
      onClick={handleFloorClick}
      style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        background: '#0b1120',
        backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)',
        backgroundSize: '28px 28px',
        cursor: 'crosshair',
      }}
    >
      {/* Room border */}
      <div style={{
        position: 'absolute',
        inset: 20,
        border: '1px solid #1e293b',
        borderRadius: 20,
        pointerEvents: 'none',
      }} />

      {/* Floor label */}
      <div style={{
        position: 'absolute',
        top: 34, left: '50%',
        transform: 'translateX(-50%)',
        color: '#1e293b',
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 4,
        textTransform: 'uppercase',
        pointerEvents: 'none',
      }}>
        APAC PARTNER FLOOR
      </div>

      {/* Tables */}
      {tables.map((table, i) => (
        <Table
          key={table.id}
          table={table}
          myId={myId}
          position={TABLE_POSITIONS[i] ?? { x: 50, y: 50 }}
          onJoinTable={onJoinTable}
          onLeaveTable={onLeaveTable}
          onMovePlayer={movePlayer}
        />
      ))}

      {/* Current user's walking figure */}
      {myUser && (
        <PlayerFigure
          user={myUser}
          pos={playerPos}
          isMoving={isMoving}
          facingLeft={facingLeft}
        />
      )}

      {/* Walk hint */}
      <div style={{
        position: 'absolute',
        bottom: 16, left: '50%',
        transform: 'translateX(-50%)',
        color: '#1e293b',
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: 1,
        pointerEvents: 'none',
      }}>
        CLICK TO WALK · CLICK TABLE TO JOIN
      </div>
    </div>
  );
}
