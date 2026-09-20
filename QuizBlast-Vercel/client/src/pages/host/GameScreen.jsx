/**
 * QuizBlast — pages/host/GameScreen.jsx
 * Shown to the host during gameplay.
 *
 * While question is ACTIVE   → shows question text, timer, live answer distribution
 * After question ENDS        → reveals correct answer, full stats, leaderboard,
 *                              and "Next Question" / "End Game" button
 */

import { useGame } from '../../context/GameContext';
import Timer       from '../../components/Timer';
import AnswerBar   from '../../components/AnswerBar';
import Leaderboard from '../../components/Leaderboard';

const ICONS = ['▲', '◆', '●', '■'];

export default function GameScreen() {
  const {
    socket, setView, resetGame,
    gamePin,
    currentQuestion,
    hostCorrectAnswer,
    questionStats,
    questionActive,
    questionResult,
  } = useGame();

  if (!currentQuestion) {
    return (
      <div className="loading">
        <span style={{ animation: 'blink 1s ease-in-out infinite' }}>
          🚀 Launching first question…
        </span>
      </div>
    );
  }

  const handleNext = () => {
    socket.emit('host:next-question', { pin: gamePin });
  };

  const handleEndGame = () => {
    if (window.confirm('End the game now and show final scores?')) {
      socket.emit('host:end-game', { pin: gamePin });
    }
  };

  const handleGoHome = () => {
    resetGame();
    setView('home');
  };

  const { index, total, text, options, timeLimit, image } = currentQuestion;

  // Use live stats during question, or final stats from questionResult after
  const counts = questionActive
    ? questionStats.counts
    : questionResult?.counts ?? [0, 0, 0, 0];

  const correctAnswer = questionActive ? undefined : questionResult?.correctAnswer;

  const answeredSoFar = questionStats.answered ?? 0;
  const totalPlayers  = questionStats.total ?? 0;

  return (
    <div className="game-screen">
      {/* Top bar */}
      <div className="game-topbar">
        <span className="logo" style={{ fontSize: '1.4rem', lineHeight: 1 }}>
          ⚡ Quiz<span>Blast</span>
        </span>
        <span className="q-progress">
          Q{index + 1} / {total}
        </span>
        <button className="btn-danger" onClick={handleEndGame} style={{ fontSize: '0.82rem', padding: '0.4rem 0.8rem' }}>
          End Game
        </button>
      </div>

      {/* Question card */}
      <div className="q-card">
        <div className="q-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Question {index + 1}
            </span>
            {!questionActive && (
              <span style={{ fontSize: '0.82rem', background: 'rgba(48,209,88,0.12)',
                color: 'var(--ans-d)', border: '1px solid rgba(48,209,88,0.25)',
                padding: '0.2rem 0.55rem', borderRadius: '6px' }}>
                Time up
              </span>
            )}
          </div>

          {questionActive && (
            <Timer
              key={`timer-${index}`}
              duration={timeLimit}
              size={64}
            />
          )}
        </div>

        {/* Optional question image */}
        {image && (
          <img
            src={image}
            alt="Question visual"
            style={{
              maxHeight: 160,
              borderRadius: 10,
              objectFit: 'cover',
              marginBottom: '1rem',
              border: '1px solid var(--border)',
            }}
            onError={e => { e.target.style.display = 'none'; }}
          />
        )}

        <p className="q-text">{text}</p>

        {questionActive && (
          <p className="answered-count" style={{ marginTop: '0.75rem' }}>
            {answeredSoFar} / {totalPlayers} answered
          </p>
        )}
      </div>

      {/* Answer distribution bars */}
      <AnswerBar
        counts={counts}
        options={options}
        correctAnswer={correctAnswer}
        total={totalPlayers}
      />

      {/* After question ends: leaderboard + next button */}
      {!questionActive && questionResult && (
        <>
          <Leaderboard
            players={questionResult.leaderboard ?? []}
            title="🏆 Leaderboard"
          />

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {questionResult.isLast ? (
              <button
                className="host-next-btn"
                onClick={() => socket.emit('host:end-game', { pin: gamePin })}
                style={{ background: 'linear-gradient(135deg,#7C3AED,#5B21B6)' }}
              >
                🎉 Show Final Scores
              </button>
            ) : (
              <button className="host-next-btn" onClick={handleNext}>
                Next Question →
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
