/**
 * QuizBlast — App.jsx
 * Root component. Reads `view` from GameContext and renders the appropriate page.
 */

import { useEffect } from 'react';
import { GameProvider, useGame } from './context/GameContext';

// Host pages
import Home         from './pages/Home';
import Dashboard    from './pages/host/Dashboard';
import QuizCreator  from './pages/host/QuizCreator';
import Lobby        from './pages/host/Lobby';
import GameScreen   from './pages/host/GameScreen';

// Player pages
import JoinGame     from './pages/player/JoinGame';
import PlayerLobby  from './pages/player/PlayerLobby';
import QuestionScreen from './pages/player/QuestionScreen';
import ResultScreen from './pages/player/ResultScreen';

// Shared pages
import FinalScoreboard from './pages/FinalScoreboard';

function AppContent() {
  const { view, connectionError, setConnectionError } = useGame();

  // Dismiss connection error toast after 4s
  useEffect(() => {
    if (!connectionError) return;
    const t = setTimeout(() => setConnectionError(null), 4000);
    return () => clearTimeout(t);
  }, [connectionError, setConnectionError]);

  return (
    <div className="app-root">
      {/* Global error toast */}
      {connectionError && (
        <div className="toast toast-error">⚠️ {connectionError}</div>
      )}

      {view === 'home'             && <Home />}
      {view === 'host-dashboard'   && <Dashboard />}
      {view === 'host-create-quiz' && <QuizCreator quizId={null} />}
      {view === 'host-edit-quiz'   && <QuizCreatorWrapper />}
      {view === 'host-lobby'       && <Lobby />}
      {view === 'host-game'        && <GameScreen />}
      {view === 'player-join'      && <JoinGame />}
      {view === 'player-lobby'     && <PlayerLobby />}
      {view === 'player-game'      && <QuestionScreen />}
      {view === 'player-result'    && <ResultScreen />}
      {view === 'final'            && <FinalScoreboard />}
    </div>
  );
}

// Thin wrapper that keeps the editing quiz ID in its own local state
// (avoids putting ephemeral editor state into global context)
function QuizCreatorWrapper() {
  // The quiz ID to edit is stored in sessionStorage by Dashboard
  const quizId = sessionStorage.getItem('editQuizId');
  return <QuizCreator quizId={quizId ? Number(quizId) : null} />;
}

export default function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
}
