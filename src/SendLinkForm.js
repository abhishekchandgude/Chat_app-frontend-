import React, { useState } from 'react';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'https://chat-app-backend-smoky-five.vercel.app').replace(/\/$/, '');

export default function SendLinkForm({ roomId }) {
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState({ type: '', text: '' });
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedPhone = phone.trim();

    if (!trimmedPhone) {
      setStatus({ type: 'error', text: 'Please enter a phone number.' });
      return;
    }

    setIsSending(true);
    setStatus({ type: '', text: '' });

    try {
      const response = await fetch(`${API_BASE_URL}/send-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: trimmedPhone,
          roomId,
          message: 'Hey! Join my chat here:',
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Unable to send the invite link.');
      }

      setStatus({
        type: 'success',
        text: data.message || 'Invite link sent successfully.',
      });
      setPhone('');
    } catch (error) {
      setStatus({
        type: 'error',
        text: error.message || 'Something went wrong while sending the link.',
      });
    } finally {
      setIsSending(false);
    }
  };

  const shareLink = `${window.location.origin}?room=${roomId}`;

  return (
    <section style={styles.card}>
      <div style={styles.copy}>
        <h2 style={styles.heading}>Invite a friend by SMS</h2>
        <p style={styles.description}>
          Enter a phone number and we&apos;ll text the room link so both of you can join the same
          chat instantly.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="+1 555 123 4567"
          style={styles.input}
          disabled={isSending}
        />
        <button type="submit" style={styles.button} disabled={isSending}>
          {isSending ? 'Sending...' : 'Send link'}
        </button>
      </form>

      <p style={styles.linkText}>
        Room link: <span style={styles.linkValue}>{shareLink}</span>
      </p>

      {status.text && (
        <p
          style={{
            ...styles.status,
            ...(status.type === 'success' ? styles.success : styles.error),
          }}
        >
          {status.text}
        </p>
      )}
    </section>
  );
}

const styles = {
  card: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '20px',
    padding: '18px',
    marginBottom: '18px',
  },
  copy: {
    marginBottom: '14px',
  },
  heading: {
    margin: '0 0 6px',
    fontSize: '20px',
    color: '#0f172a',
  },
  description: {
    margin: 0,
    color: '#475569',
    lineHeight: 1.5,
  },
  form: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  input: {
    flex: '1 1 260px',
    minHeight: '48px',
    borderRadius: '14px',
    border: '1px solid #cbd5e1',
    padding: '0 14px',
    fontSize: '16px',
    outline: 'none',
  },
  button: {
    minHeight: '48px',
    border: 'none',
    borderRadius: '14px',
    padding: '0 18px',
    background: '#0f172a',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  linkText: {
    margin: '14px 0 0',
    color: '#475569',
    fontSize: '14px',
    wordBreak: 'break-all',
  },
  linkValue: {
    color: '#1d4ed8',
    fontWeight: 600,
  },
  status: {
    margin: '14px 0 0',
    padding: '12px 14px',
    borderRadius: '14px',
    fontSize: '14px',
    fontWeight: 600,
  },
  success: {
    background: '#dcfce7',
    color: '#166534',
  },
  error: {
    background: '#fee2e2',
    color: '#b91c1c',
  },
};
