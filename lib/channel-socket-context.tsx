"use client"

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuthContext } from '@/app/providers/auth-provider'
import { resolveSocketBaseUrl } from '@/lib/socket-url'

interface TypingUser {
  userId: string
  username: string
  avatar?: string
  channelId: string
}

interface ChannelSocketContextType {
  socket: Socket | null
  isConnected: boolean
  onlineUsers: Set<string>
  typingUsers: Map<string, TypingUser[]>
  joinChannel: (channelId: string) => void
  leaveChannel: (channelId: string) => void
  joinCommunity: (communityId: string) => void
  sendTypingStart: (channelId: string) => void
  sendTypingStop: (channelId: string) => void
}

const ChannelSocketContext = createContext<ChannelSocketContextType>({
  socket: null,
  isConnected: false,
  onlineUsers: new Set(),
  typingUsers: new Map(),
  joinChannel: () => {},
  leaveChannel: () => {},
  joinCommunity: () => {},
  sendTypingStart: () => {},
  sendTypingStop: () => {},
})

export const useChannelSocket = () => useContext(ChannelSocketContext)

export function ChannelSocketProvider({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuthContext()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const [typingUsers, setTypingUsers] = useState<Map<string, TypingUser[]>>(new Map())
  const socketRef = useRef<Socket | null>(null)
  const typingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  useEffect(() => {
    if (!user || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
        setSocket(null)
        setIsConnected(false)
        setOnlineUsers(new Set())
        setTypingUsers(new Map())
      }
      return
    }

    const socketUrl = resolveSocketBaseUrl(process.env.NEXT_PUBLIC_API_URL)
    const newSocket = io(`${socketUrl}/channel`, {
      auth: { token: `Bearer ${token}` },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    socketRef.current = newSocket

    newSocket.on('connect', () => {
      setIsConnected(true)
      newSocket.emit('channel:get-online-users', {}, (users: string[]) => {
        if (Array.isArray(users)) setOnlineUsers(new Set(users))
      })
    })

    newSocket.on('disconnect', () => setIsConnected(false))
    newSocket.on('connect_error', () => setIsConnected(false))

    newSocket.on('user:status', ({ userId, status }: { userId: string; status: string }) => {
      setOnlineUsers(prev => {
        const next = new Set(prev)
        status === 'online' ? next.add(userId) : next.delete(userId)
        return next
      })
    })

    newSocket.on('channel:typing:start', (typingUser: TypingUser) => {
      const key = `${typingUser.channelId}:${typingUser.userId}`
      const existingTimer = typingTimers.current.get(key)
      if (existingTimer) clearTimeout(existingTimer)

      setTypingUsers(prev => {
        const next = new Map(prev)
        const current = next.get(typingUser.channelId) ?? []
        const filtered = current.filter(u => u.userId !== typingUser.userId)
        next.set(typingUser.channelId, [...filtered, typingUser])
        return next
      })

      const timer = setTimeout(() => {
        setTypingUsers(prev => {
          const next = new Map(prev)
          const current = next.get(typingUser.channelId) ?? []
          next.set(typingUser.channelId, current.filter(u => u.userId !== typingUser.userId))
          return next
        })
        typingTimers.current.delete(key)
      }, 5000)
      typingTimers.current.set(key, timer)
    })

    newSocket.on('channel:typing:stop', ({ userId, channelId }: { userId: string; channelId: string }) => {
      const key = `${channelId}:${userId}`
      const timer = typingTimers.current.get(key)
      if (timer) clearTimeout(timer)
      typingTimers.current.delete(key)
      setTypingUsers(prev => {
        const next = new Map(prev)
        const current = next.get(channelId) ?? []
        next.set(channelId, current.filter(u => u.userId !== userId))
        return next
      })
    })

    setSocket(newSocket)
    return () => {
      newSocket.disconnect()
      socketRef.current = null
    }
  }, [user?.id, token])

  const joinChannel = useCallback((channelId: string) => {
    socketRef.current?.emit('channel:join', { channelId })
  }, [])

  const leaveChannel = useCallback((channelId: string) => {
    socketRef.current?.emit('channel:leave', { channelId })
  }, [])

  const joinCommunity = useCallback((communityId: string) => {
    socketRef.current?.emit('channel:join-community', { communityId })
  }, [])

  const lastTypingEmit = useRef<Map<string, number>>(new Map())
  const sendTypingStart = useCallback((channelId: string) => {
    const now = Date.now()
    const last = lastTypingEmit.current.get(channelId) ?? 0
    if (now - last < 3000) return
    lastTypingEmit.current.set(channelId, now)
    socketRef.current?.emit('channel:typing:start', { channelId })
  }, [])

  const sendTypingStop = useCallback((channelId: string) => {
    lastTypingEmit.current.delete(channelId)
    socketRef.current?.emit('channel:typing:stop', { channelId })
  }, [])

  return (
    <ChannelSocketContext.Provider value={{
      socket, isConnected, onlineUsers, typingUsers,
      joinChannel, leaveChannel, joinCommunity,
      sendTypingStart, sendTypingStop,
    }}>
      {children}
    </ChannelSocketContext.Provider>
  )
}
