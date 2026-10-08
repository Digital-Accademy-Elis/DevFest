#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

node --check server.mjs
node --check public/app.js
node --test tests/health.test.mjs

for artifact in \
  data/seed.json \
  docs/llm-development-notes.md \
  training/registry-metadata.json \
  src/middleware/sanitize.mjs \
  src/services/report-renderer.mjs \
  .github/workflows/ci.yml; do
  test -s "$artifact"
done

printf '%s\n' 'AstraShop Training Lab: verifica locale completata.'
