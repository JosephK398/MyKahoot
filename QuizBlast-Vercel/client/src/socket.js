/**
 * Vercel-compatible replacement for Socket.IO.
 * Uses the existing event names expected by the React UI, but transports
 * commands through Vercel Functions and polls game state every 700ms.
 * No external service is required.
 */

const listeners = new Map();
let timer = null;
let previous = null;
let connected = false;
let sessionToken = localStorage.getItem('quizblastSession') || null;
let role = localStorage.getItem('quizblastRole') || null;

function on(event, fn) {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(fn);
}
function off(event, fn) { listeners.get(event)?.delete(fn); }
function emitLocal(event, data) { listeners.get(event)?.forEach(fn => fn(data)); }
async function command(action, payload = {}) {
  try {
    const res = await fetch('/api/game', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...payload, token: sessionToken }) });
    const data = await res.json();
    if (!res.ok) {
      emitLocal(action === 'join' ? 'join:error' : 'error', { message: data.error || `Request failed (${res.status})` });
      return data;
    }
    if (data.token) {
      sessionToken = data.token;
      localStorage.setItem('quizblastSession', sessionToken);
    }
    if (data.pin) localStorage.setItem('quizblastPin', data.pin);
    return data;
  } catch (err) {
    emitLocal('error', { message: err.message || 'Network error' });
    return null;
  }
}

async function poll() {
  if (!sessionToken) return;
  try {
    const res = await fetch(`/api/game?token=${encodeURIComponent(sessionToken)}`, { cache: 'no-store' });
    if (!res.ok) {
      if (res.status === 404) { stop(); emitLocal('game:error', { message: 'Game session expired. Please start or join a new game.' }); }
      return;
    }
    const s = await res.json();
    const p = previous;
    if (!p) {
      previous = s;
      return processState(null, s);
    }
    previous = s;
    processState(p, s);
  } catch (_) {}
}
function processState(p, s) {
  if (!p || p.players?.length !== s.players?.length || JSON.stringify(p.players) !== JSON.stringify(s.players)) {
    emitLocal(p && s.players.length < p.players.length ? 'player:left' : 'player:joined', { players: s.players, count: s.players.length });
  }
  if (p?.status !== s.status && s.status === 'countdown') emitLocal('game:started', {});
  if (p?.status !== s.status && s.status === 'question') {
    if (s.role === 'host') emitLocal('question:start:host', s.question);
    else emitLocal('question:start', s.question);
  }
  if (s.status === 'question') emitLocal('question:stats', s.stats);
  if (p?.status === 'question' && s.status === 'leaderboard') {
    emitLocal('question:ended', s.result);
    if (s.answerResult) emitLocal('answer:result', s.answerResult);
  }
  if (p?.status !== 'ended' && s.status === 'ended') emitLocal('game:ended', { finalLeaderboard: s.finalLeaderboard || [] });
  if (s.answerResult && (!p?.answerResult || p.answerResult.questionIndex !== s.answerResult.questionIndex)) emitLocal('answer:result', s.answerResult);
}

function connect() {
  if (connected) return;
  connected = true;
  poll();
  timer = setInterval(poll, 700);
}
function stop() { if (timer) clearInterval(timer); timer = null; connected = false; }
function disconnect() { stop(); previous = null; }

const socket = {
  on, off,
  removeAllListeners() { listeners.clear(); },
  connect,
  disconnect,
  emit(event, payload = {}) {
    const map = {
      'host:create-game': () => command('create', payload).then(d => d && d.pin && emitLocal('game:created', d)),
      'host:start-game': () => command('start', { pin: payload.pin }),
      'host:next-question': () => command('next', { pin: payload.pin }),
      'host:end-game': () => command('end', { pin: payload.pin }),
      'player:join': () => command('join', payload).then(d => d && d.token && emitLocal('join:success', d)),
      'player:answer': () => command('answer', payload),
      'player:leave': () => command('leave', { pin: payload.pin }),
    };
    if (map[event]) return map[event]();
  },
};

export default socket;
