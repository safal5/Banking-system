# Ledger frontend

React + Vite interface for the backend-ledger API.

## Run locally

1. Start the backend from the repository root with `npm run dev` (API at `http://localhost:3000`).
2. In `frontend/`, copy `.env.example` to `.env` if the API uses a different URL.
3. Run `npm install`, then `npm run dev` and open the URL Vite prints (normally `http://localhost:5173`).

The frontend uses the backend's cookie session, so the API's `FRONTEND_ORIGINS` setting must include the frontend origin when it differs from the local default. The UI supports registration, sign-in, account creation, balance lookup, and transfers. Initial funding remains on the backend's system-user-only endpoint. Transaction history is not shown because the API does not currently expose a history route.
