# RideUp (MERN)

Uber-style ride-booking app: React + Vite + Leaflet map frontend, Express 5 + Mongoose + JWT + Socket.IO backend, MongoDB.

```
backend/    Express API + sockets -> deploy to Railway   (root dir: backend)
frontend/   React SPA             -> deploy to Vercel    (root dir: frontend)
```

## How it works
- **Rider** (`/login`, `/home`): search a pickup and dropoff (autocomplete), see Auto / Car / Moto fares and ETA, book, get a 6-digit PIN, watch the driver on the map, see the receipt.
- **Captain** (`/captain/login`, `/captain/home`): go online, receive live requests (Socket.IO), accept, enter the rider's PIN to start, complete the trip.
- Places: a built-in Navi Mumbai/Mumbai list plus OpenStreetMap Nominatim for any other Indian address. Map tiles: OpenStreetMap. Route lines: OSRM demo server (falls back to a straight line).

To try it alone, open two browser windows (one signed in as a rider, one as a captain with the same vehicle type you book).

## Run locally
```bash
cd backend && cp .env.example .env && npm install && npm start        # :4000
cd frontend && cp .env.example .env && npm install && npm run dev      # :5173
```

## Deploy
**Backend (Railway):** new project from this repo, root directory `backend`. Variables:
`DB_CONNECT` (MongoDB connection string, e.g. Atlas), `JWT_SECRET` (long random string),
`CORS_ORIGIN` (your Vercel URL, e.g. `https://rideup.vercel.app`). Generate a public domain; health check is `/health`.
Socket.IO runs on the same service and port.

**Frontend (Vercel):** import this repo, root directory `frontend` (Vite preset). Variable:
`VITE_API_URL` = the Railway public URL (no trailing slash). `vercel.json` handles SPA routing.
