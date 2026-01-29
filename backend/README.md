# FlirtKey API Proxy

Lightweight Express server that proxies OpenAI API requests so mobile app users don't need their own API key.

## Features

- **Device-based auth** — users register with a device ID, get a bearer token
- **Per-user usage tracking** — daily request counts persisted to JSON
- **Tiered rate limiting** — free (5/day) vs premium (unlimited)
- **Model restrictions** — only allowed GPT models can be used
- **Admin endpoints** — manage user tiers, view usage stats
- **PM2 ready** — production process management config included

## Quick Start

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your OpenAI key
npm start
```

## PM2 Deployment

```bash
npm install -g pm2
cd backend && npm install
OPENAI_API_KEY=sk-... AUTH_SECRET=your-secret pm2 start ecosystem.config.js
```

## API Endpoints

### `GET /health`

Health check. Returns server status.

### `POST /auth/register`

Register a device and get an auth token.

```json
{ "deviceId": "unique-device-id-at-least-8-chars" }
```

Returns: `{ "token": "...", "userId": "...", "tier": "free", ... }`

### `GET /usage`

Get current usage info. Requires `Authorization: Bearer <token>`.

### `POST /proxy/chat/completions`

Proxy to OpenAI Chat Completions. Requires `Authorization: Bearer <token>`.
Same body as OpenAI's API (`model`, `messages`, `temperature`, `max_tokens`).

### Admin

- `POST /admin/set-tier` — Set user tier. Requires `X-Admin-Key` header.
- `GET /admin/users` — List all users. Requires `X-Admin-Key` header.

## Environment Variables

| Variable         | Required | Default     | Description                   |
| ---------------- | -------- | ----------- | ----------------------------- |
| `OPENAI_API_KEY` | Yes      | —           | Your OpenAI API key           |
| `AUTH_SECRET`    | No       | dev default | Secret for token generation   |
| `PORT`           | No       | 4060        | Server port                   |
| `DATA_DIR`       | No       | `./data`    | Directory for persistent data |
