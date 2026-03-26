import { useState } from 'react';

export default function Login({ onJoin }) {
  const [name, setName] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (name.trim()) onJoin(name.trim());
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh',
      background: 'radial-gradient(ellipse at 60% 40%, #1e1b4b 0%, #0f172a 70%)',
    }}>
      <div style={{
        background: '#1e293b',
        borderRadius: 20,
        padding: '48px 44px',
        width: 400,
        boxShadow: '0 32px 64px rgba(0,0,0,0.6)',
        border: '1px solid #334155',
      }}>
        {/* Logo area */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: 'linear-gradient(135deg, #22c55e, #15803d)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 18px',
            fontSize: 32,
            boxShadow: '0 8px 24px #22c55e44',
          }}>
            🌏
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', letterSpacing: -0.3 }}>
            APAC Partner Space
          </h1>
          <p style={{ color: '#64748b', marginTop: 8, fontSize: 14, lineHeight: 1.5 }}>
            Virtual meeting room for Shopify APAC partners
          </p>
        </div>

        <form onSubmit={submit}>
          <label style={{
            display: 'block',
            color: '#94a3b8',
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
            marginBottom: 8,
          }}>
            Your name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Alex Kim"
            autoFocus
            maxLength={40}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: 10,
              color: '#f1f5f9',
              fontSize: 15,
              outline: 'none',
              marginBottom: 16,
            }}
            onFocus={(e) => { e.target.style.borderColor = '#22c55e'; }}
            onBlur={(e) => { e.target.style.borderColor = '#334155'; }}
          />
          <button
            type="submit"
            disabled={!name.trim()}
            style={{
              width: '100%',
              padding: '13px',
              background: name.trim()
                ? 'linear-gradient(135deg, #22c55e, #15803d)'
                : '#1e293b',
              border: name.trim() ? 'none' : '1px solid #334155',
              borderRadius: 10,
              color: name.trim() ? '#fff' : '#475569',
              fontSize: 15,
              fontWeight: 600,
              cursor: name.trim() ? 'pointer' : 'not-allowed',
              boxShadow: name.trim() ? '0 4px 16px #22c55e44' : 'none',
            }}
          >
            Enter the space →
          </button>
        </form>
      </div>
    </div>
  );
}
