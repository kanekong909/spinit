import { useState, useEffect } from 'react'
import { api } from '../lib/api'

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [rooms, setRooms] = useState([])
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', options: 'Pizza, Cine, Sushi, Karaoke', is_permanent: false })
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  async function loadRooms() {
    try {
      const data = await api.listRooms()
      setRooms(data)
    } catch (e) { setMsg(e.message) }
  }

  useEffect(() => { if (authed) loadRooms() }, [authed])

  async function handleCreate(e) {
    e.preventDefault()
    setLoading(true)
    setMsg('')
    try {
      const options = form.options.split(',').map(s => s.trim()).filter(Boolean)
      if (options.length < 2) { setMsg('Mínimo 2 opciones'); setLoading(false); return }
      await api.createRoom({ name: form.name, options, is_permanent: form.is_permanent, admin_password: password })
      setMsg('✅ Sala creada')
      setCreating(false)
      loadRooms()
    } catch (e) { setMsg(e.message) }
    setLoading(false)
  }

  async function handleStatus(roomId, newStatus) {
    setMsg('')
    try {
      await api.changeStatus(roomId, { admin_password: password, new_status: newStatus })
      setMsg(`✅ Estado cambiado a ${newStatus}`)
      loadRooms()
    } catch (e) { setMsg(e.message) }
  }

  async function handleDelete(roomId) {
    if (!confirm('¿Eliminar esta sala?')) return
    try {
      await api.deleteRoom(roomId, { admin_password: password })
      loadRooms()
    } catch (e) { setMsg(e.message) }
  }

  if (!authed) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.logo}>Spin<span style={{ color: '#D85A30' }}>it</span> <span style={{ fontWeight: 400, fontSize: 16, color: 'rgba(255,255,255,0.4)' }}>Admin</span></div>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Contraseña de admin..."
            style={styles.input}
            onKeyDown={e => e.key === 'Enter' && setAuthed(true)}
            autoFocus
          />
          <button onClick={() => setAuthed(true)} style={styles.btn}>Entrar</button>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div style={{ maxWidth: 700, width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={styles.logo}>Spin<span style={{ color: '#D85A30' }}>it</span> <span style={{ fontWeight: 400, fontSize: 16, color: 'rgba(255,255,255,0.4)' }}>Admin</span></div>
          <button onClick={() => setCreating(!creating)} style={styles.btn}>
            {creating ? 'Cancelar' : '+ Nueva sala'}
          </button>
        </div>

        {msg && <p style={{ color: msg.startsWith('✅') ? '#1D9E75' : '#F09595', fontSize: 13, marginBottom: '1rem' }}>{msg}</p>}

        {creating && (
          <form onSubmit={handleCreate} style={styles.createCard}>
            <p style={styles.sectionLabel}>Nueva sala</p>
            <input
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Nombre de la sala..."
              required
              style={styles.input}
            />
            <p style={{ ...styles.sectionLabel, marginTop: 12 }}>Opciones (separadas por coma, máx. 8)</p>
            <textarea
              value={form.options}
              onChange={e => setForm({ ...form, options: e.target.value })}
              rows={2}
              style={{ ...styles.input, resize: 'vertical', fontFamily: "'DM Sans', sans-serif" }}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>
              <input
                type="checkbox"
                checked={form.is_permanent}
                onChange={e => setForm({ ...form, is_permanent: e.target.checked })}
              />
              Sala permanente (sin expiración)
            </label>
            <button type="submit" disabled={loading} style={{ ...styles.btn, marginTop: 16, opacity: loading ? 0.5 : 1 }}>
              {loading ? 'Creando...' : 'Crear sala'}
            </button>
          </form>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {rooms.map(room => (
            <div key={room.id} style={styles.roomCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 16 }}>{room.name}</p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                    #{room.code} · {room.is_permanent ? 'Permanente' : 'Temporal'} · Ronda {room.round_number}
                  </p>
                </div>
                <span style={{
                  fontSize: 12, fontWeight: 500,
                  background: room.status === 'spinning' ? 'rgba(216,90,48,0.2)' : 'rgba(255,255,255,0.06)',
                  color: room.status === 'spinning' ? '#D85A30' : 'rgba(255,255,255,0.4)',
                  border: `1px solid ${room.status === 'spinning' ? 'rgba(216,90,48,0.3)' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 20,
                  padding: '3px 10px',
                }}>
                  {room.status}
                </span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12 }}>
                {room.options.map((opt, i) => (
                  <span key={i} style={styles.tag}>{opt}</span>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {room.status === 'waiting' && (
                  <button onClick={() => handleStatus(room.id, 'spinning')} style={styles.actionBtn}>
                    ▶ Iniciar ronda
                  </button>
                )}
                {room.status === 'spinning' && (
                  <button onClick={() => handleStatus(room.id, 'waiting')} style={styles.actionBtn}>
                    ⏸ Pausar
                  </button>
                )}
                {room.status === 'revealing' && (
                  <button onClick={() => handleStatus(room.id, 'waiting')} style={styles.actionBtn}>
                    ↺ Nueva ronda
                  </button>
                )}
                <button
                  onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/join/${room.code}`) }}
                  style={{ ...styles.actionBtn, background: 'rgba(255,255,255,0.04)' }}
                >
                  📋 Copiar link
                </button>
                <button onClick={() => handleDelete(room.id)} style={{ ...styles.actionBtn, color: '#F09595', background: 'rgba(240,149,149,0.08)', border: '1px solid rgba(240,149,149,0.15)' }}>
                  Eliminar
                </button>
              </div>
            </div>
          ))}

          {rooms.length === 0 && !creating && (
            <p style={{ color: 'rgba(255,255,255,0.25)', textAlign: 'center', padding: '2rem' }}>
              No hay salas. Crea una con el botón de arriba.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#0f0f0f',
    color: 'white',
    fontFamily: "'DM Sans', sans-serif",
    display: 'flex',
    justifyContent: 'center',
    padding: '2rem 1rem',
  },
  card: {
    background: '#1a1a1a',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: '2rem',
    width: '100%',
    maxWidth: 380,
    alignSelf: 'flex-start',
  },
  logo: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 26,
    fontWeight: 800,
    marginBottom: '1.5rem',
  },
  input: {
    width: '100%',
    fontSize: 14,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: '10px 12px',
    color: 'white',
    boxSizing: 'border-box',
    outline: 'none',
  },
  btn: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 13,
    background: '#D85A30',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    padding: '10px 20px',
    cursor: 'pointer',
    marginTop: 12,
  },
  createCard: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: '1.25rem',
    marginBottom: '1.5rem',
  },
  sectionLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.35)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: 8,
  },
  roomCard: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 14,
    padding: '1.25rem',
  },
  tag: {
    fontSize: 12,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: '2px 8px',
    color: 'rgba(255,255,255,0.5)',
  },
  actionBtn: {
    fontSize: 12,
    fontWeight: 500,
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: '6px 14px',
    color: 'rgba(255,255,255,0.7)',
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
  },
}
