/**
 * QuizBlast — pages/FinalScoreboard.jsx
 * Game over screen shown to ALL participants (host + players).
 *
 * Features:
 *   - Animated top-3 podium
 *   - Full ranked list with staggered slide-in
 *   - Play Again (host) / Home (player) buttons
 */

import { useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';

const PLACE_ORDER = [1, 0, 2]; // podium visual order: 2nd, 1st, 3rd

const MEDALS = ['🥇', '🥈', '🥉'];
const AVATARS = ['🏆', '🎯', '🎮', '⭐', '🔥', '💎', '🎉', '🚀', '💡', '🌟'];

function avatarFor(name) {
  return AVATARS[
    [...(name || 'x')].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATARS.length
  ];
}

export default function FinalScoreboard() {
  const { role, resetGame, setView, finalLeaderboard, playerName, quizInfo } = useGame();
  const confettiFiredRef = useRef(false);

  // Simple CSS confetti burst on mount
  useEffect(() => {
    if (confettiFiredRef.current) return;
    confettiFiredRef.current = true;
    // Confetti is pure CSS — triggered by adding a class
    document.body.classList.add('confetti-active');
    const t = setTimeout(() => document.body.classList.remove('confetti-active'), 4000);
    return () => clearTimeout(t);
  }, []);

  const handlePlayAgain = () => {
    resetGame();
    setView('host-dashboard');
  };

  const handleHome = () => {
    resetGame();
    setView('home');
  };

  const top3 = finalLeaderboard.slice(0, 3);
  const rest = finalLeaderboard.slice(3);

  // Find this player's position
  const myEntry = finalLeaderboard.find(p => p.name === playerName);

  return (
    <div className="final-page">
      {/* Header */}
      <div className="final-header">
        <h1>🎉 Game Over!</h1>
        {quizInfo?.quizTitle && (
          <p style={{ color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            {quizInfo.quizTitle}
          </p>
        )}
      </div>

      {/* Player's personal result (if not in top 3 or just to highlight) */}
      {myEntry && (
        <div
          style={{
            background: 'rgba(124,58,237,0.15)',
            border: '1px solid rgba(124,58,237,0.35)',
            borderRadius: '14px',
            padding: '0.85rem 1.75rem',
            textAlign: 'center',
          }}
        >
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Your result</span>
          <p style={{ fontFamily: "'Fredoka One', system-ui", fontSize: '1.5rem', color: 'var(--accent)' }}>
            {MEDALS[myEntry.rank - 1] ?? `#${myEntry.rank}`} {myEntry.name} — {myEntry.score.toLocaleString()} pts
          </p>
        </div>
      )}

      {/* ── Podium (top 3) ─────────────────────────────────────────── */}
      {top3.length > 0 && (
        <div className="podium">
          {PLACE_ORDER.map(visualIdx => {
            const entry = top3[visualIdx];
            if (!entry) return <div key={visualIdx} style={{ flex: 1 }} />;
            const placeClass = ['p2', 'p1', 'p3'][visualIdx];

            return (
              <div key={entry.name} className={`podium-place ${placeClass}`}>
                <div className="podium-avatar">{avatarFor(entry.name)}</div>
                <div className="podium-name">{entry.name}</div>
                <div className="podium-block">{visualIdx + 1}</div>
                <div className="podium-score">{entry.score.toLocaleString()}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Full ranked list (rank 4+) ─────────────────────────────── */}
      {rest.length > 0 && (
        <div className="final-full-list">
          {rest.map((p, i) => (
            <div
              key={p.name}
              className="final-row"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span className="final-row-rank">#{p.rank}</span>
              <span style={{ fontSize: '1.1rem' }}>{avatarFor(p.name)}</span>
              <span className="final-row-name">{p.name}</span>
              <span className="final-row-score">{p.score.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}

      {finalLeaderboard.length === 0 && (
        <p style={{ color: 'var(--text-muted)' }}>No scores recorded.</p>
      )}

      {/* ── Actions ───────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', paddingBottom: '2rem' }}>
        {role === 'host' && (
          <button className="btn-primary" onClick={handlePlayAgain} style={{ padding: '0.9rem 2rem', fontSize: '1rem' }}>
            🎮 Play Again
          </button>
        )}
        <button className="btn-secondary" onClick={handleHome} style={{ padding: '0.9rem 2rem', fontSize: '1rem' }}>
          🏠 Home
        </button>
      </div>
    </div>
  );
}
