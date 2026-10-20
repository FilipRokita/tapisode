#!/usr/bin/env bash
set -e

# On every start: bring the database back up.
bash ".devcontainer/db-start.sh"
