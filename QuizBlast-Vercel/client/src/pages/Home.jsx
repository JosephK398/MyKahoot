import { useGame } from '../context/GameContext';

export default function Home() {
  const { setView } = useGame();

  return (
    <div className="home-page">
      <div className="home-hero">
        <div className="home-bolt">⚡</div>
        <h1 className="logo">Quiz<span>Blast</span></h1>
        <p className="logo-sub">Real-time multiplayer quizzes — no internet required</p>
      </div>

      <div className="home-actions">
        <button
          className="btn-host-cta"
          onClick={() => setView('host-dashboard')}
        >
          🎮 Host a Game
        </button>
        <button
          className="btn-player-cta"
          onClick={() => setView('player-join')}
        >
          🙋 Join a Game
        </button>
      </div>

      <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textAlign: 'center', maxWidth: 300 }}>
        Open on any device on the same network.<br />Host presents on the big screen, players use their phones.
      </p>
    </div>
  );
}
