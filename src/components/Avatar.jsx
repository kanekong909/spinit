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
          border: border ? '2px solid #D85A30' : '2px solid rgba(255,255,255,0.1)',
          display: 'block',
          flexShrink: 0,
        }}
      />

      {/* Overlay desconectado */}
      {!online && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'rgba(0,0,0,0.5)',
        }} />
      )}

      {/* Indicador online/offline */}
      <div style={{
        position: 'absolute',
        bottom: 1, right: 1,
        width: Math.max(7, size * 0.22),
        height: Math.max(7, size * 0.22),
        borderRadius: '50%',
        background: online ? '#1D9E75' : '#666',
        border: `${size > 40 ? 2 : 1.5}px solid #0f0f0f`,
      }} />
    </div>
  )
}