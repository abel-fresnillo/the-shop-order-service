# the-shop-order-service

Backend service that receives orders from The Shop React frontend, persists them to a Postgres database, and sends an email confirmation via Resend.

## How it works

1. The React frontend POSTs an order (items + quantities + prices) with an API key header.
2. The service validates the payload with Zod, calculates the total, and writes the order to Neon Postgres via Drizzle ORM.
3. A confirmation email is sent to the configured recipient via Resend.
4. Traces, metrics, and logs are shipped to Grafana Cloud via OpenTelemetry.

## API

All endpoints except `/health` require the `x-api-key` header.

### `GET /health`

Returns `{ "status": "ok" }`. No authentication required.

### `POST /orders`

Creates an order and sends a confirmation email.

**Request body:**
```json
{
  "items": [
    { "name": "string", "quantity": 1, "price": 9.99 }
  ]
}
```

| Field | Constraints |
|---|---|
| `items` | 1–100 items |
| `name` | 1–200 characters |
| `quantity` | positive integer, max 1000 |
| `price` | positive number, max 100 000 |

**Responses:**

| Status | Body |
|---|---|
| `201` | `{ "success": true, "orderId": "<uuid>" }` |
| `400` | `{ "success": false, "error": "<validation message>" }` |
| `401` | `{ "success": false, "error": "Unauthorized" }` |
| `429` | `{ "success": false, "error": "Too many requests, please try again later." }` |
| `503` | `{ "success": false, "error": "Failed to save order. Please try again." }` |

## Environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon Postgres connection string |
| `RESEND_API_KEY` | Resend API key for sending email |
| `EMAIL_FROM` | Sender address (e.g. `orders@example.com`) |
| `EMAIL_RECIPIENT` | Address that receives order confirmations |
| `ORDER_API_KEY` | Shared secret for `x-api-key` header (min 32 hex chars) |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed CORS origins |
| `ALLOWED_ORIGIN_PATTERN` | Optional regex to allow additional CORS origins |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Grafana Cloud OTLP endpoint |
| `OTEL_SERVICE_NAME` | Service name reported to Grafana Cloud |
| `GRAFANA_INSTANCE_ID` | Grafana Cloud instance ID (used as OTLP username) |
| `GRAFANA_API_TOKEN` | Grafana Cloud API token |
| `LOKI_HOST` | Loki push endpoint |
| `LOKI_USER` | Loki username |
| `LOG_LEVEL` | Winston log level (e.g. `info`, `debug`) |

## Local development

```bash
cp .env.example .env   # fill in values
npm install
npm run db:push        # push schema to Neon
npm run dev            # starts on http://localhost:3000
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Run with tsx (hot reload via `--env-file`) |
| `npm run build` | Compile TypeScript |
| `npm test` | Run Vitest test suite |
| `npm run test:coverage` | Run tests with V8 coverage report |
| `npm run lint` | ESLint |
| `npm run db:push` | Push Drizzle schema to the database |

## Tech stack

| Concern | Choice |
|---|---|
| Runtime | Node.js 22, TypeScript |
| Framework | Express |
| Validation | Zod |
| Database | Neon Postgres + Drizzle ORM |
| Email | Resend |
| Observability | OpenTelemetry → Grafana Cloud (Tempo, Prometheus, Loki) + Winston |
| Deployment | Vercel (serverless, `api/index.ts` entry point) |
| Testing | Vitest + supertest |

## Security

- **Authentication:** `x-api-key` header checked on every route except `/health`.
- **Rate limiting:** 10 requests per minute per IP.
- **CORS:** Allowlist-based with optional regex pattern for preview URLs.
- **CI scanning:** `npm audit` (high+critical), Snyk SCA + SAST, and Gitleaks secret scan run on every push.

## CI/CD

| Workflow | Trigger | Steps |
|---|---|---|
| CI | push to `development`, PR to `main` | lint → build → test with coverage → security scans |
| Deploy | — | Vercel deployment |
