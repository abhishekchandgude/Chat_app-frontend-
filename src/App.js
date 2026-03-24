import React, { useEffect, useMemo, useState } from 'react';
import SendLinkForm from './SendLinkForm';
import ChatRoom from './ChatRoom';

function generateRoomId() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';

  for (let index = 0; index < 6; index += 1) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }

  return result;
}

export default function App() {
  const initialRoomFromUrl = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('room');
  }, []);

  const [roomId, setRoomId] = useState(initialRoomFromUrl || '');
  const [showInviteForm, setShowInviteForm] = useState(!initialRoomFromUrl);

  useEffect(() => {
    if (initialRoomFromUrl) {
      return;
    }

    const generatedRoomId = generateRoomId();
    const nextUrl = `${window.location.pathname}?room=${generatedRoomId}`;

    window.history.replaceState({}, '', nextUrl);
    setRoomId(generatedRoomId);
  }, [initialRoomFromUrl]);

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const nextRoom = params.get('room') || '';
      setRoomId(nextRoom);
      setShowInviteForm(!params.get('room'));
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  if (!roomId) {
    return null;
  }

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <header style={styles.header}>
          <div>
            <p style={styles.eyebrow}>Realtime SMS Chat</p>
            <h1 style={styles.title}>Room {roomId}</h1>
          </div>
          <span style={styles.badge}>Live</span>
        </header>

        {showInviteForm && (
          <div style={styles.invitePanel}>
            <SendLinkForm roomId={roomId} />
          </div>
        )}

        <ChatRoom roomId={roomId} />
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    padding: '24px',
    background:
      'radial-gradient(circle at top, rgba(59, 130, 246, 0.18), transparent 30%), linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  shell: {
    width: '100%',
    maxWidth: '920px',
    height: 'min(90vh, 820px)',
    background: 'rgba(255, 255, 255, 0.94)',
    border: '1px solid #dbe3ef',
    borderRadius: '24px',
    boxShadow: '0 24px 60px rgba(15, 23, 42, 0.12)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    padding: '24px 24px 18px',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
    alignItems: 'center',
  },
  eyebrow: {
    margin: '0 0 6px',
    fontSize: '12px',
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    fontWeight: 700,
    color: '#64748b',
  },
  title: {
    margin: 0,
    fontSize: 'clamp(28px, 4vw, 40px)',
    color: '#0f172a',
  },
  badge: {
    borderRadius: '999px',
    padding: '8px 14px',
    background: '#dcfce7',
    color: '#166534',
    fontWeight: 700,
    fontSize: '14px',
  },
  invitePanel: {
    padding: '20px 24px 0',
  },
};
