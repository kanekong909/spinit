import { useState, useRef } from 'react'
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

      const isOwner = sessionStorage.getItem('spinit_pending_owner') === room.id
      // If this player just created this room, claim ownership
      if (isOwner && !room.owner_id) {
        await api.updateRoom(room.id, { owner_id: player.id })
        sessionStorage.removeItem('spinit_pending_owner')
      }

      sessionStorage.setItem('spinit_player', JSON.stringify({
        id: player.id,
        name: player.name,
        avatar_style: player.avatar_style,
        avatar_seed: player.avatar_seed,
        room_id: room.id,
        room_code: room.code,
        is_owner: isOwner,
      }))
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
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#0f0f0f',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
    fontFamily: "'DM Sans', sans-serif",
  },
  card: {
    background: '#1a1a1a',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: '2rem',
    width: '100%',
    maxWidth: 440,
    color: 'white',
  },
  logo: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 32,
    fontWeight: 800,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginBottom: '1.5rem',
  },
  roomBadge: {
    textAlign: 'center',
    fontSize: 13,
    background: 'rgba(216,90,48,0.15)',
    border: '1px solid rgba(216,90,48,0.3)',
    borderRadius: 20,
    padding: '4px 16px',
    color: '#D85A30',
    marginBottom: '1.5rem',
    fontWeight: 500,
  },
  avatarPreview: {
    textAlign: 'center',
    marginBottom: '1.25rem',
  },
  label: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.45)',
    fontWeight: 500,
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  stylePicker: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: '1.25rem',
  },
  styleBtn: {
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '50%',
    cursor: 'pointer',
    padding: 2,
    transition: 'border-color 0.15s, transform 0.1s',
  },
  input: {
    width: '100%',
    fontSize: 16,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 10,
    padding: '12px 14px',
    color: 'white',
    fontFamily: "'DM Sans', sans-serif",
    marginBottom: '1rem',
    boxSizing: 'border-box',
    outline: 'none',
  },
  btn: {
    width: '100%',
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 15,
    background: '#D85A30',
    color: 'white',
    border: 'none',
    borderRadius: 10,
    padding: '13px',
    cursor: 'pointer',
    transition: 'opacity 0.15s',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.3)',
    fontSize: 13,
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    padding: '4px 0',
  },
  error: {
    color: '#F09595',
    fontSize: 13,
    marginBottom: '0.75rem',
    textAlign: 'center',
  }
}
