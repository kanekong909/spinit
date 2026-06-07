// Genera avatares SVG localmente — sin APIs externas, sin dependencias.
// Cada avatar se deriva determinísticamente del `seed` (nombre del jugador).

// 8 "estilos" visuales — en realidad son combinaciones de forma de fondo + cara
export const AVATAR_STYLES = [
  { id: 'circle',   label: 'Círculo'   },
  { id: 'rounded',  label: 'Redondeado'},
  { id: 'diamond',  label: 'Diamante'  },
  { id: 'hexagon',  label: 'Hexágono' },
  { id: 'star',     label: 'Estrella'  },
  { id: 'shield',   label: 'Escudo'    },
  { id: 'wave',     label: 'Ola'       },
  { id: 'blob',     label: 'Blob'      },
]

const BG_PALETTES = [
  ['#FFB347','#FF6B6B'],  // naranja-rojo
  ['#4ECDC4','#44A3AA'],  // teal
  ['#A8E6CF','#56C596'],  // verde
  ['#C9B1FF','#9B59B6'],  // morado
  ['#FFD93D','#FF9F1C'],  // amarillo
  ['#74B9FF','#0984E3'],  // azul
  ['#FD79A8','#E84393'],  // rosa
  ['#55EFC4','#00B894'],  // menta
]

const FACE_EXPRESSIONS = [
  // [ojos-dy, boca-path, cejas]
  { eyeOff: 0,   mouth: 'M -8 2 Q 0 8 8 2',   browsUp: false }, // feliz
  { eyeOff: -1,  mouth: 'M -8 4 Q 0 10 8 4',   browsUp: false }, // muy feliz
  { eyeOff: 0,   mouth: 'M -7 4 L 7 4',        browsUp: false }, // neutro
  { eyeOff: 0,   mouth: 'M -6 2 Q 0 -2 6 2',   browsUp: true  }, // sorprendido
  { eyeOff: 0,   mouth: 'M -8 5 Q 0 1 8 5',    browsUp: false }, // pícaro
  { eyeOff: 1,   mouth: 'M -7 3 Q 0 9 7 3',    browsUp: false }, // contento
  { eyeOff: -1,  mouth: 'M -6 3 L 0 6 L 6 3',  browsUp: false }, // guiño
  { eyeOff: 0,   mouth: 'M -8 2 Q 0 8 8 2',    browsUp: true  }, // emocionado
]

/** Hash numérico simple de un string */
function hashStr(str) {
  let h = 5381
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) ^ str.charCodeAt(i)
    h = h >>> 0
  }
  return h
}

/** Genera el SVG como string a partir de style + seed */
export function generateAvatarSVG(style = 'circle', seed = 'Player', size = 80) {
  const h = hashStr(seed + style)
  const palette = BG_PALETTES[h % BG_PALETTES.length]
  const faceIdx = ((h >>> 4) % FACE_EXPRESSIONS.length + FACE_EXPRESSIONS.length) % FACE_EXPRESSIONS.length
  const face = FACE_EXPRESSIONS[faceIdx]
  const eyeSize = 3 + (h % 2)
  const leftEyeX  = -9 + ((h >>> 8) % 3)
  const rightEyeX =  9 - ((h >>> 8) % 3)
  const eyeY = -4 + face.eyeOff
  const pupilOffset = (h >>> 12) % 2 === 0 ? 1 : -1

  // Clip path shape per style
  const clipId = `clip_${seed.replace(/\W/g,'')}_${style}`
  const shapes = {
    circle:   `<clipPath id="${clipId}"><circle cx="50" cy="50" r="46"/></clipPath>`,
    rounded:  `<clipPath id="${clipId}"><rect x="6" y="6" width="88" height="88" rx="28" ry="28"/></clipPath>`,
    diamond:  `<clipPath id="${clipId}"><polygon points="50,4 96,50 50,96 4,50"/></clipPath>`,
    hexagon:  `<clipPath id="${clipId}"><polygon points="50,4 93,27 93,73 50,96 7,73 7,27"/></clipPath>`,
    star:     `<clipPath id="${clipId}"><polygon points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35"/></clipPath>`,
    shield:   `<clipPath id="${clipId}"><path d="M50,4 L94,22 L94,56 Q94,82 50,96 Q6,82 6,56 L6,22 Z"/></clipPath>`,
    wave:     `<clipPath id="${clipId}"><path d="M10,20 Q30,4 50,10 Q70,16 90,4 L94,80 Q70,96 50,90 Q30,84 6,96 Z"/></clipPath>`,
    blob:     `<clipPath id="${clipId}"><path d="M60,5 Q88,10 92,38 Q96,66 72,84 Q48,102 24,88 Q0,74 4,46 Q8,18 36,8 Q48,4 60,5 Z"/></clipPath>`,
  }
  const clip = shapes[style] || shapes.circle

  // Gradient background
  const gradId = `grad_${clipId}`
  const grad = `<defs>
    ${clip}
    <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${palette[0]}"/>
      <stop offset="100%" stop-color="${palette[1]}"/>
    </linearGradient>
  </defs>`

  // Face elements (centered at 50,55)
  const cx = 50, cy = 55
  const brows = face.browsUp
    ? `<path d="M ${cx+leftEyeX-5} ${cy+eyeY-8} Q ${cx+leftEyeX} ${cy+eyeY-12} ${cx+leftEyeX+5} ${cy+eyeY-8}"
         stroke="rgba(0,0,0,0.5)" stroke-width="2" fill="none" stroke-linecap="round"/>
       <path d="M ${cx+rightEyeX-5} ${cy+eyeY-8} Q ${cx+rightEyeX} ${cy+eyeY-12} ${cx+rightEyeX+5} ${cy+eyeY-8}"
         stroke="rgba(0,0,0,0.5)" stroke-width="2" fill="none" stroke-linecap="round"/>`
    : `<path d="M ${cx+leftEyeX-5} ${cy+eyeY-7} L ${cx+leftEyeX+5} ${cy+eyeY-7}"
         stroke="rgba(0,0,0,0.4)" stroke-width="2" fill="none" stroke-linecap="round"/>
       <path d="M ${cx+rightEyeX-5} ${cy+eyeY-7} L ${cx+rightEyeX+5} ${cy+eyeY-7}"
         stroke="rgba(0,0,0,0.4)" stroke-width="2" fill="none" stroke-linecap="round"/>`

  const eyes = `
    <circle cx="${cx+leftEyeX}" cy="${cy+eyeY}" r="${eyeSize}" fill="rgba(0,0,0,0.75)"/>
    <circle cx="${cx+rightEyeX}" cy="${cy+eyeY}" r="${eyeSize}" fill="rgba(0,0,0,0.75)"/>
    <circle cx="${cx+leftEyeX+pupilOffset}" cy="${cy+eyeY-1}" r="1.2" fill="rgba(255,255,255,0.8)"/>
    <circle cx="${cx+rightEyeX+pupilOffset}" cy="${cy+eyeY-1}" r="1.2" fill="rgba(255,255,255,0.8)"/>`

  // Translate mouth path to absolute position
  const mouthPath = face.mouth.replace(/(-?\d+(\.\d+)?)/g, (_, n, __, offset, str) => {
    // Only shift x,y coords (naive but works for our simple paths)
    return n
  })
  const mouth = `<g transform="translate(${cx},${cy+10})">
    <path d="${face.mouth}" stroke="rgba(0,0,0,0.65)" stroke-width="2.5"
      fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  </g>`

  // Initials fallback circle behind face
  const initial = seed.charAt(0).toUpperCase()
  const initialsEl = `<text x="50" y="42" text-anchor="middle" dominant-baseline="middle"
    font-family="'Syne',sans-serif" font-weight="800" font-size="22"
    fill="rgba(255,255,255,0.25)">${initial}</text>`

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}">
  ${grad}
  <g clip-path="url(#${clipId})">
    <rect width="100" height="100" fill="url(#${gradId})"/>
    <circle cx="50" cy="75" r="32" fill="rgba(0,0,0,0.12)"/>
    ${initialsEl}
    ${brows}
    ${eyes}
    ${mouth}
  </g>
</svg>`
}

/**
 * Devuelve una data URL del SVG — úsala igual que antes como src de <img>.
 * avatarUrl(style, seed) → "data:image/svg+xml;base64,..."
 */
export function avatarUrl(style, seed) {
  const svg = generateAvatarSVG(style, seed)
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`
}

/**
 * Devuelve el SVG raw como string — útil para dangerouslySetInnerHTML
 */
export function avatarSVG(style, seed, size = 80) {
  return generateAvatarSVG(style, seed, size)
}