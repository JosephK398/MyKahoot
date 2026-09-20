/**
 * QuizBlast — pages/host/Dashboard.jsx
 * Lists all saved quizzes. Host can create, edit, delete, or launch a game.
 */

import { useState, useEffect, useCallback } from 'react';
import { useGame } from '../../context/GameContext';

export default function Dashboard() {
  const { socket, setView } = useGame();

  const [quizzes,    setQuizzes]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [launching,  setLaunching]  = useState(null); // quizId being launched
  const [error,      setError]      = useState('');

  // Load quiz list on mount
  useEffect(() => {
    fetch('/api/quiz')
      .then(async r => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
        return data;
      })
      .then(data => { setQuizzes(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(err => { console.error('Quiz API error:', err); setError(`Failed to load quizzes: ${err.message}`); setLoading(false); });
  }, []);

  // Listen for game:created to know we can navigate to the lobby
  useEffect(() => {
    const onError = ({ message }) => {
      setError(message);
      setLaunching(null);
    };
    socket.on('error', onError);
    return () => socket.off('error', onError);
  }, [socket]);

  const handleLaunch = useCallback((quizId) => {
    setLaunching(quizId);
    setError('');
    socket.emit('host:create-game', { quizId });
    // Navigation to 'host-lobby' is triggered by context on 'game:created'
  }, [socket]);

  const handleEdit = (id) => {
    sessionStorage.setItem('editQuizId', id);
    setView('host-edit-quiz');
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/quiz/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setQuizzes(q => q.filter(x => x.id !== id));
    } catch {
      setError('Failed to delete quiz.');
    }
  };

  if (loading) return <div className="loading">Loading your quizzes…</div>;

  return (
    <div className="page-full">
      {/* Header */}
      <div className="dashboard-header">
        <button className="btn-back" onClick={() => setView('home')}>← Home</button>
        <h1>My Quizzes</h1>
        <button className="btn-primary" onClick={() => setView('host-create-quiz')}>
          + New Quiz
        </button>
      </div>

      {error && <div className="error-banner" style={{ marginBottom: '1rem' }}>{error}</div>}

      {/* Empty state */}
      {quizzes.length === 0 ? (
        <div className="empty-state">
          <h3>No quizzes yet!</h3>
          <p>Create your first quiz to get started.</p>
          <button className="btn-primary" onClick={() => setView('host-create-quiz')}>
            Create a Quiz
          </button>
        </div>
      ) : (
        <div className="quiz-grid">
          {quizzes.map(quiz => (
            <div key={quiz.id} className="quiz-card">
              <div className="quiz-card-body">
                <h3>{quiz.title}</h3>
                {quiz.description && (
                  <p style={{ marginTop: '0.35rem' }}>{quiz.description}</p>
                )}
                <div className="quiz-card-meta">
                  <span className="badge">
                    {quiz.question_count ?? '?'} questions
                  </span>
                  <span>
                    {new Date(quiz.updated_at || quiz.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="quiz-card-actions">
                <button
                  className="btn-play"
                  onClick={() => handleLaunch(quiz.id)}
                  disabled={launching !== null}
                >
                  {launching === quiz.id ? '⏳ Starting…' : '▶ Play'}
                </button>
                <button
                  className="btn-edit"
                  onClick={() => handleEdit(quiz.id)}
                  disabled={launching !== null}
                >
                  ✏️ Edit
                </button>
                <button
                  className="btn-del"
                  onClick={() => handleDelete(quiz.id, quiz.title)}
                  disabled={launching !== null}
                  title="Delete quiz"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
