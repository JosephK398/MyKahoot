/**
 * QuizBlast — pages/player/JoinGame.jsx
 * Two-step form: enter game PIN → enter display name → join.
 */

import { useState, useEffect, useRef } from 'react';
import { useGame } from '../../context/GameContext';

export default function JoinGame() {
  const { socket, setView } = useGame();

  const [step,    setStep]    = useState('pin');   // 'pin' | 'name'
  const [pin,     setPin]     = useState('');
  const [name,    setName]    = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const pinRef  = useRef(null);
  const nameRef = useRef(null);

  // Auto-focus inputs
  useEffect(() => { pinRef.current?.focus(); }, []);
  useEffect(() => { if (step === 'name') nameRef.current?.focus(); }, [step]);

  // Listen for join errors from server
  useEffect(() => {
    const onError = ({ message }) => {
      setError(message);
      setLoading(false);
    };
    socket.on('join:error', onError);
    return () => socket.off('join:error', onError);
  }, [socket]);

  const handlePinSubmit = (e) => {
    e.preventDefault();
    setError('');
    const cleaned = pin.replace(/\D/g, '');
    if (cleaned.length !== 6) {
      setError('Enter a 6-digit game PIN.');
      return;
    }
    setPin(cleaned);
    setStep('name');
  };

  const handleJoin = (e) => {
    e.preventDefault();
    setError('');
    const trimName = name.trim();
    if (!trimName || trimName.length < 1) {
      setError('Please enter a name.');
      return;
    }
    if (trimName.length > 20) {
      setError('Name must be 20 characters or less.');
      return;
    }
    setLoading(true);
    socket.emit('player:join', { pin, name: trimName });
    // Navigation to 'player-lobby' is triggered by GameContext on 'join:success'
  };

  return (
    <div className="join-page">
      {/* Logo */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3.5rem' }}>⚡</div>
        <h1 className="logo" style={{ fontSize: '2.5rem' }}>
          Quiz<span>Blast</span>
        </h1>
      </div>

      <div className="join-card">
        {step === 'pin' ? (
          <>
            <h2>Enter Game PIN</h2>
            <form onSubmit={handlePinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input
                ref={pinRef}
                className="input-field"
                type="tel"
                inputMode="numeric"
                placeholder="6-digit PIN"
                value={pin}
                onChange={e => { setPin(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
                maxLength={6}
                style={{ fontSize: '2rem', textAlign: 'center', letterSpacing: '0.25em' }}
                autoComplete="off"
              />
              {error && <div className="join-error">{error}</div>}
              <button
                type="submit"
                className="btn-primary"
                style={{ padding: '1rem', fontSize: '1.05rem', borderRadius: '14px' }}
                disabled={pin.length !== 6}
              >
                Continue →
              </button>
            </form>
          </>
        ) : (
          <>
            <h2>Your Name</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', marginTop: '-0.5rem' }}>
              This is how you'll appear on the scoreboard.
            </p>
            <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input
                ref={nameRef}
                className="input-field"
                type="text"
                placeholder="Your name…"
                value={name}
                onChange={e => { setName(e.target.value); setError(''); }}
                maxLength={20}
                style={{ fontSize: '1.3rem', textAlign: 'center' }}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="words"
              />
              {error && <div className="join-error">{error}</div>}
              <button
                type="submit"
                className="btn-primary"
                style={{ padding: '1rem', fontSize: '1.05rem', borderRadius: '14px' }}
                disabled={!name.trim() || loading}
              >
                {loading ? '⏳ Joining…' : '🚀 Join Game'}
              </button>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => { setStep('pin'); setError(''); setLoading(false); }}
              >
                ← Change PIN
              </button>
            </form>
          </>
        )}
      </div>

      <button className="btn-ghost" onClick={() => setView('home')} style={{ marginTop: '-1rem' }}>
        ← Back to home
      </button>
    </div>
  );
}
