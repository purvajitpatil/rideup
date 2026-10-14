# RideUp (MERN)

Uber-style ride-booking app: React + Vite + Leaflet map frontend, Express 5 + Mongoose + JWT + Socket.IO backend, MongoDB.

```
backend/    Express API + sockets -> deploy to Render   (root dir: backend)
frontend/   React SPA             -> deploy to Vercel    (root dir: frontend)
```

## How it works
- **Rider** (`/login`, `/home`): search a pickup and dropoff (autocomplete), see Auto / Car / Moto fares and ETA, book, get a 6-digit PIN, watch the driver on the map, see the receipt.
- **Captain** (`/captain/login`, `/captain/home`): go online, receive live requests (Socket.IO), accept, enter the rider's PIN to start, complete the trip.
- Places: a built-in Navi Mumbai/Mumbai list plus OpenStreetMap Nominatim for any other Indian address. Map tiles: CARTO/OpenStreetMap. Route lines: OSRM demo server (falls back to a straight line).

To try it alone, open two browser windows (one signed in as a rider, one as a captain with the same vehicle type you book).

## Run locally
```bash
cd backend && cp .env.example .env && npm install && npm start        # :4000
cd frontend && cp .env.example .env && npm install && npm run dev      # :5173
```

## Deploy
**Backend (Render):** new web service from this repo, root directory `backend`. Variables:
`DB_CONNECT` (MongoDB Atlas connection string), `JWT_SECRET` (long random string),
`CORS_ORIGIN` (your Vercel URL, e.g. `https://rideup.vercel.app`). Health check is `/health`.
Socket.IO runs on the same service and port.

**Frontend (Vercel):** import this repo, root directory `frontend` (Vite preset). Variable:
`VITE_API_URL` = the Render public URL (no trailing slash). `vercel.json` handles SPA routing.

## MongoDB Atlas
Create a database user (`rideup_app_user`) and add the Render service IP to the network access list (or allow `0.0.0.0/0` for a demo). The connection string format:

```
mongodb+srv://<username>:<password>@cluster0.mongodb.net/rideup?retryWrites=true&w=majority
```