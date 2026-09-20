/**
 * QuizBlast — components/Leaderboard.jsx
 * Compact leaderboard list, used inside the host game screen.
 */

const MEDALS = ['🥇', '🥈', '🥉'];

export default function Leaderboard({ players = [], title = 'Leaderboard' }) {
  return (
    <div className="leaderboard-panel">
      <h3>{title}</h3>
      {players.length === 0 && (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          No scores yet.
        </p>
      )}
      {players.map((p, i) => (
        <div key={p.name} className="lb-row" style={{
          animationDelay: `${i * 60}ms`,
        }}>
          <span className="lb-rank">{i < 3 ? MEDALS[i] : `#${i + 1}`}</span>
          <span className="lb-name">{p.name}</span>
          <span className="lb-score">{p.score.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}
