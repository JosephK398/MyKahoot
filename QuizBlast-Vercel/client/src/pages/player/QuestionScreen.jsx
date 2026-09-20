/**
 * QuizBlast — pages/player/QuestionScreen.jsx
 * The main player gameplay screen.
 *
 * States:
 *   1. Question active,  not answered  → show 4 coloured buttons + timer
 *   2. Question active,  answered      → show selected button + "Waiting…"
 *   3. Question expired (handled by context → view switches to player-result)
 */

import { useState } from 'react';
import { useGame } from '../../context/GameContext';
import Timer from '../../components/Timer';

// Per-option styling
const OPTION_META = [
  { icon: '▲', label: 'A', cls: 'ans-0' },
  { icon: '◆', label: 'B', cls: 'ans-1' },
  { icon: '●', label: 'C', cls: 'ans-2' },
  { icon: '■', label: 'D', cls: 'ans-3' },
];

export default function QuestionScreen() {
  const {
    socket,
    currentQuestion,
    hasAnswered,
  } = useGame();

  const [selectedIdx, setSelectedIdx] = useState(null);

  if (!currentQuestion) {
    return <div className="loading">Loading question…</div>;
  }

  const { index, total, text, options, timeLimit, image } = currentQuestion;

  const handleAnswer = (idx) => {
    if (hasAnswered || selectedIdx !== null) return;
    setSelectedIdx(idx);
    socket.emit('player:answer', { answerIndex: idx });
  };

  const answered = hasAnswered || selectedIdx !== null;

  return (
    <div className="question-screen">
      {/* Top bar: progress + timer */}
      <div className="q-header-bar">
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Q{index + 1}/{total}
        </span>

        <div style={{ flex: 1, textAlign: 'center' }}>
          {/* Progress dots */}
          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
            {Array.from({ length: total }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: i < index ? 'var(--accent)' : i === index ? '#fff' : 'rgba(255,255,255,0.2)',
                  transition: 'background 0.3s',
                }}
              />
            ))}
          </div>
        </div>

        <Timer
          key={`q-${index}`}        // remount = restart timer on new question
          duration={timeLimit}
          size={52}
        />
      </div>

      {/* Question body */}
      <div className="q-body">
        {/* Optional image */}
        {image && (
          <img
            src={image}
            alt="Question"
            style={{
              maxHeight: 160,
              maxWidth: '100%',
              borderRadius: 12,
              objectFit: 'cover',
              border: '1px solid var(--border)',
            }}
            onError={e => { e.target.style.display = 'none'; }}
          />
        )}

        {/* Question text */}
        <p className="q-text-player">{text}</p>

        {/* Answer buttons */}
        {!answered ? (
          <div className="answer-grid">
            {options.map((opt, idx) => {
              const meta = OPTION_META[idx];
              return (
                <button
                  key={idx}
                  className={`answer-btn ${meta.cls}`}
                  onClick={() => handleAnswer(idx)}
                >
                  <span className="answer-btn-icon">{meta.icon}</span>
                  <span className="answer-btn-text">{opt}</span>
                </button>
              );
            })}
          </div>
        ) : (
          /* Answered — show selection + waiting message */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem', width: '100%', maxWidth: 400 }}>
            <div className="answer-grid" style={{ opacity: 1 }}>
              {options.map((opt, idx) => {
                const meta = OPTION_META[idx];
                const isSelected = idx === selectedIdx;
                return (
                  <button
                    key={idx}
                    className={`answer-btn ${meta.cls} ${isSelected ? 'selected' : 'dimmed'}`}
                    disabled
                  >
                    <span className="answer-btn-icon">{isSelected ? '✓' : meta.icon}</span>
                    <span className="answer-btn-text">{opt}</span>
                  </button>
                );
              })}
            </div>

            <p className="q-waiting">
              ✅ Answer locked in! Waiting for others…
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
