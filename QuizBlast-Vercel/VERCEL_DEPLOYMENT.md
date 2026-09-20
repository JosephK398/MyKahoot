# QuizBlast — Vercel-only deployment

## What this version uses
- Vercel static hosting for the React/Vite frontend.
- One Vercel Node function at `/api/index.js` for quiz and game APIs.
- `server/data/sampleQuiz.json` is bundled as the initial quiz.
- No Redis, database, Socket.IO server, or other external service.

## Deploy
1. Import this repository/project into Vercel.
2. Keep the project root at the folder containing `vercel.json`.
3. No environment variables are required.
4. Deploy.
5. Test `https://YOUR-DOMAIN.vercel.app/api/health`.
6. Open the site and choose Host → My Quizzes. The bundled sample quiz should load.

## Important limitation: multiplayer
The original app used a persistent Express + Socket.IO process and an in-memory Map. Vercel Functions are serverless and may run on different instances. This version replaces Socket.IO with HTTP commands plus 700ms polling and keeps game state in the function's memory.

That means the app requires NO new service, but multiplayer state is not durable. A Vercel cold start or multiple function instances can create separate in-memory game states. For reliable cross-device production multiplayer, a shared persistent store or realtime service is required. This version is therefore intended for demos/small tests where Vercel happens to route the session to the same warm instance.

## Quiz persistence limitation
The original JSON database wrote to `server/data/quizzes.json`. Vercel's deployment filesystem is not a persistent application database. This version reads the bundled JSON/sample quiz and keeps create/edit/delete changes in memory. Those changes can disappear after a cold start or new deployment.

If you require quizzes and multiplayer games to survive restarts across all Vercel instances, an external persistent store is unavoidable. This package intentionally does not add one because the requirement was to use no new services.
