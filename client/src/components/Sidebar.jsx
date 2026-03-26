function initials(name) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function UserRow({ user, isMe, onCall }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 9,
      padding: '6px 12px',
      borderRadius: 8,
      margin: '1px 6px',
      background: isMe ? '#334155' : 'transparent',
    }}>
      {/* Avatar */}
      <div style={{
        width: 30, height: 30,
        borderRadius: '50%',
        background: user.color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, fontWeight: 700, color: '#fff',
        flexShrink: 0,
        boxShadow: `0 2px 6px ${user.color}55`,
      }}>
        {initials(user.name)}
      </div>

      {/* Name */}
      <span style={{
        fontSize: 13,
        color: isMe ? '#f1f5f9' : '#cbd5e1',
        flex: 1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {user.name}
        {isMe && (
          <span style={{ color: '#475569', fontSize: 10, marginLeft: 4 }}>(you)</span>
        )}
      </span>

      {/* Call button */}
      {!isMe && (
        <button
          onClick={() => onCall(user.id)}
          title={`Start 1:1 call with ${user.name}`}
          style={{
            background: 'transparent',
            border: '1px solid #334155',
            borderRadius: 6,
            padding: '3px 7px',
            color: '#64748b',
            cursor: 'pointer',
            fontSize: 13,
            flexShrink: 0,
          }}
        >
          📞
        </button>
      )}
    </div>
  );
}

export default function Sidebar({ allUsers, myId, tables, onCallUser }) {
  const lobbyUsers = allUsers.filter((u) => !u.tableId);

  return (
    <aside style={{
      width: 230,
      background: '#1e293b',
      borderRight: '1px solid #334155',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px 12px',
        borderBottom: '1px solid #334155',
        flexShrink: 0,
      }}>
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          color: '#64748b',
          letterSpacing: 1,
          textTransform: 'uppercase',
        }}>
          Online — {allUsers.length}
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 8 }}>
        {/* Lobby section */}
        {lobbyUsers.length > 0 && (
          <>
            <SectionLabel>Lobby</SectionLabel>
            {lobbyUsers.map((u) => (
              <UserRow key={u.id} user={u} isMe={u.id === myId} onCall={onCallUser} />
            ))}
          </>
        )}

        {/* Per-table sections */}
        {tables.map(
          (table) =>
            table.occupants.length > 0 && (
              <div key={table.id}>
                <SectionLabel color={table.color}>{table.name}</SectionLabel>
                {table.occupants.map((u) => (
                  <UserRow key={u.id} user={u} isMe={u.id === myId} onCall={onCallUser} />
                ))}
              </div>
            )
        )}

        {allUsers.length === 0 && (
          <div style={{ color: '#475569', fontSize: 12, padding: '16px', textAlign: 'center' }}>
            No one here yet
          </div>
        )}
      </div>
    </aside>
  );
}

function SectionLabel({ children, color }) {
  return (
    <div style={{
      padding: '10px 16px 4px',
      fontSize: 10,
      fontWeight: 700,
      color: color ?? '#475569',
      letterSpacing: 1,
      textTransform: 'uppercase',
    }}>
      {children}
    </div>
  );
}
