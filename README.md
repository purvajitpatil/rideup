# RideUp (MERN)

Ride-booking app from the WT practicals: React + Vite + Axios frontend, Express 5 + Mongoose + JWT backend, MongoDB.

```
backend/    Express API  -> deploy to Railway   (root dir: backend)
frontend/   React SPA    -> deploy to Vercel    (root dir: frontend)
```

## Run locally
```bash
cd backend && cp .env.example .env && npm install && npm start        # :4000
cd frontend && cp .env.example .env && npm install && npm run dev      # :5173
```

## Deploy
**Backend (Railway):** new project from this repo, root directory `backend`. Variables:
`DB_CONNECT` (MongoDB connection string, e.g. Atlas), `JWT_SECRET` (long random string),
`CORS_ORIGIN` (your Vercel URL, e.g. `https://rideup.vercel.app`). Generate a public domain; health check is `/health`.

**Frontend (Vercel):** import this repo, root directory `frontend` (Vite preset). Variable:
`VITE_API_URL` = the Railway public URL (no trailing slash). `vercel.json` handles SPA routing.
