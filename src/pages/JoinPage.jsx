import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { AVATAR_STYLES, avatarSVG } from '../lib/avatar'

export default function JoinPage() {
  const { roomCode } = useParams()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [selectedStyle, setSelectedStyle] = useState('adventurer')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Semilla estable para el preview — no cambia mientras el usuario escribe.
  // Se reemplaza por el nombre real solo al hacer submit.
  const previewSeed = useRef('user_' + Math.random().toString(36).slice(2, 8))

  // Si ya tengo sesión guardada para esta sala → entrar directo sin pedir nombre
  useEffect(() => {
    async function checkExistingSession() {
      try {
        const room = await api.getRoom(roomCode)
        const key = `spinit_player_${room.id}`
        const stored = localStorage.getItem(key)
        if (stored) {
          const session = JSON.parse(stored)
          // Re-mark player as online — backend returns the existing player record
          const updatedPlayer = await api.joinRoom(room.id, {
            name: session.name,
            avatar_style: session.avatar_style,
            avatar_seed: session.avatar_seed,
          }).catch(() => null)

          // Update session with fresh player data (id may be same, but ensure it's current)
          const freshSession = updatedPlayer ? {
            ...session,
            id: updatedPlayer.id,  // use the player id the backend returned
          } : session

          localStorage.setItem(key, JSON.stringify(freshSession))
          sessionStorage.setItem('spinit_player', JSON.stringify(freshSession))
          navigate(`/room/${room.id}`)
        }
      } catch {
        // Room not found or network error — show the form normally
      }
    }
    if (roomCode) checkExistingSession()
  }, [roomCode])

  async function handleJoin(e) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError('')
    try {
      const room = await api.getRoom(roomCode || 'permanent')
      const player = await api.joinRoom(room.id, {
        name: name.trim(),
        avatar_style: selectedStyle,
        avatar_seed: name.trim(),
      })

      const isOwner = localStorage.getItem('spinit_pending_owner') === room.id
      // If this player just created this room, claim ownership
      if (isOwner && !room.owner_id) {
        await api.updateRoom(room.id, { owner_id: player.id })
        localStorage.removeItem('spinit_pending_owner')
      }

      // Save per-room session in localStorage (survives browser close)
      const sessionData = {
        id: player.id,
        name: player.name,
        avatar_style: player.avatar_style,
        avatar_seed: player.avatar_seed,
        room_id: room.id,
        room_code: room.code,
        is_owner: isOwner,
      }
      localStorage.setItem(`spinit_player_${room.id}`, JSON.stringify(sessionData))
      // Also keep sessionStorage for backward compat with RoomPage
      sessionStorage.setItem('spinit_player', JSON.stringify(sessionData))
      navigate(`/room/${room.id}`)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <button onClick={() => navigate('/lobby')} style={styles.backBtn}>← Volver</button>
          <div style={styles.logo}>Spin<span style={{ color: '#D85A30' }}>it</span></div>
          <div style={{ width: 60 }} />
        </div>
        <p style={styles.subtitle}>Elige tu avatar y entra a la sala</p>

        {roomCode && (
          <div style={styles.roomBadge}>
            <span style={{ opacity: 0.6 }}>Sala</span> #{roomCode.toUpperCase()}
          </div>
        )}

        <form onSubmit={handleJoin}>
          {/* Avatar preview */}
          <div style={styles.avatarPreview}>
            <div
              dangerouslySetInnerHTML={{ __html: avatarSVG(selectedStyle, previewSeed.current, 80) }}
              style={{ borderRadius: '50%', overflow: 'hidden', border: '3px solid #D85A30', width: 80, height: 80, flexShrink: 0 }}
            />
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>
              Vista previa
            </p>
          </div>

          {/* Style picker */}
          <p style={styles.label}>Estilo de avatar</p>
          <div style={styles.stylePicker}>
            {AVATAR_STYLES.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setSelectedStyle(id)}
                style={{
                  ...styles.styleBtn,
                  border: selectedStyle === id
                    ? '2px solid #D85A30'
                    : '2px solid rgba(255,255,255,0.12)',
                }}
                title={label}
              >
                <div
                  dangerouslySetInnerHTML={{ __html: avatarSVG(id, previewSeed.current, 44) }}
                  style={{ borderRadius: '50%', overflow: 'hidden', width: 44, height: 44, display: 'block' }}
                />
              </button>
            ))}
          </div>

          {/* Name */}
          <p style={styles.label}>Tu nombre</p>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Escribe tu nombre..."
            maxLength={40}
            required
            style={styles.input}
            autoFocus
          />

          {error && <p style={styles.error}>{error}</p>}

          <button
            type="submit"
            disabled={loading || !name.trim()}
            style={{ ...styles.btn, opacity: loading || !name.trim() ? 0.5 : 1 }}
          >
            {loading ? 'Entrando...' : 'Entrar a la sala →'}
          </button>
        </form>
      </div>

      <style>{`
        @keyframes neonPulse {
          0% { border-color: rgba(0, 255, 255, 0.3); box-shadow: 0 0 0px rgba(0, 255, 255, 0); }
          100% { border-color: rgba(0, 255, 255, 0.8); box-shadow: 0 0 12px rgba(0, 255, 255, 0.3); }
        }
        
        input:focus {
          border-color: #00ffff !important;
          box-shadow: 0 0 12px rgba(0, 255, 255, 0.3);
          outline: none;
        }
        
        button:active {
          transform: scale(0.97);
        }
        
        .styleBtn:hover {
          border-color: #ff00ff !important;
          box-shadow: 0 0 12px rgba(255, 0, 255, 0.4);
          transform: scale(1.05);
        }
        
        button[type="submit"]:hover {
          background: #00ffff;
          color: #0a0a0f;
          box-shadow: 0 0 20px #00ffff;
          border-color: #00ffff;
        }
        
        .backBtn:hover {
          background: rgba(0, 255, 255, 0.1);
          border-color: #00ffff;
          box-shadow: 0 0 8px rgba(0, 255, 255, 0.3);
        }
      `}</style>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#0a0a0f',
    backgroundImage: `
      repeating-linear-gradient(45deg, rgba(0, 255, 255, 0.02) 0px, rgba(0, 255, 255, 0.02) 2px, transparent 2px, transparent 8px),
      repeating-linear-gradient(135deg, rgba(255, 0, 255, 0.02) 0px, rgba(255, 0, 255, 0.02) 2px, transparent 2px, transparent 12px),
      radial-gradient(circle at 70% 20%, rgba(0, 255, 255, 0.06) 0%, transparent 60%)
    `,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    fontFamily: "'Rajdhani', 'DM Sans', sans-serif",
  },
  card: {
    background: 'rgba(0, 0, 0, 0.65)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(0, 255, 255, 0.35)',
    borderRadius: 8,
    padding: '2rem',
    width: '100%',
    maxWidth: 440,
    color: '#00ffff',
    boxShadow: '0 0 30px rgba(0, 255, 255, 0.1), inset 0 0 20px rgba(0, 255, 255, 0.02)',
  },
  logo: {
    fontFamily: "'Orbitron', 'Syne', monospace",
    fontSize: 34,
    fontWeight: 900,
    letterSpacing: '2px',
    textAlign: 'center',
    marginBottom: 4,
    textShadow: '0 0 5px #00ffff, 0 0 10px #00ffff80',
    background: 'linear-gradient(135deg, #00ffff, #ff00ff)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    color: 'transparent',
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(0, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: '1.5rem',
    letterSpacing: '0.5px',
  },
  roomBadge: {
    textAlign: 'center',
    fontSize: 12,
    background: 'rgba(0, 255, 255, 0.08)',
    border: '1px solid rgba(0, 255, 255, 0.3)',
    borderRadius: 4,
    padding: '5px 16px',
    color: '#00ffff',
    marginBottom: '1.5rem',
    fontWeight: 600,
    letterSpacing: '1px',
    fontFamily: "'Rajdhani', monospace",
  },
  avatarPreview: {
    textAlign: 'center',
    marginBottom: '1.25rem',
  },
  label: {
    fontSize: 10,
    color: '#ff00ff',
    fontWeight: 600,
    letterSpacing: '2px',
    textTransform: 'uppercase',
    marginBottom: 10,
    textShadow: '0 0 3px #ff00ff',
  },
  stylePicker: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
    marginBottom: '1.25rem',
    justifyContent: 'center',
  },
  styleBtn: {
    background: 'rgba(0, 0, 0, 0.6)',
    borderRadius: '50%',
    cursor: 'pointer',
    padding: 2,
    transition: 'all 0.15s',
  },
  input: {
    width: '100%',
    fontSize: 16,
    background: 'rgba(0, 0, 0, 0.7)',
    border: '1px solid rgba(0, 255, 255, 0.3)',
    borderRadius: 4,
    padding: '12px 14px',
    color: '#00ffff',
    fontFamily: "'Rajdhani', monospace",
    marginBottom: '1rem',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'all 0.15s',
  },
  btn: {
    width: '100%',
    fontFamily: "'Orbitron', monospace",
    fontWeight: 700,
    fontSize: 14,
    letterSpacing: '1.5px',
    background: 'transparent',
    color: '#00ffff',
    border: '2px solid #00ffff',
    borderRadius: 4,
    padding: '12px',
    cursor: 'pointer',
    transition: 'all 0.15s',
    textTransform: 'uppercase',
  },
  backBtn: {
    background: 'transparent',
    border: '1px solid rgba(0, 255, 255, 0.3)',
    borderRadius: 4,
    color: '#00ffff',
    fontSize: 12,
    cursor: 'pointer',
    fontFamily: "'Rajdhani', monospace",
    padding: '5px 12px',
    letterSpacing: '1px',
    transition: 'all 0.15s',
  },
  error: {
    color: '#ff00ff',
    fontSize: 12,
    marginBottom: '0.75rem',
    textAlign: 'center',
    textShadow: '0 0 3px #ff00ff',
    letterSpacing: '0.5px',
  },
}