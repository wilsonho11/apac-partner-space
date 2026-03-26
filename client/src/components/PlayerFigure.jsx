export default function PlayerFigure({ user, pos, isMoving, facingLeft }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        // anchor bottom-center of figure to the position point
        transform: 'translate(-50%, -100%)',
        transition: 'left 0.72s cubic-bezier(0.4,0,0.2,1), top 0.72s cubic-bezier(0.4,0,0.2,1)',
        zIndex: 20,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* Name label */}
      <div style={{
        fontSize: 10,
        fontWeight: 700,
        color: '#fff',
        background: 'rgba(0,0,0,0.6)',
        padding: '1px 7px',
        borderRadius: 5,
        marginBottom: 3,
        whiteSpace: 'nowrap',
        letterSpacing: 0.2,
        backdropFilter: 'blur(4px)',
        border: `1px solid ${user.color}44`,
      }}>
        {user.name}
      </div>

      {/* Figure wrapper — handles bob + horizontal flip */}
      <div
        className={isMoving ? 'figure-moving' : ''}
        style={{
          transform: facingLeft ? 'scaleX(-1)' : 'scaleX(1)',
          transformOrigin: 'center bottom',
          lineHeight: 0,
        }}
      >
        <svg
          className={isMoving ? 'figure-walking' : ''}
          width="32"
          height="48"
          viewBox="0 0 32 48"
          style={{ display: 'block' }}
        >
          {/* Glow halo */}
          <circle cx="16" cy="7" r="10" fill={user.color} opacity="0.18" />

          {/* Head */}
          <circle cx="16" cy="7" r="6.5" fill={user.color} />

          {/* Body */}
          <rect x="11" y="14" width="10" height="13" rx="3" fill={user.color} />

          {/* Left arm */}
          <rect
            className="arm-l"
            x="3" y="15" width="8" height="3.5" rx="1.75"
            fill={user.color}
          />

          {/* Right arm */}
          <rect
            className="arm-r"
            x="21" y="15" width="8" height="3.5" rx="1.75"
            fill={user.color}
          />

          {/* Left leg */}
          <rect
            className="leg-l"
            x="11" y="26" width="4.5" height="16" rx="2.25"
            fill={user.color}
          />

          {/* Right leg */}
          <rect
            className="leg-r"
            x="16.5" y="26" width="4.5" height="16" rx="2.25"
            fill={user.color}
          />
        </svg>
      </div>

      {/* Ground shadow — shrinks when bobbing up */}
      <div style={{
        width: isMoving ? 13 : 20,
        height: 4,
        borderRadius: '50%',
        background: 'rgba(0,0,0,0.3)',
        marginTop: -2,
        transition: 'width 0.1s ease',
      }} />
    </div>
  );
}
