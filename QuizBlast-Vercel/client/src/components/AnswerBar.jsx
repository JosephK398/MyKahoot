/**
 * QuizBlast — components/AnswerBar.jsx
 * Horizontal bar chart showing live answer distribution during/after a question.
 *
 * Props:
 *   counts        — [n, n, n, n] array of answer counts
 *   options       — string[] answer option labels
 *   correctAnswer — index (0-3) of correct answer; undefined = question still active
 *   total         — total player count (for % calculation)
 */

const COLORS  = ['var(--ans-a)', 'var(--ans-b)', 'var(--ans-c)', 'var(--ans-d)'];
const ICONS   = ['▲', '◆', '●', '■'];

export default function AnswerBar({ counts = [0,0,0,0], options = [], correctAnswer, total = 1 }) {
  const max = Math.max(...counts, 1);

  return (
    <div className="answer-bars">
      {counts.map((count, i) => {
        const isCorrect = correctAnswer !== undefined && correctAnswer === i;
        const isWrong   = correctAnswer !== undefined && correctAnswer !== i;
        const pct       = total > 0 ? Math.round((count / total) * 100) : 0;

        return (
          <div key={i} className="answer-bar-row">
            {/* Coloured icon badge */}
            <div
              className="answer-bar-icon"
              style={{ background: COLORS[i], opacity: isWrong ? 0.45 : 1 }}
            >
              {ICONS[i]}
            </div>

            {/* Track + fill */}
            <div className="answer-bar-track">
              <div
                className="answer-bar-fill"
                style={{
                  width:      `${(count / max) * 100}%`,
                  background: COLORS[i],
                  opacity:    isWrong ? 0.4 : 1,
                  minWidth:   count > 0 ? '2.5rem' : '0',
                }}
              >
                {options[i] && (
                  <span style={{ opacity: 0.85 }}>{options[i]}</span>
                )}
              </div>
            </div>

            {/* Count + correct marker */}
            <div className="answer-bar-count">
              {count}
              {isCorrect && <span className="correct-tag">✓</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
