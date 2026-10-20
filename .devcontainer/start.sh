#!/usr/bin/env bash
set -e

# On every start: bring the database back up,
bash ".devcontainer/db-start.sh"
# apply any new migrations,
npm run db:migrate
# and seed the sandbox template and the dev account the first time (a later start leaves your data alone).
npm run db:seed -- --if-missing
