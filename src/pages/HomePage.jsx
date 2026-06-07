import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'

const DEFAULT_OPTIONS = 'Pizza, Cine, Sushi, Karaoke'

export default function HomePage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [tab, setTab] = useState(params.get('create') === '1' ? 'create' : 'join')
  const [code, setCode] = useState('')
  const [rooms, setRooms] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Create form state
  const [roomName, setRoomName] = useState('')
  const [optionsRaw, setOptionsRaw] = useState(DEFAULT_OPTIONS)
  const [mode, setMode] = useState('group')
  const [prize, setPrize] = useState('')

  useEffect(() => {
    api.listRooms().then(r => setRooms(r.filter(rm => rm.status !== 'done'))).catch(() => {})
  }, [])

  async function handleJoinCode(e) {
    e.preventDefault()
    if (!code.trim()) return
    setLoading(true); setError('')
    try {
      const room = await api.getRoom(code.trim().toUpperCase())
      navigate(`/join/${room.code}`)
    } catch {
      setError('Sala no encontrada. Revisa el código.')
    }
    setLoading(false)
  }

  async function handleCreate(e) {
    e.preventDefault()
    const options = optionsRaw.split(',').map(s => s.trim()).filter(Boolean)
    if (options.length < 2) { setError('Mínimo 2 opciones separadas por coma'); return }
    if (!roomName.trim()) { setError('Ponle un nombre a la sala'); return }
    setLoading(true); setError('')
    try {
      // owner_id will be set after the player registers; we pass null for now
      // The JoinPage will handle setting owner when the creator joins
      const room = await api.createRoom({
        name: roomName.trim(),
        options,
        is_permanent: false,
        owner_id: null,
        mode,
        prize: mode === 'raffle' ? prize.trim() || null : null,
      })
      // Store intended-as-owner flag so JoinPage can claim ownership
      sessionStorage.setItem('spinit_pending_owner', room.id)
      navigate(`/join/${room.code}`)
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  const permanentRooms = rooms.filter(r => r.is_permanent)
  const activeRooms = rooms.filter(r => !r.is_permanent && r.status === 'waiting')

  return (
    <div style={s.page}>
      <div style={s.inner}>
        <div style={s.header}>
          <div style={s.logo}>Spin<span style={{ color: '#D85A30' }}>it</span></div>
          <button onClick={() => navigate('/')} style={s.backBtn}>← Inicio</button>
        </div>

        {/* Tabs */}
        <div style={s.tabs}>
          <button onClick={() => { setTab('join'); setError('') }} style={{ ...s.tab, ...(tab === 'join' ? s.tabActive : {}) }}>
            Unirme
          </button>
          <button onClick={() => { setTab('create'); setError('') }} style={{ ...s.tab, ...(tab === 'create' ? s.tabActive : {}) }}>
            Crear sala
          </button>
        </div>

        {/* JOIN TAB */}
        {tab === 'join' && (
          <div>
            <form onSubmit={handleJoinCode} style={s.row}>
              <input
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                placeholder="Código de sala (ej: ABC123)"
                maxLength={6}
                style={{ ...s.input, flex: 1, letterSpacing: '3px', fontFamily: 'monospace', fontSize: 18, textAlign: 'center' }}
                autoFocus
              />
              <button type="submit" disabled={loading || code.length < 4} style={{ ...s.btnPrimary, padding: '11px 22px' }}>
                →
              </button>
            </form>

            {(permanentRooms.length > 0 || activeRooms.length > 0) && (
              <div style={{ marginTop: '1.25rem' }}>
                <p style={s.sectionLabel}>Salas disponibles</p>
                <div style={s.roomList}>
                  {[...permanentRooms, ...activeRooms].slice(0, 6).map(room => (
                    <button key={room.id} onClick={() => navigate(`/join/${room.code}`)} style={s.roomBtn}>
                      <span style={{ fontWeight: 500, fontSize: 14 }}>{room.name}</span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>#{room.code}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* CREATE TAB */}
        {tab === 'create' && (
          <form onSubmit={handleCreate}>
            <p style={s.sectionLabel}>Nombre de la sala</p>
            <input
              value={roomName}
              onChange={e => setRoomName(e.target.value)}
              placeholder="Ej: Noche de decisiones 🎲"
              maxLength={80}
              required
              style={{ ...s.input, width: '100%', marginBottom: '1rem' }}
              autoFocus
            />

            <p style={s.sectionLabel}>Opciones de la ruleta <span style={{ color: 'rgba(255,255,255,0.2)' }}>(separadas por coma · máx. 8)</span></p>
            <textarea
              value={optionsRaw}
              onChange={e => setOptionsRaw(e.target.value)}
              rows={3}
              style={{ ...s.input, width: '100%', resize: 'vertical', fontFamily: "'DM Sans', sans-serif", marginBottom: '0.5rem' }}
            />

            {/* Preview tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: '1.25rem', minHeight: 28 }}>
              {optionsRaw.split(',').map(o => o.trim()).filter(Boolean).slice(0, 8).map((opt, i) => (
                <span key={i} style={s.tag}>{opt}</span>
              ))}
            </div>

            {/* Mode selector */}
            <p style={s.sectionLabel}>Modo de juego</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: '1rem' }}>
              {[['group','🎯 Decisión grupal'],['raffle','🎰 Sorteo con ganador']].map(([val, label]) => (
                <button key={val} type="button" onClick={() => setMode(val)}
                  style={{
                    flex: 1, fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500,
                    padding: '9px 8px', borderRadius: 10, cursor: 'pointer',
                    background: mode === val ? 'rgba(216,90,48,0.15)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${mode === val ? 'rgba(216,90,48,0.35)' : 'rgba(255,255,255,0.08)'}`,
                    color: mode === val ? '#D85A30' : 'rgba(255,255,255,0.4)',
                  }}>
                  {label}
                </button>
              ))}
            </div>

            {/* Prize (raffle only) */}
            {mode === 'raffle' && (
              <div style={{ marginBottom: '1rem' }}>
                <p style={s.sectionLabel}>Premio <span style={{ color: 'rgba(255,255,255,0.2)' }}>(opcional)</span></p>
                <input
                  value={prize}
                  onChange={e => setPrize(e.target.value)}
                  placeholder="Ej: Cena gratis 🍕, No lavar los platos..."
                  maxLength={120}
                  style={{ ...s.input, width: '100%' }}
                />
              </div>
            )}

            <button type="submit" disabled={loading} style={{ ...s.btnPrimary, width: '100%', opacity: loading ? 0.5 : 1 }}>
              {loading ? 'Creando...' : 'Crear sala y entrar →'}
            </button>
          </form>
        )}

        {error && <p style={s.error}>{error}</p>}

        <p style={{ textAlign: 'center', marginTop: '2rem' }}>
          <a href="/admin" style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)', textDecoration: 'none' }}>admin</a>
        </p>
      </div>
    </div>
  )
}

const s = {
  page: {
    minHeight: '100vh',
    background: '#0f0f0f',
    color: 'white',
    fontFamily: "'DM Sans', sans-serif",
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '2rem 1rem',
  },
  inner: { width: '100%', maxWidth: 420 },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  logo: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 26,
    fontWeight: 800,
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.3)',
    fontSize: 13,
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
  },
  tabs: {
    display: 'flex',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 12,
    padding: 4,
    marginBottom: '1.5rem',
    gap: 4,
  },
  tab: {
    flex: 1,
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 13,
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.35)',
    borderRadius: 8,
    padding: '9px',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  tabActive: {
    background: 'rgba(216,90,48,0.15)',
    color: '#D85A30',
    border: '1px solid rgba(216,90,48,0.25)',
  },
  sectionLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: 8,
  },
  row: { display: 'flex', gap: 8 },
  input: {
    fontSize: 14,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: '11px 14px',
    color: 'white',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  },
  btnPrimary: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 15,
    background: '#D85A30',
    color: 'white',
    border: 'none',
    borderRadius: 10,
    padding: '11px 22px',
    cursor: 'pointer',
    transition: 'opacity 0.15s',
  },
  tag: {
    fontSize: 12,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: '3px 10px',
    color: 'rgba(255,255,255,0.5)',
  },
  roomList: { display: 'flex', flexDirection: 'column', gap: 6 },
  roomBtn: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 10,
    padding: '10px 14px',
    color: 'white',
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    textAlign: 'left',
  },
  error: {
    color: '#F09595',
    fontSize: 13,
    marginTop: '0.75rem',
    textAlign: 'center',
  },
}
