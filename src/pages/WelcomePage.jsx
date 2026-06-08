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
        from {
          opacity: 0;
          transform: translateY(25px);
          filter: blur(2px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
          filter: blur(0);
        }
      }
      @keyframes spinSlow {
        from { transform: translate(-50%, -50%) rotate(0deg); }
        to   { transform: translate(-50%, -50%) rotate(360deg); }
      }
      @keyframes neonPulse {
        0% { opacity: 0.6; text-shadow: 0 0 2px #00ffff; }
        100% { opacity: 1; text-shadow: 0 0 10px #00ffff, 0 0 5px #ff00ff; }
      }
      button {
        transition: all 0.15s ease;
      }
      .btnPrimary:hover {
        background: #00ffff;
        color: #000;
        box-shadow: 0 0 20px #00ffff;
        border-color: #00ffff;
      }
      .btnSecondary:hover {
        background: #ff00ff;
        color: #000;
        box-shadow: 0 0 20px #ff00ff;
        border-color: #ff00ff;
      }
      .skipBtn:hover {
        color: #00ffff;
        border-color: #00ffff;
        box-shadow: 0 0 8px rgba(0, 255, 255, 0.4);
      }
      .summaryItem:hover {
        border-color: #ff00ff;
        box-shadow: 0 0 12px rgba(255, 0, 255, 0.3);
        transform: translateX(4px);
      }
      .stepCard {
        animation: neonPulse 1.5s ease-in-out infinite alternate;
      }
    `}</style>
    </div>
  )
}

const s = {
  page: {
    minHeight: '100vh',
    background: '#0a0a0f',
    backgroundImage: `
      repeating-linear-gradient(45deg, rgba(0, 255, 255, 0.02) 0px, rgba(0, 255, 255, 0.02) 2px, transparent 2px, transparent 8px),
      repeating-linear-gradient(135deg, rgba(255, 0, 255, 0.02) 0px, rgba(255, 0, 255, 0.02) 2px, transparent 2px, transparent 12px),
      radial-gradient(circle at 20% 30%, rgba(0, 255, 255, 0.08) 0%, transparent 50%)
    `,
    color: '#00ffff',
    fontFamily: "'Rajdhani', 'Segoe UI', monospace",
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  bgWheel: {
    position: 'absolute',
    width: 800,
    height: 800,
    borderRadius: '50%',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    overflow: 'hidden',
    animation: 'spinSlow 40s linear infinite',
    pointerEvents: 'none',
    opacity: 0.25,
    border: '1px solid rgba(0, 255, 255, 0.2)',
    boxShadow: '0 0 30px rgba(0, 255, 255, 0.1), inset 0 0 40px rgba(0, 255, 255, 0.05)',
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
    zIndex: 2,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2rem',
    padding: '2rem 1.5rem',
    width: '100%',
    maxWidth: 520,
    textAlign: 'center',
  },
  logoWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    fontFamily: "'Orbitron', 'Rajdhani', monospace",
    fontSize: 'clamp(58px, 14vw, 88px)',
    fontWeight: 900,
    letterSpacing: '4px',
    textShadow: '0 0 5px #00ffff, 0 0 15px #00ffff, 0 0 30px #00ffff80, 0 0 60px #ff00ff40',
    background: 'linear-gradient(135deg, #00ffff, #ff00ff)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    color: 'transparent',
    lineHeight: 1.1,
  },
  tagline: {
    fontSize: 13,
    color: '#ff00ff',
    letterSpacing: '3px',
    fontWeight: 500,
    textTransform: 'uppercase',
    textShadow: '0 0 5px #ff00ff',
    fontFamily: "'Rajdhani', monospace",
  },
  stepCard: {
    width: '100%',
    background: 'rgba(0, 0, 0, 0.65)',
    backdropFilter: 'blur(12px)',
    border: '1px solid #00ffff',
    borderRadius: 8,
    padding: '2rem 1.75rem',
    boxShadow: '0 0 20px rgba(0, 255, 255, 0.3), inset 0 0 20px rgba(0, 255, 255, 0.05)',
    transition: 'all 0.2s ease',
  },
  stepDots: {
    display: 'flex',
    gap: 10,
    justifyContent: 'center',
    marginBottom: '1.75rem',
    alignItems: 'center',
  },
  dot: {
    height: 4,
    borderRadius: 2,
    transition: 'all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1)',
    background: '#ff00ff',
  },
  stepIcon: {
    fontSize: 54,
    marginBottom: 16,
    display: 'block',
    filter: 'drop-shadow(0 0 8px #00ffff) drop-shadow(0 0 4px #ff00ff)',
  },
  stepTitle: {
    fontFamily: "'Orbitron', monospace",
    fontWeight: 700,
    fontSize: 20,
    marginBottom: 12,
    lineHeight: 1.3,
    letterSpacing: '1px',
    textShadow: '0 0 3px #00ffff',
    color: '#00ffff',
  },
  stepDesc: {
    fontSize: 14,
    color: 'rgba(0, 255, 255, 0.7)',
    lineHeight: 1.55,
    fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 500,
  },
  summaryGrid: {
    width: '100%',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
  },
  summaryItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: 'rgba(0, 0, 0, 0.7)',
    border: '1px solid rgba(0, 255, 255, 0.4)',
    borderRadius: 6,
    padding: '12px 14px',
    textAlign: 'left',
    transition: 'all 0.2s',
    cursor: 'default',
  },
  summaryIcon: {
    fontSize: 26,
    flexShrink: 0,
    filter: 'drop-shadow(0 0 4px #ff00ff)',
  },
  summaryText: {
    fontSize: 12,
    color: '#00ffff',
    lineHeight: 1.35,
    fontWeight: 600,
    letterSpacing: '0.5px',
    fontFamily: "'Rajdhani', monospace",
  },
  ctaWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    width: '100%',
  },
  btnPrimary: {
    fontFamily: "'Orbitron', monospace",
    fontWeight: 700,
    fontSize: 16,
    letterSpacing: '2px',
    background: 'transparent',
    color: '#00ffff',
    border: '2px solid #00ffff',
    borderRadius: 0,
    padding: '14px 20px',
    cursor: 'pointer',
    width: '100%',
    textTransform: 'uppercase',
    boxShadow: '0 0 8px rgba(0, 255, 255, 0.5), inset 0 0 4px rgba(0, 255, 255, 0.3)',
    transition: 'all 0.2s',
  },
  btnSecondary: {
    fontFamily: "'Orbitron', monospace",
    fontWeight: 600,
    fontSize: 14,
    letterSpacing: '1.5px',
    background: 'transparent',
    color: '#ff00ff',
    border: '2px solid #ff00ff',
    borderRadius: 0,
    padding: '13px 20px',
    cursor: 'pointer',
    width: '100%',
    textTransform: 'uppercase',
    boxShadow: '0 0 6px rgba(255, 0, 255, 0.4), inset 0 0 2px rgba(255, 0, 255, 0.2)',
    transition: 'all 0.2s',
  },
  skipBtn: {
    background: 'transparent',
    border: '1px solid rgba(0, 255, 255, 0.4)',
    borderRadius: 0,
    color: 'rgba(0, 255, 255, 0.6)',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '2px',
    cursor: 'pointer',
    fontFamily: "'Rajdhani', monospace",
    padding: '6px 16px',
    marginTop: 8,
    transition: 'all 0.2s',
    textTransform: 'uppercase',
  },
}
