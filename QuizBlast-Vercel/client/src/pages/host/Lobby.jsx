/**
 * QuizBlast — pages/host/Lobby.jsx
 * Waiting room — shows game PIN, live player list, and start button.
 */

import { useGame } from '../../context/GameContext';

// Random fun avatar emojis assigned to each player slot
const AVATARS = ['🐶','🦊','🐱','🐸','🐨','🦁','🐯','🦄','🐻','🐺','🦋','🐙'];

export default function Lobby() {
  const {
    socket, setView,
    gamePin, quizInfo, lobbyPlayers, gameStarting,
    resetGame,
  } = useGame();

  const handleStart = () => {
    socket.emit('host:start-game', { pin: gamePin });
  };

  const handleCancel = () => {
    socket.emit('host:end-game', { pin: gamePin });
    resetGame();
    setView('host-dashboard');
  };

  // Derive a stable avatar per player name (deterministic hash)
  const avatarFor = (name) => AVATARS[
    [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATARS.length
  ];

  return (
    <div className="lobby-page">
      {/* Branding */}
      <h1 className="logo" style={{ fontSize: '2.2rem' }}>
        ⚡ Quiz<span>Blast</span>
      </h1>

      {/* Quiz info */}
      {quizInfo && (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', textAlign: 'center' }}>
          <strong style={{ color: 'var(--text)' }}>{quizInfo.quizTitle}</strong>
          {' — '}{quizInfo.questionCount} questions
        </p>
      )}

      {/* Game PIN */}
      <div className="pin-display">
        <p className="pin-label">Game PIN</p>
        <div className="pin-code">{gamePin}</div>
        <p className="pin-sub">
          Players go to <strong style={{ color: 'var(--text)' }}>this address</strong> and enter the PIN
        </p>
      </div>

      {/* Player list header */}
      <div className="players-header">
        <h2 style={{ fontSize: '1.15rem' }}>Players</h2>
        <span className="player-count-badge">
          {lobbyPlayers.length} joined
        </span>
      </div>

      {/* Player chips */}
      <div className="players-grid">
        {lobbyPlayers.length === 0
          ? <p className="lobby-empty">Waiting for players to join…</p>
          : lobbyPlayers.map(p => (
            <div key={p.name} className="player-chip">
              {avatarFor(p.name)} {p.name}
            </div>
          ))
        }
      </div>

      {/* Controls */}
      <div className="lobby-controls">
        {gameStarting ? (
          <div className="lobby-starting">
            <span>🚀</span> Game starting…
          </div>
        ) : (
          <>
            <button
              className="btn-primary"
              style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', borderRadius: '16px' }}
              onClick={handleStart}
              disabled={lobbyPlayers.length === 0}
            >
              🚀 Start Game ({lobbyPlayers.length} player{lobbyPlayers.length !== 1 ? 's' : ''})
            </button>
            {lobbyPlayers.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textAlign: 'center' }}>
                Need at least 1 player to start.
              </p>
            )}
          </>
        )}

        <button className="btn-ghost" onClick={handleCancel}>
          ✕ Cancel Game
        </button>
      </div>
    </div>
  );
}
