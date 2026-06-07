import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const STEPS = [
  {
    icon: '🎡',
    title: 'Todos giran la ruleta',
    desc: 'Cuando sea tu turno, giras la ruleta. El resultado queda guardado pero completamente oculto para todos.',
  },
  {
    icon: '🔒',
    title: 'Nadie sabe dónde quedó',
    desc: 'Ni tú ni los demás ven en qué opción cayó tu ruleta. Solo el sistema lo sabe. Esto hace el juego 100% equitativo.',
  },
  {
    icon: '🎉',
    title: 'El sistema decide',
    desc: 'Cuando el último jugador gira, se revelan todos los resultados a la vez. La opción con más votos gana. En empate: aleatorio.',
  },
  {
    icon: '✏️',
    title: 'Tú decides qué hay en la ruleta',
    desc: 'El creador de la sala personaliza las opciones: tareas, destinos, juegos, nombres... lo que quieras.',
  },
]

export default function WelcomePage() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState('logo')   // logo | tagline | steps | cta
  const [stepIdx, setStepIdx] = useState(0)
  const [stepVisible, setStepVisible] = useState(true)

  // Animation sequence
  useEffect(() => {
    const t1 = setTimeout(() => setPhase('tagline'), 1200)
    const t2 = setTimeout(() => setPhase('steps'), 2400)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  // Auto-advance steps
  useEffect(() => {
    if (phase !== 'steps') return
    if (stepIdx >= STEPS.length) { setPhase('cta'); return }
    const t = setTimeout(() => {
      setStepVisible(false)
      setTimeout(() => {
        setStepIdx(i => i + 1)
        setStepVisible(true)
      }, 300)
    }, 2800)
    return () => clearTimeout(t)
  }, [phase, stepIdx])

  function skip() {
    setPhase('cta')
    setStepIdx(STEPS.length)
  }

  return (
    <div style={s.page}>
      {/* Background wheel decoration */}
      <div style={s.bgWheel} aria-hidden="true">
        {[...Array(8)].map((_, i) => (
          <div key={i} style={{
            ...s.bgSlice,
            transform: `rotate(${i * 45}deg)`,
            background: i % 2 === 0 ? 'rgba(216,90,48,0.06)' : 'rgba(255,255,255,0.02)',
          }} />
        ))}
      </div>

      <div style={s.inner}>
        {/* LOGO */}
        <div style={{
          ...s.logoWrap,
          opacity: phase !== 'logo' || true ? 1 : 0,
          transform: phase === 'logo' ? 'scale(0.85)' : 'scale(1)',
          transition: 'all 0.6s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
          <div style={s.logo}>
            Spin<span style={{ color: '#D85A30' }}>it</span>
          </div>
          <div style={{
            ...s.tagline,
            opacity: phase === 'tagline' || phase === 'steps' || phase === 'cta' ? 1 : 0,
            transform: phase === 'logo' ? 'translateY(8px)' : 'none',
            transition: 'all 0.5s ease 0.1s',
          }}>
            La ruleta donde nadie hace trampa
          </div>
        </div>

        {/* STEPS */}
        {(phase === 'steps' || (phase === 'cta' && stepIdx > 0)) && stepIdx < STEPS.length && (
          <div style={{
            ...s.stepCard,
            opacity: stepVisible ? 1 : 0,
            transform: stepVisible ? 'translateY(0)' : 'translateY(12px)',
            transition: 'all 0.3s ease',
          }}>
            <div style={s.stepDots}>
              {STEPS.map((_, i) => (
                <div key={i} style={{
                  ...s.dot,
                  background: i === stepIdx ? '#D85A30' : i < stepIdx ? 'rgba(216,90,48,0.4)' : 'rgba(255,255,255,0.12)',
                  width: i === stepIdx ? 20 : 6,
                }} />
              ))}
            </div>
            <div style={s.stepIcon}>{STEPS[stepIdx].icon}</div>
            <p style={s.stepTitle}>{STEPS[stepIdx].title}</p>
            <p style={s.stepDesc}>{STEPS[stepIdx].desc}</p>
          </div>
        )}

        {/* All steps shown as summary before CTA */}
        {phase === 'cta' && (
          <div style={{ ...s.summaryGrid, animation: 'fadeUp 0.4s ease' }}>
            {STEPS.map((step, i) => (
              <div key={i} style={s.summaryItem}>
                <span style={s.summaryIcon}>{step.icon}</span>
                <span style={s.summaryText}>{step.title}</span>
              </div>
            ))}
          </div>
        )}

        {/* CTA buttons */}
        {phase === 'cta' && (
          <div style={{ ...s.ctaWrap, animation: 'fadeUp 0.5s ease 0.1s both' }}>
            <button onClick={() => navigate('/lobby')} style={s.btnPrimary}>
              Entrar a jugar →
            </button>
            <button onClick={() => navigate('/lobby?create=1')} style={s.btnSecondary}>
              Crear una sala
            </button>
          </div>
        )}

        {/* Skip button during steps */}
        {phase === 'steps' && (
          <button onClick={skip} style={s.skipBtn}>
            Saltar →
          </button>
        )}
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: none; }
        }
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
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
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  bgWheel: {
    position: 'absolute',
    width: 600,
    height: 600,
    borderRadius: '50%',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%,-50%)',
    overflow: 'hidden',
    animation: 'spinSlow 60s linear infinite',
    pointerEvents: 'none',
  },
  bgSlice: {
    position: 'absolute',
    width: '50%',
    height: '50%',
    top: 0,
    left: '50%',
    transformOrigin: '0% 100%',
  },
  inner: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2rem',
    padding: '2rem 1rem',
    width: '100%',
    maxWidth: 460,
    textAlign: 'center',
  },
  logoWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    fontFamily: "'Syne', sans-serif",
    fontSize: 'clamp(52px, 12vw, 72px)',
    fontWeight: 800,
    letterSpacing: '-2px',
    lineHeight: 1,
  },
  tagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: '0.3px',
  },
  stepCard: {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: '2rem 1.75rem',
  },
  stepDots: {
    display: 'flex',
    gap: 6,
    justifyContent: 'center',
    marginBottom: '1.5rem',
    alignItems: 'center',
  },
  dot: {
    height: 6,
    borderRadius: 3,
    transition: 'all 0.3s ease',
  },
  stepIcon: {
    fontSize: 44,
    marginBottom: 12,
    display: 'block',
  },
  stepTitle: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 20,
    marginBottom: 10,
    lineHeight: 1.2,
  },
  stepDesc: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 1.6,
  },
  summaryGrid: {
    width: '100%',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
  },
  summaryItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: '10px 14px',
    textAlign: 'left',
  },
  summaryIcon: {
    fontSize: 22,
    flexShrink: 0,
  },
  summaryText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 1.3,
    fontWeight: 500,
  },
  ctaWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    width: '100%',
  },
  btnPrimary: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 16,
    background: '#D85A30',
    color: 'white',
    border: 'none',
    borderRadius: 12,
    padding: '14px',
    cursor: 'pointer',
    width: '100%',
    letterSpacing: '0.2px',
  },
  btnSecondary: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 15,
    background: 'rgba(255,255,255,0.05)',
    color: 'rgba(255,255,255,0.6)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: '13px',
    cursor: 'pointer',
    width: '100%',
  },
  skipBtn: {
    background: 'none',
    border: 'none',
    color: 'rgba(255,255,255,0.2)',
    fontSize: 13,
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    padding: '4px 8px',
  },
}
