import { avatarSVG } from '../lib/avatar'

export default function Avatar({ style = 'circle', seed = 'Player', size = 36, border = false, online = true }) {
  const svg = avatarSVG(style, seed, size)

  return (
    <div style={{ position: 'relative', flexShrink: 0, width: size, height: size }}>
      {/* SVG inline — sin peticiones externas, funciona siempre */}
      <div
        dangerouslySetInnerHTML={{ __html: svg }}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          overflow: 'hidden',
          border: border 
            ? '2px solid #00ffff' 
            : '2px solid rgba(0, 255, 255, 0.25)',
          boxShadow: border 
            ? `0 0 ${Math.max(8, size * 0.15)}px rgba(0, 255, 255, 0.4)` 
            : 'none',
          display: 'block',
          flexShrink: 0,
          transition: 'all 0.2s ease',
        }}
      />

      {/* Overlay desconectado */}
      {!online && (
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(2px)',
        }} />
      )}

      {/* Indicador online/offline - estilo neón */}
      <div style={{
        position: 'absolute',
        bottom: 1,
        right: 1,
        width: Math.max(8, size * 0.24),
        height: Math.max(8, size * 0.24),
        borderRadius: '50%',
        background: online ? '#00ffff' : '#ff00ff',
        boxShadow: online 
          ? `0 0 ${Math.max(6, size * 0.12)}px #00ffff` 
          : `0 0 ${Math.max(4, size * 0.1)}px #ff00ff`,
        border: `${size > 40 ? 2 : 1.5}px solid #0a0a0f`,
        transition: 'all 0.15s ease',
      }} />
    </div>
  )
}