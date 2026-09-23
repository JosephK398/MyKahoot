# QuizBlast — Vercel-only build

This version is designed to deploy directly to Vercel with **no Redis, database, Socket.IO server, or other external service**.

## Deployment

- Vercel project root: this directory
- Build command: `npm run build`
- Output directory: `client/dist`
- No environment variables required

The API is implemented by `api/index.js` and serves:

- `GET /api/health`
- `GET/POST /api/quiz`
- `GET/PUT/DELETE /api/quiz/:id`
- `GET/POST /api/game`

Quiz data is bundled in `server/data/quizzes.json`.

## Important limitation

Vercel Functions are serverless. They do not provide a permanent writable local database and do not guarantee that all requests will use the same warm function instance.

Therefore:

- Bundled quiz data loads reliably from the deployment.
- Quiz create/edit/delete changes are held in function memory and can disappear after a cold start or deployment.
- Multiplayer game state is held in function memory and is therefore suitable for demos/testing but is **not guaranteed for production cross-device multiplayer**.

The frontend replaces Socket.IO with HTTP commands plus 700ms polling so it can run as a Vercel-only application.

For durable production multiplayer, a shared persistent store is technically required. This version intentionally does not add one.

## Separate Host and Player Links

Use `/host` for the host dashboard and `/join` for players. Share only the `/join` URL with players.
