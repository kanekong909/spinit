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
  createRoom: (data) => req('POST', '/rooms/', data),
  listRooms: () => req('GET', '/rooms/'),
  getRoom: (ref) => req('GET', `/rooms/${ref}`),
  updateRoom: (id, data) => req('PATCH', `/rooms/${id}`, data),
  changeStatus: (id, data) => req('POST', `/rooms/${id}/status`, data),
  deleteRoom: (id, data) => req('DELETE', `/rooms/${id}`, data),

  // Players
  joinRoom: (roomId, data) => req('POST', `/rooms/${roomId}/players/`, data),
  listPlayers: (roomId) => req('GET', `/rooms/${roomId}/players/`),
  leaveRoom: (roomId, playerId) => req('DELETE', `/rooms/${roomId}/players/${playerId}`),

  // Spins
  submitSpin: (roomId, playerId, data) => req('POST', `/rooms/${roomId}/spins/${playerId}`, data),
  getResult: (roomId) => req('GET', `/rooms/${roomId}/spins/result`),
}

export const WS_BASE = import.meta.env.VITE_WS_URL || `ws://${window.location.host}`

export function createWS(roomId, playerId, onMessage) {
  const ws = new WebSocket(`${WS_BASE}/ws/${roomId}/${playerId}`)
  ws.onmessage = (e) => onMessage(JSON.parse(e.data))
  ws.onerror = (e) => console.error('WS error', e)

  // Keepalive ping every 25s
  const ping = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'ping' }))
    }
  }, 25000)

  ws.onclose = () => clearInterval(ping)
  return ws
}
