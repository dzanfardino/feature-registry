# Contributing

Thank you for contributing to Feature Registry.

## Requirements

- Node.js 20 or later
- Docker (for the local PostgreSQL instance)

## Setup

```bash
git clone <repository-url>
cd feature-registry
cp .env.example .env
docker compose up -d
npm install
npm run build -w @feature-registry/shared
npm run seed
```

Run the API and web app in two terminals:

```bash
npm run dev:api
npm run dev:web
```

## Checks

```bash
npm run lint
npm test
```

Please keep all source, comments, and documentation in English.

## Pull requests

1. Open a branch from `main`.
2. Keep changes focused.
3. Ensure lint and tests pass.
4. Describe the motivation and how you verified the change.
