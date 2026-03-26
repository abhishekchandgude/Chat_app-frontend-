import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import './App.css'

type ChatMessage = {
  id: string
  room: string
  message: string
  sender: string
  time: string
}

type SendLinkResponse = {
  success?: boolean
  sid?: string
  roomId?: string
  link?: string
  error?: string
}

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL ?? 'https://chat-app-backend-smoky-five.vercel.app').replace(
    /\/$/,
    '',
  )

const socket = io(API_BASE_URL, {
  autoConnect: false,
})

function getOrCreateSenderName() {
  const storedName = window.localStorage.getItem('chat_sender_name')?.trim()
  if (storedName) {
    return storedName
  }

  const generatedName = `User-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
  window.localStorage.setItem('chat_sender_name', generatedName)
  return generatedName
}

function App() {
  const initialRoomId = useMemo(
    () => new URLSearchParams(window.location.search).get('room')?.trim() || '',
    [],
  )

  const [roomId, setRoomId] = useState(initialRoomId)
  const [friendPhone, setFriendPhone] = useState('')
  const [inviteMessage, setInviteMessage] = useState('Your chat room is ready.')
  const [messageText, setMessageText] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isSendingLink, setIsSendingLink] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [senderName] = useState(() => getOrCreateSenderName())
  const [isComposerMenuOpen, setIsComposerMenuOpen] = useState(false)
  const currentRoomIdRef = useRef(roomId)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const connectedOnceRef = useRef(false)
  const composerMenuRef = useRef<HTMLDivElement | null>(null)

  const quickEmoji = ['😀', '😂', '❤️', '🔥', '👏', '😎', '🎉', '👍']
  const quickActions = [
    { label: 'Photo', value: '📷' },
    { label: 'Location', value: '📍' },
    { label: 'Voice note', value: '🎙️' },
    { label: 'Sticker', value: '✨' },
  ]

  useEffect(() => {
    currentRoomIdRef.current = roomId
  }, [roomId])

  useEffect(() => {
    const joinCurrentRoom = () => {
      const activeRoomId = currentRoomIdRef.current
      if (!activeRoomId) {
        return
      }

      socket.emit('join_room', activeRoomId)
    }

    const handleConnect = () => {
      setIsConnected(true)
      joinCurrentRoom()
    }

    const handleDisconnect = () => {
      setIsConnected(false)
    }

    const handleReceiveMessage = (incomingMessage: ChatMessage) => {
      setMessages((currentMessages) => {
        if (incomingMessage.id && currentMessages.some((item) => item.id === incomingMessage.id)) {
          return currentMessages
        }

        return [...currentMessages, incomingMessage]
      })
    }

    if (!connectedOnceRef.current) {
      socket.connect()
      connectedOnceRef.current = true
    }

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('receive_message', handleReceiveMessage)

    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('receive_message', handleReceiveMessage)
    }
  }, [])

  useEffect(() => {
    if (!roomId || !socket.connected) {
      return
    }

    socket.emit('join_room', roomId)
  }, [roomId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!composerMenuRef.current?.contains(event.target as Node)) {
        setIsComposerMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    return () => {
      socket.disconnect()
      connectedOnceRef.current = false
    }
  }, [])

  const handleCreateRoom = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedPhone = friendPhone.trim()
    const trimmedMessage = inviteMessage.trim()

    if (!trimmedPhone) {
      setErrorMessage("Please enter your friend's mobile number.")
      setSuccessMessage('')
      return
    }

    if (!trimmedMessage) {
      setErrorMessage('Please enter an invite message.')
      setSuccessMessage('')
      return
    }

    setIsSendingLink(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const response = await fetch(`${API_BASE_URL}/send-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: trimmedPhone,
          message: trimmedMessage,
        }),
      })

      const data = (await response.json().catch(() => ({}))) as SendLinkResponse

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send the invite link.')
      }

      if (!data.roomId) {
        throw new Error('Backend did not return a roomId.')
      }

      const nextRoomId = data.roomId.trim()
      const nextUrl = data.link?.trim() || `${window.location.origin}/?room=${nextRoomId}`

      setRoomId(nextRoomId)
      window.history.replaceState({}, '', nextUrl)
      setSuccessMessage('Invite link sent. Chat room is ready.')
    } catch (error) {
      const nextErrorMessage =
        error instanceof Error ? error.message : 'Failed to send the invite link.'
      setErrorMessage(nextErrorMessage)
    } finally {
      setIsSendingLink(false)
    }
  }

  const handleSendMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedMessage = messageText.trim()
    if (!trimmedMessage || !roomId) {
      return
    }

    const outgoingMessage: ChatMessage = {
      id: `${socket.id ?? 'local'}-${Date.now()}`,
      room: roomId,
      message: trimmedMessage,
      sender: senderName,
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }

    socket.emit('send_message', outgoingMessage)
    setMessages((currentMessages) => [...currentMessages, outgoingMessage])
    setMessageText('')
  }

  const appendToComposer = (value: string) => {
    setMessageText((currentText) => `${currentText}${currentText ? ' ' : ''}${value}`.trimStart())
    setIsComposerMenuOpen(false)
  }

  return (
    <main className="chat-page">
      <section className="chat-shell">
        <header className="chat-header">
          <div className="header-copy">
            <p className="chat-kicker">Realtime SMS Chat</p>
            <h1>{roomId ? 'Private Chat' : 'Create a chat room'}</h1>
            <div className="header-meta">
              <p className="identity-pill">You are {senderName}</p>
              {roomId ? <p className="room-pill">Live room</p> : null}
            </div>
          </div>
          <span className={`status-badge ${isConnected ? 'active' : 'idle'}`}>
            {isConnected ? 'Connected' : 'Connecting'}
          </span>
        </header>

        {!roomId ? (
          <section className="panel-card centered-card">
            <h2>Send a chat invite</h2>
            <p className="panel-copy">
              Enter your friend&apos;s mobile number and message. We&apos;ll create a room and send
              the SMS link from the backend.
            </p>
            <form className="stack-form" onSubmit={handleCreateRoom}>
              <input
                type="tel"
                className="chat-input"
                placeholder="Friend's mobile number"
                value={friendPhone}
                onChange={(event) => setFriendPhone(event.target.value)}
              />
              <input
                type="text"
                className="chat-input"
                placeholder="Invite message"
                value={inviteMessage}
                onChange={(event) => setInviteMessage(event.target.value)}
              />
              {errorMessage ? <p className="status-message error">{errorMessage}</p> : null}
              {successMessage ? <p className="status-message success">{successMessage}</p> : null}
              <button
                type="submit"
                className="send-button full-width"
                disabled={isSendingLink || !friendPhone.trim() || !inviteMessage.trim()}
              >
                {isSendingLink ? 'Sending link...' : 'Create room and send link'}
              </button>
            </form>
          </section>
        ) : (
          <>
            <div className="chat-history" aria-live="polite">
              {messages.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-orb" />
                  <h2>No messages yet</h2>
                  <p>Send a message to start the conversation.</p>
                </div>
              ) : (
                messages.map((chatMessage) => {
                  const isSelf = Boolean(socket.id && chatMessage.id.startsWith(`${socket.id}-`))

                  return (
                    <article
                      className={`message-row ${isSelf ? 'self' : 'other'}`}
                      key={chatMessage.id}
                    >
                      <div className={`message-bubble ${isSelf ? 'self' : 'other'}`}>
                        <div className="message-topline">
                          <span className="message-author">{chatMessage.sender}</span>
                          <time>{chatMessage.time}</time>
                        </div>
                        <p className="message-text">{chatMessage.message}</p>
                      </div>
                    </article>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form className="chat-composer" onSubmit={handleSendMessage}>
              <div className="composer-main">
                <div className="composer-menu-wrap" ref={composerMenuRef}>
                  <button
                    type="button"
                    className={`plus-button ${isComposerMenuOpen ? 'open' : ''}`}
                    onClick={() => setIsComposerMenuOpen((currentValue) => !currentValue)}
                    disabled={!isConnected}
                    aria-label="Open attachment and emoji menu"
                  >
                    +
                  </button>

                  {isComposerMenuOpen ? (
                    <div className="composer-menu">
                      <div className="composer-section">
                        <p className="composer-label">Quick reactions</p>
                        <div className="emoji-grid">
                          {quickEmoji.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              className="emoji-chip"
                              onClick={() => appendToComposer(emoji)}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="composer-section">
                        <p className="composer-label">Quick actions</p>
                        <div className="action-grid">
                          {quickActions.map((action) => (
                            <button
                              key={action.label}
                              type="button"
                              className="action-chip"
                              onClick={() => appendToComposer(action.value)}
                            >
                              <span>{action.value}</span>
                              {action.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

                <input
                  type="text"
                  className="chat-input"
                  placeholder={isConnected ? 'Type your message...' : 'Waiting for connection...'}
                  value={messageText}
                  onChange={(event) => setMessageText(event.target.value)}
                  disabled={!isConnected}
                />
              </div>
              <button
                type="submit"
                className="send-button"
                disabled={!isConnected || !messageText.trim()}
              >
                Send
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  )
}

export default App
