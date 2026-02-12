"use client"

import * as React from "react"
import { MessageSquare, X, Send, Loader2, Search, ArrowLeft, Paperclip, Video, FileIcon, Check, CheckCheck } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import type { Conversation, Message } from "@/lib/api/types"
import { useAuthContext } from "@/app/providers/auth-provider"
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns"

export function DMComponent() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [conversations, setConversations] = React.useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = React.useState<Conversation | null>(null)
  const [messages, setMessages] = React.useState<Message[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [isLoadingMessages, setIsLoadingMessages] = React.useState(false)
  const [isUploading, setIsUploading] = React.useState(false)
  const [newMessage, setNewPost] = React.useState("")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const { user: currentUser } = useAuthContext()
  const myId = currentUser?.id || (currentUser as any)?._id || ''
  
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const loadedConvIdRef = React.useRef<string | null>(null)
  const loadingConvRef = React.useRef<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Listen for external open-dm events
  React.useEffect(() => {
    const handleOpenDM = async (e: any) => {
      const { communityId, targetUserId } = e.detail || {}
      
      if (!communityId || !targetUserId) return

      setIsOpen(true)
      setError(null)
      
      if (targetUserId === myId) {
        setError("You can't message yourself")
        return
      }

      try {
        setIsLoadingMessages(true)
        const res = await api.dm.startPeerConversation(communityId, targetUserId)
        const conv = res?.conversation
        
        if (conv?.id) {
          loadedConvIdRef.current = null
          setSelectedConversation(conv)
          await loadMessages(conv.id)
        }
        fetchConversations().catch(() => {})
      } catch (err: any) {
        setError(err?.message || 'Failed to start conversation')
      } finally {
        setIsLoadingMessages(false)
      }
    }

    window.addEventListener('open-dm', handleOpenDM)
    return () => window.removeEventListener('open-dm', handleOpenDM)
  }, [myId])

  const fetchConversations = React.useCallback(async () => {
    try {
      setIsLoading(true)
      const res = await api.dm.listInbox()
      setConversations(res.conversations || [])
    } catch (err) {
      console.error("Error fetching conversations:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadMessages = React.useCallback(async (convId: string) => {
    if (loadingConvRef.current === convId) return
    loadingConvRef.current = convId
    
    try {
      setIsLoadingMessages(true)
      const res = await api.dm.listMessages(convId)
      setMessages(res.messages || [])
      loadedConvIdRef.current = convId
      if (res.conversation?.id) {
        setSelectedConversation(res.conversation)
      }
      scrollToBottom()
    } catch (err) {
      setError('Failed to load messages')
    } finally {
      setIsLoadingMessages(false)
      loadingConvRef.current = null
    }
  }, [])

  const scrollToBottom = React.useCallback(() => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
    }, 100)
  }, [])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!selectedConversation?.id) {
      setError('No conversation selected')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const res = await api.dm.uploadAttachment(selectedConversation.id, file)
      const serverMsg = res?.message
      
      if (serverMsg?.id) {
        setMessages((prev) => [...prev, serverMsg])
        scrollToBottom()
        fetchConversations().catch(() => {})
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to upload file')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  React.useEffect(() => {
    if (isOpen) fetchConversations()
  }, [isOpen, fetchConversations])

  React.useEffect(() => {
    if (selectedConversation?.id && selectedConversation.id !== loadedConvIdRef.current) {
      loadMessages(selectedConversation.id)
      api.dm.markRead(selectedConversation.id).catch(console.error)
    }
  }, [selectedConversation?.id, loadMessages])

  // Focus input when conversation is selected
  React.useEffect(() => {
    if (selectedConversation && !isLoadingMessages) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [selectedConversation, isLoadingMessages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!newMessage.trim() || !selectedConversation) return

    const text = newMessage.trim()
    setNewPost("")
    setError(null)

    const tempId = `temp-${Date.now()}`
    const optimisticMsg: Message = {
      id: tempId,
      conversationId: selectedConversation.id,
      senderId: myId,
      recipientId: getParticipantId(selectedConversation.participantA) === myId 
        ? getParticipantId(selectedConversation.participantB) 
        : getParticipantId(selectedConversation.participantA),
      text,
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimisticMsg])
    scrollToBottom()

    try {
      const res = await api.dm.sendMessage(selectedConversation.id, { text })
      const serverMsg = res?.message
      
      if (serverMsg?.id) {
        setMessages((prev) => {
          const withoutTemp = prev.filter(m => m.id !== tempId)
          if (withoutTemp.some(m => m.id === serverMsg.id)) return withoutTemp
          return [...withoutTemp, serverMsg]
        })
      }
      fetchConversations().catch(() => {})
      scrollToBottom()
    } catch (err: any) {
      setMessages((prev) => prev.filter(m => m.id !== tempId))
      setNewPost(text)
      setError(err?.message || 'Failed to send message')
    }
  }

  const getParticipantId = (p: any): string => {
    if (!p) return ''
    if (typeof p === 'string') return p
    return p.id || p._id || ''
  }

  const getOtherParticipant = (c: Conversation): any => {
    const aId = getParticipantId(c.participantA)
    return aId === myId ? c.participantB : c.participantA
  }

  const getMyUnreadCount = (c: Conversation): number => {
    const aId = getParticipantId(c.participantA)
    return aId === myId ? c.unreadCountA : c.unreadCountB
  }

  const filteredConversations = conversations.filter((c) => {
    const other: any = getOtherParticipant(c)
    const name = typeof other === 'object'
      ? (other?.name || `${other?.firstName || ''} ${other?.lastName || ''}`.trim() || other?.username || '')
      : ''
    if (!searchQuery.trim()) return true
    return name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const handleSelectConversation = (conv: Conversation) => {
    setError(null)
    setSelectedConversation(conv)
  }

  const handleBack = () => {
    setSelectedConversation(null)
    setMessages([])
    loadedConvIdRef.current = null
  }

  const formatMessageTime = (date: string) => {
    const d = new Date(date)
    if (isToday(d)) return format(d, 'h:mm a')
    if (isYesterday(d)) return 'Yesterday'
    return format(d, 'MMM d')
  }

  const formatConversationTime = (date: string) => {
    const d = new Date(date)
    if (isToday(d)) return format(d, 'h:mm a')
    if (isYesterday(d)) return 'Yesterday'
    return formatDistanceToNow(d, { addSuffix: false })
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full">
          <MessageSquare className="h-5 w-5" />
          {conversations.some(c => getMyUnreadCount(c) > 0) && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-gray-900 text-white text-[10px] font-medium rounded-full flex items-center justify-center">
              {conversations.filter(c => getMyUnreadCount(c) > 0).length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[360px] p-0 shadow-2xl border border-gray-200 rounded-2xl overflow-hidden bg-white"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {!selectedConversation ? (
          // Conversations List
          <div className="flex flex-col h-[480px]">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
                <span className="text-xs text-gray-400">
                  {conversations.length} {conversations.length === 1 ? 'conversation' : 'conversations'}
                </span>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Search conversations..." 
                  className="pl-10 h-10 text-sm bg-gray-50 border-0 rounded-xl focus-visible:ring-1 focus-visible:ring-gray-200"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            {/* Conversations */}
            <ScrollArea className="flex-1">
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                </div>
              ) : filteredConversations.length > 0 ? (
                <div className="py-1">
                  {filteredConversations.map((conv) => {
                    const other: any = getOtherParticipant(conv)
                    const isUnread = getMyUnreadCount(conv) > 0
                    const name = other?.name || `${other?.firstName || ''} ${other?.lastName || ''}`.trim() || "User"
                    
                    return (
                      <button
                        key={conv.id}
                        onClick={() => handleSelectConversation(conv)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left group"
                      >
                        <div className="relative">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={other?.avatar || other?.profile_picture || other?.photo_profil || other?.photo} />
                            <AvatarFallback className="bg-gray-100 text-gray-600 text-sm font-medium">
                              {name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {/* Online indicator - could be dynamic */}
                          <span className="absolute bottom-0 right-0 h-3 w-3 bg-gray-300 border-2 border-white rounded-full" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className={cn(
                              "text-sm truncate",
                              isUnread ? "font-semibold text-gray-900" : "font-medium text-gray-700"
                            )}>
                              {name}
                            </span>
                            <span className="text-xs text-gray-400">
                              {conv.lastMessageAt ? formatConversationTime(conv.lastMessageAt) : ''}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className={cn(
                              "text-xs truncate max-w-[200px]",
                              isUnread ? "text-gray-700" : "text-gray-400"
                            )}>
                              {conv.lastMessageText || "Start a conversation"}
                            </p>
                            {isUnread && (
                              <span className="h-2 w-2 bg-gray-900 rounded-full flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <MessageSquare className="h-7 w-7 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-700">No conversations</p>
                  <p className="text-xs text-gray-400 mt-1">Start by messaging a community member</p>
                </div>
              )}
            </ScrollArea>
          </div>
        ) : (
          // Chat View
          <div className="flex flex-col h-[480px]">
            {/* Chat Header */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleBack} 
                className="h-8 w-8 rounded-full hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={(getOtherParticipant(selectedConversation) as any)?.avatar || (getOtherParticipant(selectedConversation) as any)?.profile_picture || (getOtherParticipant(selectedConversation) as any)?.photo_profil || (getOtherParticipant(selectedConversation) as any)?.photo} />
                  <AvatarFallback className="bg-gray-100 text-gray-600 text-xs font-medium">
                    {((getOtherParticipant(selectedConversation) as any)?.name || "U").substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  {(() => {
                    const other: any = getOtherParticipant(selectedConversation);
                    const name = other?.name || 
                                 (other?.firstName && other?.lastName ? `${other.firstName} ${other.lastName}` : '') || 
                                 other?.username || 
                                 "User";
                    return (
                      <>
                        <h3 className="text-sm font-semibold text-gray-900 truncate">{name}</h3>
                        <span className="text-xs text-gray-400">Active now</span>
                      </>
                    );
                  })()}
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsOpen(false)} 
                className="h-8 w-8 rounded-full hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Messages */}
            <ScrollArea className="flex-1 px-4" ref={scrollRef}>
              {isLoadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-gray-500">{error}</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    <MessageSquare className="h-5 w-5 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500">No messages yet</p>
                  <p className="text-xs text-gray-400 mt-1">Send a message to start the conversation</p>
                </div>
              ) : (
                <div className="py-4 space-y-1">
                  {messages.map((msg, idx) => {
                    const rawSenderId = (msg as any).senderId
                    const msgSenderId = typeof rawSenderId === 'string' 
                      ? rawSenderId 
                      : (rawSenderId?._id || rawSenderId?.id || (typeof rawSenderId?.toString === 'function' ? rawSenderId.toString() : rawSenderId || ''))
                    const isMine = msgSenderId === myId || ((msg.sender as any)?._id === myId) || ((msg.sender as any)?.id === myId)
                    const showTimestamp = idx === 0 || 
                      (messages[idx - 1] && 
                       new Date(msg.createdAt).getTime() - new Date(messages[idx - 1].createdAt).getTime() > 5 * 60 * 1000)
                    
                    return (
                      <div key={msg.id}>
                        {showTimestamp && (
                          <div className="flex items-center justify-center my-4">
                            <span className="text-[10px] text-gray-400 bg-white px-3 py-1 rounded-full">
                              {formatMessageTime(msg.createdAt)}
                            </span>
                          </div>
                        )}
                        <div className={cn(
                          "flex max-w-[80%] mb-1",
                          isMine ? "ml-auto flex-row-reverse" : "mr-auto"
                        )}>
                          <div className={cn(
                            "px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                            isMine 
                              ? "bg-gray-900 text-white rounded-br-sm" 
                              : "bg-gray-100 text-gray-900 rounded-bl-sm"
                          )}>
                            {msg.text && <div>{msg.text}</div>}
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className={cn("space-y-2", msg.text && "mt-2 pt-2 border-t border-white/10")}>
                                {msg.attachments.map((att, idx) => (
                                  <div key={idx}>
                                    {att.type === 'image' ? (
                                      <div className="relative group max-w-full sm:max-w-[260px]">
                                        <div className="relative aspect-square sm:aspect-auto sm:h-auto overflow-hidden rounded-lg bg-gray-200 shadow-sm border border-black/5">
                                          <img 
                                            src={att.url} 
                                            alt="attachment" 
                                            className="w-full h-full object-cover sm:max-h-[300px] cursor-zoom-in hover:scale-[1.02] transition-transform duration-200" 
                                            onClick={() => window.open(att.url, '_blank')}
                                            onError={(e) => {
                                              (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=Image+Not+Found';
                                            }}
                                          />
                                        </div>
                                      </div>
                                    ) : att.type === 'video' ? (
                                      <a href={att.url} target="_blank" rel="noopener noreferrer" className={cn(
                                        "flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors",
                                        isMine 
                                          ? "bg-white/10 border-white/20 text-white hover:bg-white/20" 
                                          : "bg-white border-gray-200 text-gray-900 hover:bg-gray-50"
                                      )}>
                                        <div className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                                          <Video className="h-4 w-4 text-red-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-medium truncate">Video Attachment</p>
                                          <p className="text-[10px] opacity-60">Click to view</p>
                                        </div>
                                      </a>
                                    ) : (
                                      <a href={att.url} target="_blank" rel="noopener noreferrer" className={cn(
                                        "flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors",
                                        isMine 
                                          ? "bg-white/10 border-white/20 text-white hover:bg-white/20" 
                                          : "bg-white border-gray-200 text-gray-900 hover:bg-gray-50"
                                      )}>
                                        <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                          <FileIcon className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-medium truncate">File Attachment</p>
                                          <p className="text-[10px] opacity-60">Click to download</p>
                                        </div>
                                      </a>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        {isMine && (
                          <div className="flex justify-end pr-1">
                            <CheckCheck className="h-3.5 w-3.5 text-gray-400" />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </ScrollArea>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="px-4 py-3 border-t border-gray-100">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileUpload}
              />
              <div className="flex items-center gap-2 bg-gray-50 rounded-full px-4 py-1">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-full text-gray-400 hover:text-gray-600 hover:bg-transparent"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                </Button>
                <Input 
                  ref={inputRef}
                  value={newMessage}
                  onChange={(e) => setNewPost(e.target.value)}
                  placeholder={isUploading ? "Uploading file..." : "Type a message..."}
                  className="flex-1 h-9 text-sm bg-transparent border-0 focus-visible:ring-0 px-0"
                  disabled={isUploading}
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  className={cn(
                    "h-8 w-8 rounded-full transition-all",
                    newMessage.trim() 
                      ? "bg-gray-900 hover:bg-gray-800 text-white" 
                      : "bg-transparent text-gray-300 hover:bg-transparent"
                  )}
                  disabled={!newMessage.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
