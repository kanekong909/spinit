import { useState, useEffect, useRef, useCallback } from 'react'
import { api, createWS } from '../lib/api'

export function useRoom(roomId, playerId) {
  const [room, setRoom] = useState(null)
  const [players, setPlayers] = useState([])
  const [spunIds, setSpunIds] = useState(new Set())
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [connected, setConnected] = useState(false)
  const wsRef = useRef(null)

  const handleEvent = useCallback((msg) => {
    switch (msg.event) {
      case 'init':
        setRoom(msg.room)
        setPlayers(msg.players)
        setSpunIds(new Set(msg.players.filter(p => p.has_spun).map(p => p.id)))
        break

      case 'player_joined':
        setPlayers(prev => {
          if (prev.find(p => p.id === msg.player.id)) return prev
          return [...prev, { ...msg.player, has_spun: false }]
        })
        break

      case 'player_left':
        setPlayers(prev => prev.map(p =>
          p.id === msg.player_id ? { ...p, is_online: false } : p
        ))
        break

      case 'player_spun':
        setSpunIds(prev => new Set([...prev, msg.player_id]))
        break

      case 'round_result':
        setResult(msg.result)
        setRoom(prev => prev ? { ...prev, status: 'revealing' } : prev)
        break

      case 'status_changed':
        setRoom(prev => prev ? { ...prev, status: msg.status } : prev)
        if (msg.status === 'spinning') {
          setSpunIds(new Set())
          setResult(null)
        }
        break

      case 'room_updated':
        setRoom(prev => prev ? { ...prev, ...msg.room } : prev)
        break

      case 'pong':
        break

      default:
        break
    }
  }, [])

  useEffect(() => {
    if (!roomId || !playerId) return

    const ws = createWS(roomId, playerId, (msg) => {
      setConnected(true)
      handleEvent(msg)
    })

    ws.onopen = () => setConnected(true)
    ws.onclose = () => setConnected(false)
    ws.onerror = () => setError('Error de conexión WebSocket')

    wsRef.current = ws
    return () => ws.close()
  }, [roomId, playerId, handleEvent])

  const submitSpin = useCallback(async (spinResult) => {
    try {
      await api.submitSpin(roomId, playerId, { result: spinResult })
    } catch (e) {
      setError(e.message)
    }
  }, [roomId, playerId])

  return { room, players, spunIds, result, error, connected, submitSpin }
}
