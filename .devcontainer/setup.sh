#!/usr/bin/env bash
set -e

# The app's configuration must exist before the container is built: see README.
if [ ! -f .env ]; then
  echo "Missing .env. Create it first: cp .env.example .env, then fill it in." >&2
  exit 1
fi

# Local PostgreSQL 17 + dev role and databases
bash ".devcontainer/db-setup.sh"

# Dependencies, the browser the end-to-end tests use, and the schema
npm ci
npx playwright install --with-deps chromium
npm run db:migrate
