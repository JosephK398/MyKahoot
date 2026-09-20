/**
 * QuizBlast — pages/player/ResultScreen.jsx
 * Shown after each question ends.
 * Displays: correct/wrong, points earned this round, cumulative score, rank.
 * Waits for the host to advance; auto-transitions when next question:start fires.
 */

import { useGame } from '../../context/GameContext';

const OPTION_META = [
  { icon: '▲', label: 'A', color: 'var(--ans-a)' },
  { icon: '◆', label: 'B', color: 'var(--ans-b)' },
  { icon: '●', label: 'C', color: 'var(--ans-c)' },
  { icon: '■', label: 'D', color: 'var(--ans-d)' },
];

const RANK_SUFFIX = (n) => {
  if (n === 1) return '🥇 1st';
  if (n === 2) return '🥈 2nd';
  if (n === 3) return '🥉 3rd';
  return `#${n}`;
};

export default function ResultScreen() {
  const {
    answerResult,
    playerScore,
    playerRank,
    currentQuestion,
  } = useGame();

  // answerResult arrives shortly after view change; show spinner until ready
  if (!answerResult) {
    return (
      <div className="loading" style={{ flexDirection: 'column', gap: '1rem' }}>
        <span style={{ fontSize: '2rem', animation: 'pulse 1s ease-in-out infinite' }}>⚡</span>
        <span>Calculating results…</span>
      </div>
    );
  }

  const { correct, points, correctAnswer, answered } = answerResult;

  const correctOption = currentQuestion?.options?.[correctAnswer];
  const meta          = OPTION_META[correctAnswer] ?? OPTION_META[0];

  return (
    <div className="result-screen">
      {/* Big result icon */}
      <div className="result-icon">
        {!answered ? '⏰' : correct ? '🎉' : '😬'}
      </div>

      {/* Verdict label */}
      <p className={`result-label ${correct ? 'correct' : 'wrong'}`}>
        {!answered
          ? "Time's up!"
          : correct
            ? 'Correct!'
            : 'Wrong!'}
      </p>

      {/* Points earned */}
      {points > 0 && (
        <p className="result-points">+{points.toLocaleString()} pts</p>
      )}
      {points === 0 && answered && (
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>No points this round</p>
      )}

      {/* Correct answer reveal */}
      {!correct && correctAnswer !== undefined && correctOption && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            background: 'rgba(48,209,88,0.1)',
            border: '1px solid rgba(48,209,88,0.25)',
            borderRadius: '12px',
            padding: '0.75rem 1.25rem',
          }}
        >
          <span style={{ fontSize: '1.3rem', color: meta.color }}>{meta.icon}</span>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Correct answer: <strong style={{ color: 'var(--ans-d)' }}>{correctOption}</strong>
          </span>
        </div>
      )}

      {/* Total score */}
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
          Your score
        </p>
        <p style={{ fontFamily: "'Fredoka One', system-ui", fontSize: '2.2rem', color: 'var(--accent)' }}>
          {(playerScore || 0).toLocaleString()}
        </p>
      </div>

      {/* Rank */}
      {playerRank > 0 && (
        <div className="result-rank">
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
            Current rank
          </p>
          <p className="result-rank-num">{RANK_SUFFIX(playerRank)}</p>
        </div>
      )}

      {/* Waiting for next question */}
      <p className="waiting-next">
        ⏳ Waiting for next question…
      </p>
    </div>
  );
}
