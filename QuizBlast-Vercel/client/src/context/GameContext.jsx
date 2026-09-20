/**
 * QuizBlast — context/GameContext.jsx
 *
 * Central state store + WebSocket event hub.
 * All socket listeners live here to avoid stale-closure pitfalls.
 * Components READ from context; socket.emit() calls happen in components.
 */

import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import socket from '../socket';

const GameContext = createContext(null);

export function GameProvider({ children }) {
  /* ── View / routing ──────────────────────────────────────────────────────── */
  const [view, _setView]   = useState('home');
  const viewRef            = useRef('home');
  const setView            = useCallback((v) => { viewRef.current = v; _setView(v); }, []);

  /* ── Role tracking (needed inside socket handlers) ───────────────────────── */
  const [role, _setRole]   = useState(null);        // 'host' | 'player' | null
  const roleRef            = useRef(null);
  const setRole            = useCallback((r) => { roleRef.current = r; _setRole(r); }, []);

  /* ── Shared game info ────────────────────────────────────────────────────── */
  const [gamePin,      setGamePin]      = useState(null);
  const [quizInfo,     setQuizInfo]     = useState(null); // { quizTitle, questionCount }

  /* ── Host — lobby ────────────────────────────────────────────────────────── */
  const [lobbyPlayers, setLobbyPlayers] = useState([]);
  const [gameStarting, setGameStarting] = useState(false);

  /* ── Host + Player — current question ───────────────────────────────────── */
  const [currentQuestion,  setCurrentQuestion]  = useState(null);
  // correctAnswer exposed only to host
  const [hostCorrectAnswer, setHostCorrectAnswer] = useState(null);

  /* ── Host — live stats during a question ─────────────────────────────────── */
  const [questionStats, setQuestionStats] = useState({ counts: [0,0,0,0], answered: 0, total: 0 });

  /* ── Host + Player — state flags ─────────────────────────────────────────── */
  const [questionActive,  setQuestionActive]  = useState(false);
  const [questionResult,  setQuestionResult]  = useState(null);
  // { correctAnswer, counts, leaderboard, isLast }

  /* ── Player — answer tracking ────────────────────────────────────────────── */
  const [hasAnswered,  setHasAnswered]   = useState(false);
  const [answerResult, setAnswerResult]  = useState(null);
  // { answered, correct, points, correctAnswer, totalScore, rank }

  /* ── Player — persistent score / name ───────────────────────────────────── */
  const [playerName,   setPlayerName]   = useState('');
  const [playerScore,  setPlayerScore]  = useState(0);
  const [playerRank,   setPlayerRank]   = useState(0);

  /* ── Final scoreboard ────────────────────────────────────────────────────── */
  const [finalLeaderboard, setFinalLeaderboard] = useState([]);

  /* ── Connection error banner ──────────────────────────────────────────────── */
  const [connectionError, setConnectionError] = useState(null);

  /* ── All socket listeners (mounted once) ─────────────────────────────────── */
  useEffect(() => {
    socket.connect();

    /* ── HOST events ─────────────────────────────────────────────────── */

    socket.on('game:created', ({ pin, quizTitle, questionCount }) => {
      setRole('host');
      setGamePin(pin);
      setQuizInfo({ quizTitle, questionCount });
      setLobbyPlayers([]);
      setGameStarting(false);
      setView('host-lobby');
    });

    socket.on('player:joined', ({ players }) => {
      setLobbyPlayers(players);
    });

    socket.on('player:left', ({ players }) => {
      setLobbyPlayers(players);
    });

    socket.on('game:started', () => {
      // Host stays in lobby; shows countdown. Next: question:start:host
      setGameStarting(true);
    });

    // Host-only question payload (includes correctAnswer)
    socket.on('question:start:host', (question) => {
      setCurrentQuestion(question);
      setHostCorrectAnswer(question.correctAnswer);
      setQuestionStats({ counts: [0,0,0,0], answered: 0, total: 0 });
      setQuestionActive(true);
      setQuestionResult(null);
      setGameStarting(false);
      setView('host-game');
    });

    socket.on('question:stats', (stats) => {
      setQuestionStats(stats);
    });

    /* ── PLAYER events ───────────────────────────────────────────────── */

    socket.on('join:success', ({ name, quizTitle }) => {
      setRole('player');
      setPlayerName(name);
      setQuizInfo({ quizTitle });
      setView('player-lobby');
    });

    socket.on('join:error', ({ message }) => {
      // Handled inline in JoinGame component via a separate listener
    });

    // Player-only question payload (NO correctAnswer)
    socket.on('question:start', (question) => {
      setCurrentQuestion(question);
      setHasAnswered(false);
      setAnswerResult(null);
      setQuestionActive(true);
      setQuestionResult(null);
      if (roleRef.current === 'player') {
        setView('player-game');
      }
    });

    socket.on('answer:received', () => {
      setHasAnswered(true);
    });

    socket.on('answer:result', (result) => {
      setAnswerResult(result);
      setPlayerScore(result.totalScore);
      setPlayerRank(result.rank);
    });

    /* ── SHARED events ───────────────────────────────────────────────── */

    socket.on('question:ended', ({ correctAnswer, counts, leaderboard, isLast }) => {
      setQuestionActive(false);
      setQuestionResult({ correctAnswer, counts, leaderboard, isLast });
      // Host stays on host-game to see stats; player goes to result screen
      if (roleRef.current === 'player') {
        setView('player-result');
      }
    });

    socket.on('game:ended', ({ finalLeaderboard }) => {
      setFinalLeaderboard(finalLeaderboard);
      setView('final');
    });

    socket.on('game:error', ({ message }) => {
      setConnectionError(message);
      setView('home');
    });

    socket.on('disconnect', (reason) => {
      if (reason === 'io server disconnect') {
        setConnectionError('Disconnected from server.');
      }
    });

    socket.on('error', ({ message }) => {
      console.error('Socket error:', message);
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Reset all state when going back to home ─────────────────────────────── */
  const resetGame = useCallback(() => {
    setRole(null);
    setGamePin(null);
    setQuizInfo(null);
    setLobbyPlayers([]);
    setGameStarting(false);
    setCurrentQuestion(null);
    setHostCorrectAnswer(null);
    setQuestionStats({ counts: [0,0,0,0], answered: 0, total: 0 });
    setQuestionActive(false);
    setQuestionResult(null);
    setHasAnswered(false);
    setAnswerResult(null);
    setPlayerName('');
    setPlayerScore(0);
    setPlayerRank(0);
    setFinalLeaderboard([]);
    setConnectionError(null);
  }, []);

  return (
    <GameContext.Provider value={{
      socket,
      view, setView,
      role,

      // Game
      gamePin,
      quizInfo,

      // Host — lobby
      lobbyPlayers,
      gameStarting,

      // Host — question display
      hostCorrectAnswer,
      questionStats,

      // Shared — question
      currentQuestion,
      questionActive,
      questionResult,

      // Player
      playerName,
      playerScore,
      playerRank,
      hasAnswered,
      answerResult,

      // Final
      finalLeaderboard,

      // Misc
      connectionError,
      setConnectionError,
      resetGame,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export const useGame = () => useContext(GameContext);
