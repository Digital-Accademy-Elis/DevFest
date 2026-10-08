#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
printf '%s\n' '# Telemetria locale del laboratorio' '# Nessun dato lascia questo repository.' > "$ROOT_DIR/data/telemetry.log"
printf '%s\n' 'Telemetria ripristinata. Se il server è attivo, usare anche POST /api/lab/reset per resettare lo stato in memoria.'
