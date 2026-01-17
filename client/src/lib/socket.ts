import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export const initSocket = (userId?: string) => {
  if (!socket) {
    socket = io('http://localhost:5000', {
      autoConnect: true,
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
  }

  return socket
}

export const subscribeAdmin = () => {
  if (socket) {
    socket.emit('subscribe-admin')
  }
}

export const getSocket = () => socket

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
