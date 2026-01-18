// client/src/lib/socket.ts
import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export const initSocket = (userId?: string) => {
  if (!socket) {
    socket = io(process.env.NODE_ENV === 'production' ? window.location.origin : 'http://localhost:10000', {
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    socket.on('connect', () => {
      console.log('🔌 Connected to server')
      if (userId) {
        socket?.emit('subscribe-user', userId)
      }
    })

    socket.on('disconnect', () => {
      console.log('🔌 Disconnected from server')
    })

    socket.on('connect_error', (error) => {
      console.error('Connection Error:', error)
    })
  }

  return socket
}

export const getSocket = () => socket

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}