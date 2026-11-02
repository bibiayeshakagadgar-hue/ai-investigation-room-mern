# Server setup

Create `server/.env` with `MONGODB_URI`, `PORT`, and a random `SESSION_SECRET` of at least 32 characters. `server/.env.example` shows the variable names. Keep this file private and do not copy its values into the client.

Run the API from `server` with `npm start` or `npm run dev`. The MongoDB connection is also used to store sessions. The health endpoint remains `GET /health`.

Run the React client from `client` with `npm run dev`; it proxies API requests to `http://localhost:5000`. Visit `http://localhost:5173`, choose **Create an account**, and submit an email plus a password of at least 12 characters. Registration signs you in. Sign out and use the same email and password to test login.

Run backend tests with `cd server && npm test`. The tests use in-memory model doubles and do not create accounts or cases in Atlas.

## Authentication API

- `POST /api/auth/register` with `{ "email": "investigator@example.com", "password": "at-least-12-chars" }`
- `POST /api/auth/login` with the same fields
- `GET /api/auth/me` to check the current session
- `POST /api/auth/logout` to end the session

Registration and login set an HTTP only, same-site session cookie. Keep the browser's cookies enabled and use HTTPS in deployed environments. Passwords are hashed with bcrypt; the database stores only the hash. Authentication attempts are limited per process and IP address.

Protected case endpoints are under `/api/cases`. The server takes the owner from the authenticated session and scopes case queries to that owner. Supported status values are `open`, `in_progress`, and `closed`; priorities are `low`, `medium`, `high`, and `critical`.

This is a prototype session setup. Before production, configure HTTPS and proxy trust carefully, use a strong private session secret, review cross-site request protections and account recovery, monitor and distribute rate limits across instances, and establish secret rotation and session revocation procedures.
