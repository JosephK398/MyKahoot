# QuizBlast Vercel Deployment

This version uses native Vercel Node Functions:
- `/api/health.js` -> `/api/health`
- `/api/quiz.js` -> `/api/quiz` and `/api/quiz/:id`
- `/api/game.js` -> `/api/game`

Quiz data is bundled directly from `server/data/quizzes.json`; no Redis, database, or environment variables are required.

## Deploy
Import the project root into Vercel. Keep the Root Directory at the repository root (the folder containing `vercel.json`, `api/`, `client/`, and `server/`).

## Verify
Open:
- `/api/health`
- `/api/quiz`

`/api/quiz` should return a JSON array of quiz summaries.

## Important multiplayer limitation
Game state uses in-memory serverless state and HTTP polling. It is suitable for demos/testing but is not durable across cold starts or multiple function instances. Durable multiplayer requires shared storage; this version intentionally does not add it.
