# The Shop Order Service

Backend service that receives orders from The Shop React frontend, persists them to a Postgres database, and sends an email confirmation via Resend.

## Overview

The Order Service is a REST API that handles order creation and storage. It is triggered by the storefront on checkout and stores order records in a Postgres database via Drizzle ORM.

## Tech Stack

- **TypeScript** + **Express** for the API
- **Drizzle ORM** + **PostgreSQL** for persistence
- **Resend** for transactional email
- **Vercel** for deployment

## Local Development

```bash
npm install
npm run dev
```

## Links

- [CI Workflow](https://github.com/abel-fresnillo/the-shop-order-service/actions/workflows/ci.yml)
- [Deploy Workflow](https://github.com/abel-fresnillo/the-shop-order-service/actions/workflows/deploy.yml)
