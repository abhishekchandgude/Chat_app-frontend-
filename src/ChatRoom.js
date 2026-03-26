import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_URL } from './config';

export default function ChatRoom({ roomId }) {
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [socketId, setSocketId] = useState('');
  const socketRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!SOCKET_URL) {
      return undefined;
    }

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected:', socket.id);
      setSocketId(socket.id);
      socket.emit('join_room', roomId);
    });

    socket.on('receive_message', (incomingMessage) => {
      setMessages((previousMessages) => {
        const alreadyExists = previousMessages.some(
          (message) => message.localId && message.localId === incomingMessage.localId
        );

        if (alreadyExists) {
          return previousMessages;
        }

        return [...previousMessages, incomingMessage];
      });
    });

    socket.on('user_joined', (payload) => {
      console.log('User joined:', payload);
    });

    return () => {
      socket.disconnect();
    };
  }, [roomId]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = () => {
    const trimmedMessage = currentMessage.trim();
    const activeSocket = socketRef.current;

    if (!trimmedMessage || !activeSocket) {
      return;
    }

    const outgoingMessage = {
      room: roomId,
      author: activeSocket.id ? `User ${activeSocket.id.slice(0, 5)}` : 'Me',
      message: trimmedMessage,
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      senderId: activeSocket.id,
      localId: `${activeSocket.id || 'guest'}-${Date.now()}`,
    };

    activeSocket.emit('send_message', outgoingMessage);
    setMessages((previousMessages) => [...previousMessages, outgoingMessage]);
    setCurrentMessage('');
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage();
  };

  return (
    <section style={styles.room}>
      <div style={styles.messages}>
        {messages.length === 0 ? (
          <div style={styles.emptyState}>
            <h2 style={styles.emptyTitle}>Waiting for messages</h2>
            <p style={styles.emptyText}>Send a message to start chatting in room {roomId}.</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isMine = message.senderId === socketId;

            return (
              <div
                key={message.localId || `${message.time}-${index}`}
                style={{
                  ...styles.messageRow,
                  justifyContent: isMine ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    ...styles.bubble,
                    ...(isMine ? styles.myBubble : styles.otherBubble),
                  }}
                >
                  <div style={styles.author}>{isMine ? 'Me' : message.author || 'Friend'}</div>
                  <div style={styles.messageText}>{message.message}</div>
                  <div style={styles.time}>{message.time}</div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} style={styles.composer}>
        <input
          type="text"
          value={currentMessage}
          onChange={(event) => setCurrentMessage(event.target.value)}
          placeholder="Type your message..."
          style={styles.input}
        />
        <button type="submit" style={styles.button} disabled={!currentMessage.trim()}>
          Send
        </button>
      </form>
    </section>
  );
}

const styles = {
  room: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    flex: 1,
    padding: '0 24px 24px',
  },
  messages: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    padding: '8px 0 18px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  emptyState: {
    margin: 'auto',
    textAlign: 'center',
    color: '#64748b',
  },
  emptyTitle: {
    margin: '0 0 8px',
    color: '#0f172a',
    fontSize: '22px',
  },
  emptyText: {
    margin: 0,
    lineHeight: 1.5,
  },
  messageRow: {
    display: 'flex',
  },
  bubble: {
    maxWidth: '78%',
    padding: '14px 16px',
    borderRadius: '18px',
    boxShadow: '0 12px 24px rgba(15, 23, 42, 0.08)',
  },
  myBubble: {
    background: '#2563eb',
    color: '#eff6ff',
    borderBottomRightRadius: '6px',
  },
  otherBubble: {
    background: '#ffffff',
    color: '#0f172a',
    border: '1px solid #dbe4f0',
    borderBottomLeftRadius: '6px',
  },
  author: {
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    opacity: 0.8,
    marginBottom: '6px',
  },
  messageText: {
    lineHeight: 1.5,
    wordBreak: 'break-word',
  },
  time: {
    fontSize: '12px',
    marginTop: '8px',
    opacity: 0.75,
    textAlign: 'right',
  },
  composer: {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: '12px',
    paddingTop: '18px',
    borderTop: '1px solid #e2e8f0',
  },
  input: {
    minHeight: '52px',
    borderRadius: '16px',
    border: '1px solid #cbd5e1',
    padding: '0 16px',
    fontSize: '16px',
    outline: 'none',
  },
  button: {
    minHeight: '52px',
    border: 'none',
    borderRadius: '16px',
    padding: '0 20px',
    background: '#0f172a',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer',
  },
};
