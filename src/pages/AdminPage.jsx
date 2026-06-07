import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../lib/api'

export default function AdminPage() {
  const navigate = useNavigate()
  const [password, setPassword]   = useState('')
  const [authed, setAuthed]       = useState(false)
  const [rooms, setRooms]         = useState([])
  const [creating, setCreating]   = useState(false)
  const [form, setForm]           = useState({
    name: '', options: 'Pizza, Cine, Sushi, Karaoke',
    is_permanent: false, mode: 'group', prize: ''
  })
  const [msg, setMsg]       = useState('')
  const [loading, setLoading] = useState(false)

  async function loadRooms() {
    try { setRooms(await api.listRooms()) }
    catch (e) { setMsg(e.message) }
  }

  useEffect(() => { if (authed) loadRooms() }, [authed])

  async function handleCreate(e) {
    e.preventDefault()
    setLoading(true); setMsg('')
    try {
      const options = form.mode === 'raffle'
        ? ['sorteo']
        : form.options.split(',').map(s => s.trim()).filter(Boolean)
      if (form.mode === 'group' && options.length < 2) {
        setMsg('Mínimo 2 opciones'); setLoading(false); return
      }
      await api.createRoom({
        name: form.name, options,
        is_permanent: form.is_permanent,
        owner_id: password,   // admin password acts as owner_id for server-level ops
        mode: form.mode,
        prize: form.mode === 'raffle' ? form.prize || null : null,
      })
      setMsg('✅ Sala creada')
      setCreating(false)
      loadRooms()
    } catch (e) { setMsg(e.message) }
    setLoading(false)
  }

  async function handleStatus(roomId, newStatus) {
    setMsg('')
    try {
      await api.changeStatus(roomId, { owner_id: password, new_status: newStatus })
      setMsg(`✅ Estado → ${newStatus}`)
      loadRooms()
    } catch (e) { setMsg(e.message) }
  }

  async function handleDelete(roomId) {
    if (!confirm('¿Eliminar esta sala?')) return
    try {
      await api.deleteRoom(roomId, { owner_id: password })
      setMsg('✅ Sala eliminada')
      loadRooms()
    } catch (e) { setMsg(e.message) }
  }

  // ── Login screen ──
  if (!authed) {
    return (
      <div style={s.page}>
        <div style={s.loginCard}>
          <Link to="/lobby" style={s.backLink}>← Volver</Link>
          <div style={s.logo}>Spin<span style={{ color: '#D85A30' }}>it</span>
            <span style={s.adminTag}>Admin</span>
          </div>
          <p style={s.loginHint}>Contraseña de administrador</p>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Contraseña..."
            style={s.input}
            onKeyDown={e => e.key === 'Enter' && password && setAuthed(true)}
            autoFocus
          />
          <button
            onClick={() => password && setAuthed(true)}
            disabled={!password}
            style={{ ...s.btnPrimary, width: '100%', marginTop: 12, opacity: password ? 1 : 0.4 }}
          >
            Entrar
          </button>
        </div>
      </div>
    )
  }

  // ── Main admin panel ──
  return (
    <div style={s.page}>
      <div style={{ maxWidth: 700, width: '100%' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link to="/lobby" style={s.backBtn}>←</Link>
            <div style={s.logo}>
              Spin<span style={{ color: '#D85A30' }}>it</span>
              <span style={s.adminTag}>Admin</span>
            </div>
          </div>
          <button onClick={() => setCreating(!creating)} style={s.btnPrimary}>
            {creating ? 'Cancelar' : '+ Nueva sala'}
          </button>
        </div>

        {msg && (
          <p style={{ color: msg.startsWith('✅') ? '#1D9E75' : '#F09595', fontSize: 13, marginBottom: '1rem' }}>
            {msg}
          </p>
        )}

        {/* Create form */}
        {creating && (
          <form onSubmit={handleCreate} style={s.createCard}>
            <p style={s.sectionLabel}>Nombre de la sala</p>
            <input
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Nombre..."
              required
              style={{ ...s.input, width: '100%', marginBottom: 12 }}
            />

            <p style={s.sectionLabel}>Modo</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {[['group','🎯 Decisión'],['raffle','🎰 Sorteo']].map(([val, label]) => (
                <button key={val} type="button"
                  onClick={() => setForm({ ...form, mode: val })}
                  style={{
                    flex: 1, fontSize: 13, fontWeight: 500,
                    padding: '8px', borderRadius: 8, cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                    background: form.mode === val ? 'rgba(216,90,48,0.15)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${form.mode === val ? 'rgba(216,90,48,0.35)' : 'rgba(255,255,255,0.08)'}`,
                    color: form.mode === val ? '#D85A30' : 'rgba(255,255,255,0.4)',
                  }}>
                  {label}
                </button>
              ))}
            </div>

            {form.mode === 'group' ? (
              <>
                <p style={s.sectionLabel}>Opciones (separadas por coma)</p>
                <textarea
                  value={form.options}
                  onChange={e => setForm({ ...form, options: e.target.value })}
                  rows={2}
                  style={{ ...s.input, width: '100%', resize: 'vertical', fontFamily: "'DM Sans',sans-serif", marginBottom: 12 }}
                />
              </>
            ) : (
              <>
                <p style={s.sectionLabel}>Premio <span style={{ color: 'rgba(255,255,255,0.2)' }}>(opcional)</span></p>
                <input
                  value={form.prize}
                  onChange={e => setForm({ ...form, prize: e.target.value })}
                  placeholder="Ej: Cena gratis 🍕"
                  maxLength={120}
                  style={{ ...s.input, width: '100%', marginBottom: 12 }}
                />
              </>
            )}

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>
              <input
                type="checkbox"
                checked={form.is_permanent}
                onChange={e => setForm({ ...form, is_permanent: e.target.checked })}
              />
              Sala permanente
            </label>

            <button type="submit" disabled={loading} style={{ ...s.btnPrimary, opacity: loading ? 0.5 : 1 }}>
              {loading ? 'Creando...' : 'Crear sala'}
            </button>
          </form>
        )}

        {/* Room list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rooms.map(room => (
            <div key={room.id} style={s.roomCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 15 }}>{room.name}</p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
                    #{room.code} · {room.mode === 'raffle' ? '🎰 Sorteo' : '🎯 Decisión'}
                    {room.prize && ` · ${room.prize}`}
                    {room.is_permanent && ' · Permanente'}
                    {' · Ronda '}{room.round_number}
                  </p>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 500, borderRadius: 20, padding: '3px 10px',
                  background: room.status === 'spinning' ? 'rgba(216,90,48,0.2)' : 'rgba(255,255,255,0.05)',
                  color: room.status === 'spinning' ? '#D85A30' : 'rgba(255,255,255,0.35)',
                  border: `1px solid ${room.status === 'spinning' ? 'rgba(216,90,48,0.3)' : 'rgba(255,255,255,0.07)'}`,
                }}>
                  {room.status}
                </span>
              </div>

              {room.mode === 'group' && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                  {room.options.map((opt, i) => (
                    <span key={i} style={s.tag}>{opt}</span>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {room.status === 'waiting' && (
                  <button onClick={() => handleStatus(room.id, 'spinning')} style={s.actionBtn}>▶ Iniciar</button>
                )}
                {room.status === 'spinning' && (
                  <button onClick={() => handleStatus(room.id, 'waiting')} style={s.actionBtn}>⏸ Pausar</button>
                )}
                {room.status === 'revealing' && (
                  <button onClick={() => handleStatus(room.id, 'spinning')} style={s.actionBtn}>↺ Nueva ronda</button>
                )}
                <button
                  onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/join/${room.code}`); setMsg('✅ Link copiado') }}
                  style={{ ...s.actionBtn, color: 'rgba(255,255,255,0.4)' }}
                >
                  📋 Copiar link
                </button>
                <button
                  onClick={() => handleDelete(room.id)}
                  style={{ ...s.actionBtn, color: '#F09595', background: 'rgba(240,149,149,0.06)', border: '1px solid rgba(240,149,149,0.15)' }}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}

          {rooms.length === 0 && !creating && (
            <p style={{ color: 'rgba(255,255,255,0.2)', textAlign: 'center', padding: '3rem 0' }}>
              No hay salas. Crea una con el botón de arriba.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

const s = {
  page: {
    minHeight: '100vh', background: '#0f0f0f', color: 'white',
    fontFamily: "'DM Sans', sans-serif",
    display: 'flex', justifyContent: 'center', padding: '2rem 1rem',
  },
  loginCard: {
    background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 16, padding: '2rem', width: '100%', maxWidth: 360, alignSelf: 'flex-start',
  },
  backLink: {
    display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.3)',
    textDecoration: 'none', marginBottom: '1rem',
  },
  backBtn: {
    background: 'none', border: '1px solid rgba(255,255,255,0.1)',
    color: 'rgba(255,255,255,0.35)', fontSize: 16, cursor: 'pointer',
    borderRadius: 8, padding: '4px 10px', textDecoration: 'none',
    fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5,
  },
  logo: {
    fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800,
    display: 'flex', alignItems: 'center', gap: 8,
  },
  adminTag: {
    fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,0.3)',
    fontFamily: "'DM Sans', sans-serif",
  },
  loginHint: { fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: '1.25rem 0 8px' },
  input: {
    fontSize: 14, background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
    padding: '10px 12px', color: 'white', outline: 'none', boxSizing: 'border-box',
  },
  btnPrimary: {
    fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13,
    background: '#D85A30', color: 'white', border: 'none',
    borderRadius: 8, padding: '10px 20px', cursor: 'pointer',
  },
  createCard: {
    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 14, padding: '1.25rem', marginBottom: '1.25rem',
  },
  sectionLabel: {
    fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase',
    letterSpacing: '0.5px', marginBottom: 8,
  },
  roomCard: {
    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 14, padding: '1.25rem',
  },
  tag: {
    fontSize: 12, background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20,
    padding: '2px 8px', color: 'rgba(255,255,255,0.4)',
  },
  actionBtn: {
    fontSize: 12, fontWeight: 500, background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8,
    padding: '6px 12px', color: 'rgba(255,255,255,0.6)',
    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
  },
}