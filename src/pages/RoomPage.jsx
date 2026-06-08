import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useRoom } from '../hooks/useRoom'
import Wheel from '../components/Wheel'
import Avatar from '../components/Avatar'
import { avatarSVG } from '../lib/avatar'

const STATUS_LABEL = {
  waiting:   'Esperando para iniciar...',
  spinning:  '¡Todos giran ahora!',
  revealing: 'Revelando resultado...',
  done:      'Ronda terminada',
}

export default function RoomPage() {
  const { roomId } = useParams()
  const navigate   = useNavigate()
  const wheelRef   = useRef(null)

  const [me, setMe]             = useState(null)
  const [spinning, setSpinning] = useState(false)
  const [hasSpun, setHasSpun]   = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [rafflePhase, setRafflePhase] = useState('idle') // idle | drumroll | winner

  const { room, players, spunIds, result, error, connected, wsReady, submitSpin } = useRoom(roomId, me?.id)

  useEffect(() => {
    // Try room-specific localStorage key first (survives browser close)
    // Fall back to sessionStorage for backward compat
    const localKey = `spinit_player_${roomId}`
    const stored = localStorage.getItem(localKey) || sessionStorage.getItem('spinit_player')
    if (!stored) { navigate('/'); return }
    const session = JSON.parse(stored)
    // Ensure session is for this room
    if (session.room_id && session.room_id !== roomId) {
      navigate('/')
      return
    }
    // Keep sessionStorage in sync
    sessionStorage.setItem('spinit_player', stored)
    setMe(session)
  }, [roomId])

  // When result arrives → show wheel flip first, then reveal card
  useEffect(() => {
    if (result) {
      // Short delay so wheel flip animation plays first
      const t1 = setTimeout(() => setShowResult(true), 900)
      // If raffle mode, add drumroll phase
      if (result.raffle_winner_id) {
        const t2 = setTimeout(() => setRafflePhase('drumroll'), 1400)
        const t3 = setTimeout(() => setRafflePhase('winner'),   3200)
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
      }
      return () => clearTimeout(t1)
    } else {
      setShowResult(false)
      setRafflePhase('idle')
    }
  }, [result])

  // Reset on new round
  useEffect(() => {
    if (room?.status === 'spinning') {
      setHasSpun(false)
      setSpinning(false)
      setShowResult(false)
      setRafflePhase('idle')
    }
  }, [room?.status])

  function handleSpin() {
    if (spinning || hasSpun || room?.status !== 'spinning') return
    if (!optionsReady) return
    setSpinning(true)
    wheelRef.current?.spin((spinResult) => {
      setSpinning(false)
      setHasSpun(true)
      submitSpin(spinResult)
    })
  }

  async function changeRoomStatus(newStatus) {
    try {
      const { api } = await import('../lib/api')
      await api.changeStatus(roomId, { owner_id: me.id, new_status: newStatus })
    } catch (e) {
      console.error('Status change failed:', e.message)
    }
  }

  if (!me || !room) {
    return (
      <div style={s.loading}>
        <div style={s.spinner} />
        <p style={{ color: 'rgba(255,255,255,0.4)', marginTop: 16, fontSize: 14 }}>
          {!connected ? 'Conectando...' : 'Cargando sala...'}
        </p>
      </div>
    )
  }

  const onlinePlayers = players.filter(p => p.is_online)
  const spunCount     = spunIds.size
  const totalOnline   = onlinePlayers.length
  const progressPct   = totalOnline > 0 ? Math.round((spunCount / totalOnline) * 100) : 0
  const isOwner       = me?.is_owner || room?.owner_id === me?.id
  const isRaffle      = room.mode === 'raffle'
  // In raffle mode the wheel sectors ARE the player names
  // Use all players (not just is_online) to avoid timing issues where
  // a player briefly appears offline during reconnection
  const raffleOptions = players.map(p => p.name)
  // Group mode: use room.options (strip 'sorteo' placeholder just in case)
  const groupOptions  = room.options.filter(o => o !== 'sorteo')
  const wheelOptions  = isRaffle ? raffleOptions : groupOptions
  // Wheel is revealed once result is shown
  const wheelRevealed = showResult
  // Ready once WS init received. Group always has options; raffle needs at least 1 player.
  const optionsReady  = wsReady && (isRaffle ? raffleOptions.length > 0 : groupOptions.length > 0)

  return (
    <div style={s.page}>

      {/* ── Header ── */}
      <div style={s.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/lobby')} style={s.backBtn}>←</button>
          <div style={s.logo}>Spin<span style={{ color: '#D85A30' }}>it</span></div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {isRaffle && room.prize && (
            <div style={s.prizeBadge}>🏆 {room.prize}</div>
          )}
          {isRaffle && (
            <div style={s.modeBadge}>Sorteo</div>
          )}
          <div style={s.codeBadge}>#{room.code}</div>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: connected ? '#1D9E75' : '#666' }} />
        </div>
      </div>

      {/* ── Status bar ── */}
      <div style={s.statusBar}>
        <div style={{
          ...s.statusPill,
          background: room.status === 'spinning' ? 'rgba(216,90,48,0.15)' : 'rgba(255,255,255,0.06)',
          border: `1px solid ${room.status === 'spinning' ? 'rgba(216,90,48,0.35)' : 'rgba(255,255,255,0.08)'}`,
          color: room.status === 'spinning' ? '#D85A30' : 'rgba(255,255,255,0.5)',
        }}>
          {room.status === 'spinning' && <span style={s.pulseDot} />}
          {STATUS_LABEL[room.status] || room.status}
        </div>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>Ronda {room.round_number}</span>
      </div>

      <div style={s.main} className="room-main">

        {/* ── Wheel column ── */}
        <div style={s.wheelCol} className="wheel-col">

          {/* Wheel */}
          <div style={{ ...s.wheelWrap, marginBottom: 44 /* space for hidden label */ }}>
            <Wheel
              ref={wheelRef}
              options={wheelOptions.length > 0 ? wheelOptions : ['?']}
              revealed={wheelRevealed}
            />
          </div>

          {/* Spin button */}
          {room.status === 'spinning' && (
            <button
              onClick={handleSpin}
              disabled={spinning || hasSpun || !optionsReady}
              style={{
                ...s.spinBtn,
                background: hasSpun ? 'rgba(255,255,255,0.06)' : '#D85A30',
                color: hasSpun ? 'rgba(255,255,255,0.4)' : 'white',
                border: hasSpun ? '1px solid rgba(255,255,255,0.1)' : 'none',
                cursor: spinning || hasSpun ? 'not-allowed' : 'pointer',
                opacity: spinning ? 0.7 : 1,
              }}
            >
              {spinning ? '⏳ Girando...' : hasSpun ? '✓ Girado — esperando a los demás' : !wsReady ? '⏳ Conectando...' : !optionsReady ? '⏳ Cargando jugadores...' : '🎡 Girar ruleta'}
            </button>
          )}

          {room.status === 'waiting' && !isOwner && (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center' }}>
              El creador iniciará la ronda
            </p>
          )}

          {/* Owner controls */}
          {isOwner && (
            <div style={s.ownerPanel}>
              <p style={s.ownerLabel}>⚙️ Controles del creador</p>
              {room.status === 'waiting' && (
                <button onClick={() => changeRoomStatus('spinning')} style={s.ownerBtn}>
                  ▶ Iniciar ronda
                </button>
              )}
              {room.status === 'spinning' && (
                <button onClick={() => changeRoomStatus('waiting')} style={{ ...s.ownerBtn, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  ⏸ Pausar
                </button>
              )}
              {room.status === 'revealing' && (
                <button onClick={() => changeRoomStatus('spinning')} style={s.ownerBtn}>
                  ↺ Nueva ronda
                </button>
              )}
              <button
                onClick={() => navigator.clipboard.writeText(`${window.location.origin}/join/${room.code}`)}
                style={{ ...s.ownerBtn, background: 'transparent', color: 'rgba(255,255,255,0.25)', border: '1px solid rgba(255,255,255,0.07)', fontSize: 12 }}
              >
                📋 Copiar link de invitación
              </button>
            </div>
          )}

          {/* Progress */}
          {room.status === 'spinning' && (
            <div style={s.progress}>
              <div style={s.progressBar}>
                <div style={{ ...s.progressFill, width: `${progressPct}%` }} />
              </div>
              <p style={s.progressText}>{spunCount} de {totalOnline} han girado</p>
            </div>
          )}

          {/* ── Result card ── */}
          {showResult && result && (
            <div style={{ ...s.resultCard }} className="result-card">

              {/* Group mode result */}
              {!isRaffle && (
                <>
                  <p style={s.resultLabel}>🎉 La ruleta decidió</p>
                  <p style={s.resultValue}>{result.winner}</p>
                  <p style={s.resultMeta}>
                    {result.vote_count} de {result.total_players} cayeron aquí
                    {result.tiebreak_applied && ' · Desempate aleatorio'}
                  </p>
                  <VoteBreakdown result={result} />
                </>
              )}

              {/* Raffle mode — drumroll phase */}
              {isRaffle && rafflePhase === 'drumroll' && (
                <>
                  <p style={s.resultLabel}>🎰 Opción ganadora</p>
                  <p style={s.resultValue}>{result.winner}</p>
                  <p style={{ ...s.resultMeta, color: '#D85A30', animation: 'pulse 0.6s ease-in-out infinite' }}>
                    🥁 Sorteando ganador...
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 8 }}>
                    {[0,1,2].map(i => (
                      <div key={i} style={{
                        width: 8, height: 8, borderRadius: '50%', background: '#D85A30',
                        animation: `pulse 0.6s ease-in-out ${i * 0.2}s infinite`,
                      }} />
                    ))}
                  </div>
                </>
              )}

              {/* Raffle mode — winner revealed */}
              {isRaffle && rafflePhase === 'winner' && result.raffle_winner_id && (
                <>
                  <p style={s.resultLabel}>🏆 {room.prize || 'Ganador del sorteo'}</p>
                  {/* Big winner avatar */}
                  <div style={{ display: 'flex', justifyContent: 'center', margin: '12px 0', animation: 'fadeUp 0.5s ease' }}>
                    <div style={{
                      width: 80, height: 80,
                      borderRadius: '50%',
                      border: '3px solid #D85A30',
                      overflow: 'hidden',
                      boxShadow: '0 0 0 6px rgba(216,90,48,0.15)',
                    }}
                      dangerouslySetInnerHTML={{ __html: avatarSVG(result.raffle_winner_avatar_style, result.raffle_winner_avatar_seed, 80) }}
                    />
                  </div>
                  <p style={{ ...s.resultValue, fontSize: 24 }}>{result.raffle_winner_name}</p>
                  <p style={s.resultMeta}>
                    Cayó en el sector <strong style={{ color: '#D85A30' }}>{result.winner}</strong>
                    {result.raffle_tiebreak && ' · Sorteado entre varios ganadores'}
                  </p>
                  <VoteBreakdown result={result} />
                </>
              )}

              {/* Raffle mode — no winner (no one landed on winning option) */}
              {isRaffle && rafflePhase === 'winner' && !result.raffle_winner_id && (
                <>
                  <p style={s.resultLabel}>🎰 Resultado</p>
                  <p style={s.resultValue}>{result.winner}</p>
                  <p style={s.resultMeta}>Nadie cayó en esta opción</p>
                  <VoteBreakdown result={result} />
                </>
              )}

            </div>
          )}
        </div>

        {/* ── Sidebar ── */}
        <div style={s.sidebar} className="room-sidebar">

          {/* Room info */}
          <p style={s.sideLabel}>Sala</p>
          <div style={{ marginBottom: '1.25rem' }}>
            <p style={{ fontWeight: 600, fontSize: 15, marginBottom: 3 }}>{room.name}</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
              {isRaffle ? '🎰 Modo sorteo' : '🎯 Modo decisión'} · Ronda {room.round_number}
            </p>
          </div>

          <p style={s.sideLabel}>Jugadores ({totalOnline})</p>
          <div style={s.playersList}>
            {players.map(p => {
              const isWinner = result?.raffle_winner_id === p.id && rafflePhase === 'winner'
              return (
                <div key={p.id} style={{
                  ...s.playerRow,
                  opacity: p.is_online ? 1 : 0.35,
                  background: isWinner
                    ? 'rgba(216,90,48,0.15)'
                    : p.id === me.id ? 'rgba(255,255,255,0.04)' : 'transparent',
                  border: isWinner
                    ? '1px solid rgba(216,90,48,0.4)'
                    : p.id === me.id ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
                }}>
                  <Avatar
                    style={p.avatar_style}
                    seed={p.avatar_seed}
                    size={34}
                    online={p.is_online}
                    border={isWinner}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ ...s.pName, color: isWinner ? '#D85A30' : 'white' }}>
                      {p.name}
                      {p.id === me.id && <span style={s.meTag}>tú</span>}
                      {isWinner && <span style={s.winnerTag}>🏆</span>}
                    </p>
                    <p style={s.pStatus}>
                      {!p.is_online ? 'Desconectado'
                        : spunIds.has(p.id) ? 'Giró ✓'
                        : room.status === 'spinning' ? 'Esperando...'
                        : 'En sala'}
                    </p>
                  </div>
                  {spunIds.has(p.id) && !isWinner && (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1D9E75', flexShrink: 0 }} />
                  )}
                </div>
              )
            })}
          </div>

          <p style={{ ...s.sideLabel, marginTop: '1.25rem' }}>
            {isRaffle ? `Participantes (${wheelOptions.length})` : `Opciones (${room.options.length})`}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {(isRaffle ? wheelOptions : room.options).map((opt, i) => (
              <span key={opt + i} style={{
                ...s.optionTag,
                background: result?.winner === opt && showResult ? 'rgba(216,90,48,0.15)' : 'rgba(255,255,255,0.05)',
                border: result?.winner === opt && showResult ? '1px solid rgba(216,90,48,0.35)' : '1px solid rgba(255,255,255,0.07)',
                color: result?.winner === opt && showResult ? '#D85A30' : 'rgba(255,255,255,0.5)',
              }}>
                {opt}
              </span>
            ))}
          </div>
        </div>
      </div>

      {error && <div style={s.errorToast}>{error}</div>}

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:none; } }
        @keyframes pulse  { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
        @keyframes spin   { to { transform: rotate(360deg); } }
        @media (max-width: 640px) {
          .room-main   { grid-template-columns: 1fr !important; }
          .room-sidebar { margin-top: 1.5rem; }
          .wheel-col   { padding-bottom: 2rem; }
          .result-card { max-width: 100% !important; }
        }
      `}</style>
    </div>
  )
}

// Vote breakdown sub-component
function VoteBreakdown({ result }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
      {Object.entries(result.all_votes)
        .sort((a, b) => b[1] - a[1])
        .map(([opt, count]) => (
          <div key={opt} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '6px 12px', borderRadius: 8,
            background: opt === result.winner ? 'rgba(216,90,48,0.12)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${opt === result.winner ? 'rgba(216,90,48,0.25)' : 'rgba(255,255,255,0.05)'}`,
          }}>
            <span style={{ fontSize: 13, color: opt === result.winner ? '#D85A30' : 'rgba(255,255,255,0.5)' }}>
              {opt === result.winner ? '★ ' : ''}{opt}
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: opt === result.winner ? '#D85A30' : 'rgba(255,255,255,0.3)' }}>
              {count}
            </span>
          </div>
        ))}
    </div>
  )
}

// ── Styles ──
const s = {
  page: {
    minHeight: '100vh',
    background: '#0f0f0f',
    color: 'white',
    fontFamily: "'DM Sans', sans-serif",
    padding: '1rem',
    maxWidth: 900,
    margin: '0 auto',
    overflowX: 'hidden',
  },
  loading: {
    minHeight: '100vh', background: '#0f0f0f',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  },
  spinner: {
    width: 32, height: 32,
    border: '3px solid rgba(255,255,255,0.08)',
    borderTop: '3px solid #D85A30',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: '0.75rem',
  },
  logo: { fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800 },
  backBtn: {
    background: 'none',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'rgba(255,255,255,0.35)',
    fontSize: 16,
    cursor: 'pointer',
    borderRadius: 8,
    padding: '4px 10px',
    fontFamily: "'DM Sans', sans-serif",
    lineHeight: 1,
    flexShrink: 0,
  },
  codeBadge: {
    fontSize: 13, background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20,
    padding: '3px 12px', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace',
  },
  prizeBadge: {
    fontSize: 12, fontWeight: 600,
    background: 'rgba(216,90,48,0.12)', border: '1px solid rgba(216,90,48,0.25)',
    borderRadius: 20, padding: '3px 12px', color: '#D85A30',
    maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  modeBadge: {
    fontSize: 11, fontWeight: 500,
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 20, padding: '3px 10px', color: 'rgba(255,255,255,0.35)',
  },
  statusBar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: '1rem',
  },
  statusPill: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    fontSize: 13, fontWeight: 500, borderRadius: 20, padding: '4px 14px',
  },
  pulseDot: {
    display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
    background: '#D85A30', animation: 'pulse 1.2s ease-in-out infinite',
  },
  main: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0,1fr) 260px',
    gap: '1.5rem',
    alignItems: 'start',
  },
  wheelCol: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
  },
  wheelWrap: {
    padding: 12,
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '50%',
  },
  spinBtn: {
    fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14,
    padding: '12px 32px', borderRadius: 12,
    transition: 'opacity 0.15s', letterSpacing: '0.2px',
  },
  ownerPanel: {
    width: '100%', maxWidth: 300,
    background: 'rgba(216,90,48,0.05)', border: '1px solid rgba(216,90,48,0.15)',
    borderRadius: 14, padding: '1rem',
    display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'stretch',
  },
  ownerLabel: {
    fontSize: 11, color: 'rgba(216,90,48,0.6)', fontWeight: 500,
    textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2,
  },
  ownerBtn: {
    fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 13,
    background: '#D85A30', color: 'white', border: 'none',
    borderRadius: 8, padding: '10px', cursor: 'pointer', transition: 'opacity 0.15s',
  },
  progress: { width: '100%', maxWidth: 300 },
  progressBar: {
    height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden',
  },
  progressFill: {
    height: '100%', background: '#D85A30', borderRadius: 3, transition: 'width 0.4s ease',
  },
  progressText: {
    fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: 6,
  },
  resultCard: {
    width: '100%', maxWidth: 320,
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(216,90,48,0.2)',
    borderRadius: 18, padding: '1.5rem', textAlign: 'center',
    animation: 'fadeUp 0.4s ease',
  },
  resultLabel: {
    fontSize: 11, color: 'rgba(255,255,255,0.35)',
    textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8,
  },
  resultValue: {
    fontFamily: "'Syne', sans-serif", fontWeight: 800,
    fontSize: 28, color: '#D85A30', marginBottom: 4,
  },
  resultMeta: {
    fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 4,
  },
  sidebar: {
    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: 16, padding: '1.25rem',
  },
  sideLabel: {
    fontSize: 11, color: 'rgba(255,255,255,0.25)', fontWeight: 500,
    letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 10,
  },
  playersList: { display: 'flex', flexDirection: 'column', gap: 5 },
  playerRow: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '6px 8px', borderRadius: 10, transition: 'all 0.2s',
  },
  pName: {
    fontSize: 14, fontWeight: 500,
    display: 'flex', alignItems: 'center', gap: 5,
  },
  meTag: {
    fontSize: 10, background: 'rgba(216,90,48,0.15)',
    color: '#D85A30', borderRadius: 4, padding: '1px 5px', fontWeight: 500,
  },
  winnerTag: { fontSize: 13 },
  pStatus: { fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 1 },
  optionTag: {
    fontSize: 12, borderRadius: 20,
    padding: '3px 10px', transition: 'all 0.3s',
  },
  errorToast: {
    position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
    background: '#F09595', color: '#501313',
    padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 500,
  },
}