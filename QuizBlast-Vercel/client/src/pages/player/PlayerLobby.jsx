/**
 * QuizBlast — pages/player/PlayerLobby.jsx
 * Shown to players after joining, while waiting for the host to start.
 */

import { useGame } from '../../context/GameContext';

// Emoji cycle for animated "fun" display
const FUN_EMOJIS = ['🎯','🎮','⚡','🏆','🎉','🔥','💡','🚀'];

export default function PlayerLobby() {
  const { playerName, quizInfo, resetGame, setView } = useGame();

  // Pick a consistent emoji based on name
  const emoji = FUN_EMOJIS[
    [...(playerName || 'x')].reduce((a, c) => a + c.charCodeAt(0), 0) % FUN_EMOJIS.length
  ];

  const handleLeave = () => {
    resetGame();
    setView('home');
  };

  return (
    <div className="player-lobby">
      {/* Animated avatar */}
      <div className="player-lobby-avatar">{emoji}</div>

      {/* Name */}
      <p className="player-lobby-name">{playerName}</p>

      {/* Quiz title */}
      {quizInfo?.quizTitle && (
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
          {quizInfo.quizTitle}
        </p>
      )}

      {/* Waiting indicator */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', marginTop: '1rem' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Waiting for the host to start…
        </p>
        <div className="waiting-dots">
          <span>●</span><span>●</span><span>●</span>
        </div>
      </div>

      {/* Leave option */}
      <button
        className="btn-ghost"
        style={{ marginTop: '2rem', fontSize: '0.85rem' }}
        onClick={handleLeave}
      >
        ← Leave game
      </button>
    </div>
  );
}
