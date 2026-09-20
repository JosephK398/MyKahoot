const {state,loadQuizzes,json,parseBody,quizSummary,validateQuiz}=require('./lib');
module.exports=async function(req,res){
  if(req.method==='OPTIONS') return res.status(204).end();
  try {
    const quizzes=loadQuizzes();
    const parts=new URL(req.url,'https://quizblast.local').pathname.split('/').filter(Boolean);
    const id=parts.length>2?Number(parts[parts.length-1]):null;
    if(req.method==='GET' && !id) return json(res,200,quizzes.map(quizSummary));
    if(req.method==='GET' && id){const q=quizzes.find(x=>Number(x.id)===id);return q?json(res,200,q):json(res,404,{error:'Quiz not found'});}
    const body=await parseBody(req);
    if(req.method==='DELETE'&&id){const i=quizzes.findIndex(x=>Number(x.id)===id);if(i<0)return json(res,404,{error:'Quiz not found'});quizzes.splice(i,1);return json(res,200,{ok:true});}
    const error=validateQuiz(body);if(error)return json(res,400,{error});
    if(req.method==='POST'&&!id){const now=new Date().toISOString();const q={id:state.nextQuizId++,title:body.title.trim(),description:(body.description||'').trim(),questions:body.questions,created_at:now,updated_at:now};quizzes.push(q);return json(res,201,q);}
    if(req.method==='PUT'&&id){const i=quizzes.findIndex(x=>Number(x.id)===id);if(i<0)return json(res,404,{error:'Quiz not found'});quizzes[i]={...quizzes[i],title:body.title.trim(),description:(body.description||'').trim(),questions:body.questions,updated_at:new Date().toISOString()};return json(res,200,quizzes[i]);}
    return json(res,405,{error:'Method not allowed'});
  } catch(e){ console.error(e); return json(res,500,{error:e.message||'Quiz API error'}); }
};
