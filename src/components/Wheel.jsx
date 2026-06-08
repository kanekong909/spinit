import { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react'

const COLORS = [
  '#00ffff',  // Cyan neón
  '#ff00ff',  // Magenta neón
  '#00ff88',  // Verde neón
  '#ffaa00',  // Amarillo neón
  '#aa00ff',  // Púrpura neón
  '#ff4400',  // Naranja neón
  '#00ccff',  // Azul neón
  '#ff0066'   // Rosa neón
]
const PATTERNS = ['◈', '◆', '◉', '⬟', '◓', '◒', '◐', '◑']

// Pointer is at the TOP (12 o'clock = -π/2 in canvas coords).
// We start the wheel rotated so sector 0 is centered under the pointer.
const POINTER_ANGLE = -Math.PI / 2

const Wheel = forwardRef(function Wheel({ options, revealed = false }, ref) {
  const canvasRef  = useRef(null)
  // Start so the middle of sector 0 is exactly at the pointer
  const angleRef   = useRef(POINTER_ANGLE - (Math.PI / options.length))
  const animRef    = useRef(null)
  const [flipAngle,  setFlipAngle]  = useState(0)
  const [isFlipping, setIsFlipping] = useState(false)
  const [showBack,   setShowBack]   = useState(false)

  function getIndexAtPointer(angle) {
    const arc = (2 * Math.PI) / options.length
    // Normalize so that angle=0 means pointer points at start of sector 0
    const offset = angle - POINTER_ANGLE
    // Which sector is under the pointer (pointer is at top, sectors go clockwise)
    const norm = ((-offset % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
    return Math.floor(norm / arc) % options.length
  }

  function draw(angle, showText) {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx  = canvas.getContext('2d')
    const size = canvas.width
    const cx = size / 2, cy = size / 2, r = size / 2 - 4
    const arc = (2 * Math.PI) / options.length

    ctx.clearRect(0, 0, size, size)

    options.forEach((opt, i) => {
      const start = angle + i * arc
      const end   = start + arc

      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, r, start, end)
      ctx.fillStyle = COLORS[i % COLORS.length]
      ctx.fill()
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.4)'
      ctx.lineWidth = 1.5
      ctx.shadowBlur = 2
      ctx.shadowColor = '#00ffff'
      ctx.stroke()
      ctx.shadowBlur = 0

      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(start + arc / 2)

      if (showText) {
        ctx.textAlign = 'right'
        ctx.fillStyle = '#ffffff'
        ctx.shadowBlur = 3
        ctx.shadowColor = '#00ffff'
        const fs = options.length > 6 ? 12 : 14
        ctx.font = `600 ${fs}px 'Rajdhani', 'DM Sans', sans-serif`
        const label = opt.length > 12 ? opt.slice(0, 12) + '…' : opt
        ctx.fillText(label, r - 12, 5)
        ctx.shadowBlur = 0
      } else {
        ctx.textAlign = 'center'
        ctx.fillStyle = 'rgba(0, 255, 255, 0.5)'
        ctx.font = `bold 16px monospace`
        ctx.fillText(PATTERNS[i % PATTERNS.length], r * 0.62, 5)
        ctx.fillStyle = 'rgba(0, 255, 255, 0.2)'
        ctx.font = `bold 10px 'Orbitron', monospace`
        ctx.fillText('?', r - 15, 5)
      }
      ctx.restore()
    })

    // Center circle - estilo neón
    ctx.beginPath()
    ctx.arc(cx, cy, 22, 0, 2 * Math.PI)
    ctx.fillStyle = '#0a0a0f'
    ctx.fill()
    ctx.strokeStyle = '#00ffff'
    ctx.lineWidth = 2
    ctx.stroke()
    ctx.shadowBlur = 8
    ctx.shadowColor = '#00ffff'
    ctx.fillStyle = '#00ffff'
    ctx.font = `bold 14px 'Orbitron', monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(showText ? '★' : '?', cx, cy)
    ctx.shadowBlur = 0
    ctx.textBaseline = 'alphabetic'
  }

  useEffect(() => {
    // Reset angle when options change (new round)
    angleRef.current = POINTER_ANGLE - (Math.PI / options.length)
    draw(angleRef.current, showBack)
  }, [options])

  useEffect(() => {
    draw(angleRef.current, showBack)
  }, [showBack])

  // Flip animation when revealed becomes true
  useEffect(() => {
    if (!revealed) {
      setShowBack(false)
      setFlipAngle(0)
      return
    }
    setIsFlipping(true)
    const duration = 700
    const start = performance.now()
    let swapped = false

    function animFlip(now) {
      const t = Math.min((now - start) / duration, 1)
      const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
      const deg = ease * 180
      setFlipAngle(deg)
      if (deg >= 90 && !swapped) {
        swapped = true
        setShowBack(true)
      }
      if (t < 1) requestAnimationFrame(animFlip)
      else { setFlipAngle(180); setIsFlipping(false) }
    }
    requestAnimationFrame(animFlip)
  }, [revealed])

  useImperativeHandle(ref, () => ({
    spin(onDone) {
      if (animRef.current) return
      const spinAmount = Math.PI * 2 * (8 + Math.random() * 10)
      const duration   = 4000
      const start      = performance.now()
      const startAngle = angleRef.current

      function animate(now) {
        const t    = Math.min((now - start) / duration, 1)
        const ease = 1 - Math.pow(1 - t, 4)
        angleRef.current = startAngle + spinAmount * ease
        draw(angleRef.current, false)
        if (t < 1) {
          animRef.current = requestAnimationFrame(animate)
        } else {
          animRef.current = null
          const idx = getIndexAtPointer(angleRef.current)
          onDone(options[idx])
        }
      }
      animRef.current = requestAnimationFrame(animate)
    },
  }))

  const scaleX = Math.cos((flipAngle * Math.PI) / 180)

  return (
    <div style={{
      position: 'relative',
      display: 'inline-block',
      filter: revealed ? 'drop-shadow(0 0 15px rgba(0, 255, 255, 0.3))' : 'none',
      transition: 'filter 0.5s ease',
    }}>
      {/* Pointer - estilo neón */}
      <div style={{
        position: 'absolute', top: -14, left: '50%',
        transform: 'translateX(-50%)',
        width: 0, height: 0,
        borderLeft: '12px solid transparent',
        borderRight: '12px solid transparent',
        borderTop: '24px solid #00ffff',
        zIndex: 10,
        filter: 'drop-shadow(0 0 8px rgba(0, 255, 255, 0.7)) drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
      }} />

      <div style={{ transform: `scaleX(${scaleX})`, display: 'inline-block' }}>
        <canvas
          ref={canvasRef}
          width={280} height={280}
          style={{
            borderRadius: '50%',
            display: 'block',
            boxShadow: '0 0 20px rgba(0, 255, 255, 0.2), inset 0 0 10px rgba(0, 255, 255, 0.05)',
            border: '1px solid rgba(0, 255, 255, 0.3)',
          }}
        />
      </div>

      {!revealed && (
        <div style={{
          position: 'absolute', bottom: -32, left: '50%',
          transform: 'translateX(-50%)',
          whiteSpace: 'nowrap', fontSize: 10,
          color: '#ff00ff',
          textTransform: 'uppercase',
          letterSpacing: '1.5px',
          display: 'flex', alignItems: 'center', gap: 6,
          fontFamily: "'Orbitron', monospace",
          textShadow: '0 0 3px #ff00ff',
        }}>
          <span style={{ fontSize: 10 }}>🔒</span> OPINIONES OCULTAS
          <span style={{ fontSize: 10 }}>🔒</span>
        </div>
      )}
    </div>
  )
})

export default Wheel
