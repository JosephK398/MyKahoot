/**
 * QuizBlast — pages/host/QuizCreator.jsx
 * Full-featured quiz builder.  Handles both CREATE (quizId=null) and EDIT.
 *
 * Each question has:
 *   text, options[4], correctAnswer (0-3), timeLimit (seconds), image? (URL)
 */

import { useState, useEffect } from 'react';
import { useGame } from '../../context/GameContext';

// ─── Defaults ─────────────────────────────────────────────────────────────────
const OPTION_COLORS = ['var(--ans-a)', 'var(--ans-b)', 'var(--ans-c)', 'var(--ans-d)'];
const OPTION_ICONS  = ['▲', '◆', '●', '■'];
const OPTION_LABELS = ['A', 'B', 'C', 'D'];
const TIME_OPTIONS  = [5, 10, 15, 20, 30, 45, 60];

function blankQuestion() {
  return {
    text: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    timeLimit: 20,
    image: '',
  };
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function QuizCreator({ quizId }) {
  const { setView } = useGame();

  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [questions,   setQuestions]   = useState([blankQuestion()]);
  const [activeIdx,   setActiveIdx]   = useState(0);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');
  const [loadError,   setLoadError]   = useState('');

  // Load existing quiz when editing
  useEffect(() => {
    if (!quizId) return;
    fetch(`/api/quiz/${quizId}`)
      .then(r => r.json())
      .then(data => {
        setTitle(data.title || '');
        setDescription(data.description || '');
        setQuestions(data.questions?.length ? data.questions : [blankQuestion()]);
      })
      .catch(() => setLoadError('Failed to load quiz.'));
  }, [quizId]);

  // ── Question-level helpers ───────────────────────────────────────────────
  const updateQ = (idx, field, value) =>
    setQuestions(qs => qs.map((q, i) => i === idx ? { ...q, [field]: value } : q));

  const updateOption = (qIdx, oIdx, value) =>
    setQuestions(qs => qs.map((q, i) => {
      if (i !== qIdx) return q;
      const options = [...q.options];
      options[oIdx] = value;
      return { ...q, options };
    }));

  const addQuestion = () => {
    const newIdx = questions.length;
    setQuestions(qs => [...qs, blankQuestion()]);
    setActiveIdx(newIdx);
  };

  const removeQuestion = (idx) => {
    if (questions.length === 1) return;
    setQuestions(qs => qs.filter((_, i) => i !== idx));
    setActiveIdx(Math.min(activeIdx, questions.length - 2));
  };

  const moveQuestion = (idx, dir) => {
    const to = idx + dir;
    if (to < 0 || to >= questions.length) return;
    setQuestions(qs => {
      const copy = [...qs];
      [copy[idx], copy[to]] = [copy[to], copy[idx]];
      return copy;
    });
    setActiveIdx(to);
  };

  // ── Validation ──────────────────────────────────────────────────────────
  function validate() {
    if (!title.trim()) return { ok: false, msg: 'Quiz title is required.', idx: null };
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim())
        return { ok: false, msg: `Question ${i + 1} has no text.`, idx: i };
      if (q.options.some(o => !o.trim()))
        return { ok: false, msg: `Question ${i + 1} has an empty answer option.`, idx: i };
    }
    return { ok: true };
  }

  // ── Save ────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setError('');
    const v = validate();
    if (!v.ok) {
      setError(v.msg);
      if (v.idx !== null) setActiveIdx(v.idx);
      return;
    }

    setSaving(true);
    try {
      const url    = quizId ? `/api/quiz/${quizId}` : '/api/quiz';
      const method = quizId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), description: description.trim(), questions }),
      });
      if (!res.ok) {
        // Safely handle empty or non-JSON error bodies (server crash, etc.)
        let msg = `Save failed (HTTP ${res.status})`;
        try {
          const text = await res.text();
          if (text.trim()) { const data = JSON.parse(text); msg = data.error || msg; }
        } catch (_) { /* keep default msg */ }
        throw new Error(msg);
      }
      setView('host-dashboard');
    } catch (e) {
      setError(e.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loadError) return (
    <div className="page-center">
      <p style={{ color: 'var(--ans-a)' }}>{loadError}</p>
      <button className="btn-secondary" onClick={() => setView('host-dashboard')}>← Back</button>
    </div>
  );

  const q = questions[activeIdx];

  return (
    <div className="creator-wrap">
      {/* ── Sticky header ──────────────────────────────────────────────── */}
      <div className="creator-header">
        <button className="btn-back" onClick={() => setView('host-dashboard')}>← Back</button>
        <h1>{quizId ? 'Edit Quiz' : 'New Quiz'}</h1>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? '⏳ Saving…' : '💾 Save Quiz'}
        </button>
      </div>

      {/* ── Quiz meta ──────────────────────────────────────────────────── */}
      <div className="creator-meta">
        <input
          className="input-field"
          placeholder="Quiz title (e.g. Office Trivia 2025)"
          value={title}
          onChange={e => setTitle(e.target.value)}
          style={{ flex: 2 }}
        />
        <input
          className="input-field"
          placeholder="Short description (optional)"
          value={description}
          onChange={e => setDescription(e.target.value)}
          style={{ flex: 3 }}
        />
      </div>

      {error && (
        <div className="error-banner" style={{ margin: '0.75rem 1.5rem' }}>{error}</div>
      )}

      {/* ── Main body: sidebar + editor ──────────────────────────────── */}
      <div className="creator-body">

        {/* Question sidebar */}
        <div className="q-sidebar">
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
            QUESTIONS ({questions.length})
          </p>

          {questions.map((q, i) => (
            <div
              key={i}
              className={`q-thumb ${i === activeIdx ? 'active' : ''} ${!q.text.trim() ? 'empty' : ''}`}
              onClick={() => setActiveIdx(i)}
            >
              <span className="q-num">Q{i + 1}</span>
              <span className="q-preview">{q.text.trim() || '— empty —'}</span>
            </div>
          ))}

          <button className="btn-add-q" onClick={addQuestion}>
            + Add Question
          </button>
        </div>

        {/* Question editor */}
        <div className="q-editor">
          <div className="q-editor-header">
            <h3>Question {activeIdx + 1} of {questions.length}</h3>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Time limit */}
              <label className="inline-label" style={{ fontSize: '0.85rem' }}>
                ⏱ Time:
                <select
                  className="input-field"
                  style={{ width: 'auto', padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                  value={q.timeLimit}
                  onChange={e => updateQ(activeIdx, 'timeLimit', Number(e.target.value))}
                >
                  {TIME_OPTIONS.map(t => (
                    <option key={t} value={t}>{t}s</option>
                  ))}
                </select>
              </label>

              {/* Reorder */}
              <button
                className="btn-secondary"
                style={{ padding: '0.4rem 0.7rem', fontSize: '0.85rem' }}
                onClick={() => moveQuestion(activeIdx, -1)}
                disabled={activeIdx === 0}
                title="Move up"
              >↑</button>
              <button
                className="btn-secondary"
                style={{ padding: '0.4rem 0.7rem', fontSize: '0.85rem' }}
                onClick={() => moveQuestion(activeIdx, 1)}
                disabled={activeIdx === questions.length - 1}
                title="Move down"
              >↓</button>

              {/* Delete */}
              <button
                className="btn-danger"
                onClick={() => removeQuestion(activeIdx)}
                disabled={questions.length === 1}
                title="Remove question"
              >
                🗑️ Remove
              </button>
            </div>
          </div>

          {/* Question text */}
          <label>
            Question text
            <textarea
              className="input-field"
              placeholder="Type your question here…"
              value={q.text}
              onChange={e => updateQ(activeIdx, 'text', e.target.value)}
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </label>

          {/* Optional image URL */}
          <label>
            Image URL <span style={{ color: 'var(--text-muted)' }}>(optional)</span>
            <input
              className="input-field"
              placeholder="https://example.com/image.png"
              value={q.image || ''}
              onChange={e => updateQ(activeIdx, 'image', e.target.value)}
            />
          </label>
          {q.image && (
            <img
              src={q.image}
              alt="Question"
              style={{ maxHeight: 160, borderRadius: 10, objectFit: 'cover', border: '1px solid var(--border)' }}
              onError={e => { e.target.style.display = 'none'; }}
            />
          )}

          {/* Answer options */}
          <div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Answer options — select the radio button to mark the <strong style={{ color: 'var(--ans-d)' }}>correct answer</strong>
            </p>
            <div className="options-grid">
              {q.options.map((opt, oIdx) => (
                <div
                  key={oIdx}
                  className={`option-card ${q.correctAnswer === oIdx ? 'correct' : ''}`}
                >
                  <div
                    className="option-color-bar"
                    style={{ background: OPTION_COLORS[oIdx] }}
                  >
                    <span>{OPTION_ICONS[oIdx]} {OPTION_LABELS[oIdx]}</span>
                    <label
                      className="inline-label"
                      style={{ color: '#fff', fontSize: '0.8rem', cursor: 'pointer', gap: '0.3rem' }}
                      title="Mark as correct"
                    >
                      ✓
                      <input
                        type="radio"
                        name={`correct-q${activeIdx}`}
                        className="correct-radio"
                        checked={q.correctAnswer === oIdx}
                        onChange={() => updateQ(activeIdx, 'correctAnswer', oIdx)}
                      />
                    </label>
                  </div>
                  <input
                    className="option-input"
                    placeholder={`Option ${OPTION_LABELS[oIdx]}…`}
                    value={opt}
                    onChange={e => updateOption(activeIdx, oIdx, e.target.value)}
                    maxLength={120}
                  />
                </div>
              ))}
            </div>
          </div>

          <hr className="divider" />

          {/* Navigate between questions */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between' }}>
            <button
              className="btn-secondary"
              onClick={() => setActiveIdx(i => Math.max(0, i - 1))}
              disabled={activeIdx === 0}
            >
              ← Prev
            </button>
            <button
              className="btn-primary"
              onClick={activeIdx < questions.length - 1
                ? () => setActiveIdx(i => i + 1)
                : addQuestion}
            >
              {activeIdx < questions.length - 1 ? 'Next →' : '+ Add Question'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
