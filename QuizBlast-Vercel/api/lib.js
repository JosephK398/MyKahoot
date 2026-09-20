const crypto = require('crypto');
const QUIZ_DATA = require('../server/data/quizzes.json');
const SAMPLE_DATA = require('../server/data/sampleQuiz.json');

const state = globalThis.__quizblastState || { quizzes: null, nextQuizId: 1, games: new Map() };
globalThis.__quizblastState = state;

function loadQuizzes() {
  if (state.quizzes) return state.quizzes;
  const loaded = Array.isArray(QUIZ_DATA?.quizzes) ? QUIZ_DATA.quizzes : [];
  state.quizzes = loaded.length ? loaded.map(q => ({...q, questions: Array.isArray(q.questions) ? q.questions : []})) : [{
    id: 1, title: SAMPLE_DATA.title || 'QuizBlast Quiz', description: SAMPLE_DATA.description || '',
    questions: Array.isArray(SAMPLE_DATA.questions) ? SAMPLE_DATA.questions : [],
    created_at: new Date().toISOString(), updated_at: new Date().toISOString()
  }];
  state.nextQuizId = Math.max(0, ...state.quizzes.map(q => Number(q.id) || 0)) + 1;
  return state.quizzes;
}
function json(res, status, body) { res.statusCode=status; res.setHeader('Content-Type','application/json; charset=utf-8'); res.setHeader('Cache-Control','no-store'); res.end(JSON.stringify(body)); }
function parseBody(req) { if(req.body && typeof req.body==='object') return Promise.resolve(req.body); return new Promise((resolve,reject)=>{let raw='';req.on('data',c=>{raw+=c;if(raw.length>10*1024*1024) reject(new Error('Request body too large.'));});req.on('end',()=>{if(!raw)return resolve({});try{resolve(JSON.parse(raw));}catch(e){reject(new Error('Invalid JSON in request body.'));}});req.on('error',reject);}); }
function token(){return crypto.randomBytes(18).toString('hex');}
function pin(){let p;do{p=String(Math.floor(100000+Math.random()*900000));}while(state.games.has(p));return p;}
function quizSummary(q){return {id:q.id,title:q.title,description:q.description||'',question_count:(q.questions||[]).length,created_at:q.created_at,updated_at:q.updated_at};}
function validateQuiz(body){const {title,questions=[]}=body||{};if(!title?.trim())return 'Title is required';if(!questions.length)return 'At least one question required';for(let i=0;i<questions.length;i++){const q=questions[i];if(!q.text?.trim())return `Question ${i+1} has no text`;if(!Array.isArray(q.options)||q.options.length!==4)return `Question ${i+1} needs exactly 4 options`;if(q.options.some(o=>!o?.trim()))return `Question ${i+1} has an empty option`;if(q.correctAnswer==null||q.correctAnswer<0||q.correctAnswer>3)return `Question ${i+1} needs correctAnswer 0–3`;}return null;}
function calcPoints(elapsed,limit){return Math.round(500+500*Math.max(0,1-elapsed/limit));}
function leaderboard(game){return [...game.players.values()].sort((a,b)=>b.score-a.score).slice(0,10).map((p,i)=>({rank:i+1,name:p.name,score:p.score}));}
function playerList(game){return [...game.players.values()].map(p=>({name:p.name,score:p.score}));}
function startQuestion(game){game.currentQuestion+=1;if(game.currentQuestion>=game.quiz.questions.length){game.status='ended';game.endedAt=Date.now();return;}const q=game.quiz.questions[game.currentQuestion];game.status='question';game.questionStartedAt=Date.now();game.questionCounts=[0,0,0,0];game.nextAt=0;for(const p of game.players.values()){p.currentAnswer=null;p.answerResult=null;}}
function endQuestion(game){if(game.status!=='question')return;const q=game.quiz.questions[game.currentQuestion];game.status='leaderboard';game.nextAt=Date.now()+1500;const board=leaderboard(game);game.lastResult={correctAnswer:q.correctAnswer,counts:game.questionCounts,leaderboard:board,isLast:game.currentQuestion>=game.quiz.questions.length-1};for(const p of game.players.values()){const a=p.answers[p.answers.length-1];const rank=board.findIndex(x=>x.name===p.name)+1;p.answerResult={questionIndex:game.currentQuestion,answered:!!a&&a.questionIndex===game.currentQuestion,correct:!!a&&a.questionIndex===game.currentQuestion&&a.correct,points:a&&a.questionIndex===game.currentQuestion?a.points:0,correctAnswer:q.correctAnswer,totalScore:p.score,rank:rank||board.length+1};}}
function advance(game){const now=Date.now();if(game.status==='countdown'&&now>=game.nextAt)startQuestion(game);if(game.status==='question'){const q=game.quiz.questions[game.currentQuestion];const allAnswered=game.players.size>0&&[...game.players.values()].every(p=>p.currentAnswer!==null);if(allAnswered&&now>=game.questionStartedAt+800)endQuestion(game);else if(now>=game.questionStartedAt+(q.timeLimit||20)*1000)endQuestion(game);}if(game.status==='leaderboard'&&game.autoAdvance&&now>=game.nextAt){game.autoAdvance=false;startQuestion(game);}}
function publicQuestion(game,includeAnswer){const q=game.quiz.questions[game.currentQuestion];if(!q)return null;const base={index:game.currentQuestion,total:game.quiz.questions.length,text:q.text,options:q.options,timeLimit:q.timeLimit||20,image:q.image||null};return includeAnswer?{...base,correctAnswer:q.correctAnswer}:base;}
function stateFor(game,session){advance(game);const isHost=game.hostToken===session;const player=[...game.players.values()].find(p=>p.token===session);if(!isHost&&!player)return null;return {role:isHost?'host':'player',pin:game.pin,quizTitle:game.quiz.title,questionCount:game.quiz.questions.length,status:game.status,players:playerList(game),question:game.status==='question'||game.status==='leaderboard'?publicQuestion(game,isHost||game.status==='leaderboard'):null,stats:{counts:game.questionCounts||[0,0,0,0],answered:[...game.players.values()].filter(p=>p.currentAnswer!==null).length,total:game.players.size},result:game.status==='leaderboard'?game.lastResult:null,answerResult:player?.answerResult||null,finalLeaderboard:game.status==='ended'?leaderboard(game):null};}
module.exports={state,loadQuizzes,json,parseBody,token,pin,quizSummary,validateQuiz,calcPoints,leaderboard,playerList,startQuestion,endQuestion,advance,publicQuestion,stateFor};
