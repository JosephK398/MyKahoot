const { json } = require('./lib');
module.exports = function(req,res){ if(req.method==='OPTIONS') return res.status(204).end(); json(res,200,{status:'ok',storage:'bundled-json',multiplayer:'serverless-memory'}); };
