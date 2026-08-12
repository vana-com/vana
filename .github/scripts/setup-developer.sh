#!/usr/bin/env bash
# Prepare local developer safeguards; it never starts services or writes config.
set -euo pipefail

repo_root=$(git rev-parse --show-toplevel 2>/dev/null) || {
  printf 'Run this from the repository.\n' >&2
  exit 2
}
for command in docker openssl; do
  command -v "$command" >/dev/null || {
    printf 'Missing required command: %s\n' "$command" >&2
    exit 2
  }
done
docker compose version >/dev/null
exec "$repo_root/.github/scripts/install-evm-key-scan-hook.sh"
