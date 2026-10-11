# Education Center Management — Web

The Next.js web application for ECM includes admin, teacher, and student workflows, gradebooks, assignments, attendance, AI summaries, quizzes, finance, and tuition.

See [the project README](../README.md) for prerequisites, backend configuration, features, and API details.

From this directory:

```sh
npm install
npm run dev
```

Open http://localhost:3000. Configure the backend URL in `src/utils/axiosConfig.ts`; it currently points to the deployed API. For local development, use `http://localhost:8080/api` and allow the web origin in backend CORS. The Axios configuration file is ignored by Git and may need to be restored in a fresh checkout.

Run `npm run lint` to lint, `npm run build` to build, and `npm start` to serve the production build.