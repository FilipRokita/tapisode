#!/usr/bin/env bash
set -e

# Local PostgreSQL 17 (Debian's native version, no third-party repo needed).
# Data lives in the container layer, so it is wiped on every rebuild.
sudo apt-get update
sudo DEBIAN_FRONTEND=noninteractive apt-get install -y postgresql-17

# The package creates the cluster but nothing starts it inside a container
bash ".devcontainer/db-start.sh"

# Role + databases the app connects with. The development URL in .env must match
# the first one, and the test run uses the second.
sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='tapisode'" | grep -q 1 \
  || sudo -u postgres psql -c "CREATE ROLE tapisode LOGIN PASSWORD 'tapisode';"
for db in tapisode tapisode_test; do
  sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$db'" | grep -q 1 \
    || sudo -u postgres createdb -O tapisode "$db"
done
