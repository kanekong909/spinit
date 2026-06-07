const BASE = import.meta.env.VITE_API_URL || ''

async function req(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Error del servidor')
  }
  if (res.status === 204) return null
  return res.json()
}

export const api = {
  // Rooms
  createRoom:   (data)           => req('POST',   '/rooms/', data),
  listRooms:    ()               => req('GET',    '/rooms/'),
  getRoom:      (ref)            => req('GET',    `/rooms/${ref}`),
  updateRoom:   (id, data)       => req('PATCH',  `/rooms/${id}`, data),
  changeStatus: (id, data)       => req('POST',   `/rooms/${id}/status`, data),
  deleteRoom:   (id, data)       => req('DELETE', `/rooms/${id}`, data),

  // Players
  joinRoom:   (roomId, data)           => req('POST',   `/rooms/${roomId}/players/`, data),
  listPlayers:(roomId)                  => req('GET',    `/rooms/${roomId}/players/`),
  leaveRoom:  (roomId, playerId)        => req('DELETE', `/rooms/${roomId}/players/${playerId}`),

  // Spins
  submitSpin: (roomId, playerId, data) => req('POST', `/rooms/${roomId}/spins/${playerId}`, data),
  getResult:  (roomId)                 => req('GET',  `/rooms/${roomId}/spins/result`),
}

/**
 * Derive WebSocket base URL from the API URL.
 * - If VITE_API_URL is set (e.g. https://backend.up.railway.app)
 *   → convert https → wss, http → ws automatically.
 * - If not set (local dev), derive from current page location.
 */
function getWsBase() {
  const apiUrl = import.meta.env.VITE_API_URL
  if (apiUrl) {
    return apiUrl.replace(/^https:\/\//, 'wss://').replace(/^http:\/\//, 'ws://')
  }
  // Local dev fallback
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
  return `${proto}://${window.location.host}`
}

export function createWS(roomId, playerId, onMessage) {
  const wsBase = getWsBase()
  const url    = `${wsBase}/ws/${roomId}/${playerId}`
  console.log('[WS] connecting to', url)

  const ws = new WebSocket(url)
  ws.onmessage = (e) => onMessage(JSON.parse(e.data))
  ws.onerror   = (e) => console.error('[WS] error', e)

  // Keepalive ping every 25s
  const ping = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'ping' }))
    }
  }, 25000)

  ws.onclose = () => clearInterval(ping)
  return ws
}