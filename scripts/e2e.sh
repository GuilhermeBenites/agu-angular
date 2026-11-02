#!/usr/bin/env bash
set -euo pipefail
front_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
temp_dir="$(mktemp -d "${TMPDIR:-/tmp}/agu-e2e.XXXXXX")"
project="agu-e2e-$$"
alias_name="agu-api-$$"
front_project="${E2E_FRONTEND_PROJECT:-agu-frontend}"
api_ready=0
cloned_backend=0
backend_dir=
cleanup() {
  result=$?
  if [[ "$result" != 0 && "$api_ready" == 1 ]]; then
    mkdir -p "$front_dir/.artifacts"
    HTTP_PORT=0 "${api_compose[@]}" logs --no-color --tail=80 backend nginx > "$front_dir/.artifacts/api-failure.log" 2>&1 || true
    if [[ "${GITHUB_ACTIONS:-false}" == true ]]; then
      while IFS= read -r line; do
        line="${line:0:4000}"
        line="${line//%/%25}"
        printf '::error title=Isolated API log::%s\n' "$line"
      done < <(grep -Ei 'error|critical|denied' "$front_dir/.artifacts/api-failure.log" | tail -n 3)
    fi
  fi
  # Composer runs as container root. Only restore ownership in our disposable clone,
  # so the non-root Linux runner can remove it without changing a caller's checkout.
  if [[ "$api_ready" == 1 && "$cloned_backend" == 1 && "$backend_dir" == "$temp_dir/backend" && -d "$backend_dir/backend/vendor" ]]; then
    HTTP_PORT=0 "${api_compose[@]}" run --rm --no-deps --user 0 backend chown -R "$(id -u):$(id -g)" /var/www/html || true
  fi
  if [[ "$api_ready" == 1 ]]; then
    HTTP_PORT=0 "${api_compose[@]}" down --volumes --remove-orphans >/dev/null 2>&1 || true
  fi
  if [[ "$temp_dir" == */agu-e2e.* ]]; then rm -rf -- "$temp_dir"; fi
}
trap cleanup EXIT
backend_dir="${1:-${E2E_BACKEND_DIR:-}}"
if [[ -z "$backend_dir" ]]; then
  if [[ -z "${E2E_BACKEND_REPOSITORY:-}" || -z "${E2E_BACKEND_REF:-}" ]]; then
    echo 'Provide E2E_BACKEND_DIR, or E2E_BACKEND_REPOSITORY and E2E_BACKEND_REF.' >&2
    exit 1
  fi
  git clone --quiet --filter=blob:none --no-checkout -- "$E2E_BACKEND_REPOSITORY" "$temp_dir/backend"
  git -C "$temp_dir/backend" fetch --quiet --depth=1 origin "$E2E_BACKEND_REF"
  git -C "$temp_dir/backend" checkout --quiet --detach FETCH_HEAD
  backend_dir="$temp_dir/backend"
  cloned_backend=1
fi
backend_dir="$(cd "$backend_dir" && pwd)"
[[ -f "$backend_dir/docker-compose.yml" ]] || { echo 'Backend Compose not found.' >&2; exit 1; }
# Pin the temporary API to its own services and keys, regardless of .env.local in the source.
cat > "$temp_dir/compose.e2e.yml" <<'YAML'
services:
  backend:
    environment:
      APP_ENV: dev
      APP_SECRET: agu-isolated-e2e-only
      DATABASE_URL: 'mysql://agu:agu@mysql_db:3306/agu?serverVersion=8.0&charset=utf8mb4'
      TEST_DATABASE_URL: 'mysql://agu_test:agu_test@mysql_test:3306/agu_test?serverVersion=8.0&charset=utf8mb4'
      CORS_ALLOW_ORIGIN: '^http://localhost:4200$'
      JWT_SECRET_KEY: '/var/www/jwt/private.pem'
      JWT_PUBLIC_KEY: '/var/www/jwt/public.pem'
      JWT_PASSPHRASE: ''
      JWT_TOKEN_TTL: '3600'
      REDIS_URL: 'redis://redis:6379/0?timeout=0.1&read_timeout=0.1&retry_interval=0&lazy=1'
      TASK_CACHE_ENABLED: '1'
      TASK_CACHE_TTL: '30'
    volumes:
      - e2e_jwt:/var/www/jwt
volumes:
  e2e_jwt:
YAML
api_compose=(docker compose -p "$project" -f "$backend_dir/docker-compose.yml" -f "$temp_dir/compose.e2e.yml")
api_ready=1
front_compose=(docker compose -p "$front_project" -f "$front_dir/docker-compose.yml")
mkdir -p "$front_dir/.artifacts"
echo "Isolated API project: $project"
echo "Frontend project: $front_project"
echo "Backend source: $backend_dir"
if revision="$(git -C "$backend_dir" rev-parse --verify HEAD 2>/dev/null)"; then
  echo "Backend revision: $revision (local working tree when E2E_BACKEND_DIR is used)"
else
  echo 'Backend revision: source snapshot without Git metadata'
fi
HTTP_PORT=0 "${api_compose[@]}" build backend >"$temp_dir/backend-build.log" 2>&1 || { tail -n 60 "$temp_dir/backend-build.log"; exit 1; }
api_services=(mysql_db)
has_redis=0
while IFS= read -r service; do
  if [[ "$service" == redis ]]; then api_services+=(redis); has_redis=1; fi
done < <(HTTP_PORT=0 "${api_compose[@]}" config --services)
HTTP_PORT=0 "${api_compose[@]}" up -d --wait "${api_services[@]}"
HTTP_PORT=0 "${api_compose[@]}" run --rm backend composer install --no-interaction --prefer-dist
HTTP_PORT=0 "${api_compose[@]}" run --rm backend php bin/console lexik:jwt:generate-keypair --skip-if-exists
HTTP_PORT=0 "${api_compose[@]}" run --rm backend php bin/console doctrine:migrations:migrate --no-interaction
HTTP_PORT=0 "${api_compose[@]}" up -d --wait backend nginx
"${front_compose[@]}" build frontend >"$temp_dir/frontend-build.log" 2>&1 || { tail -n 60 "$temp_dir/frontend-build.log"; exit 1; }
"${front_compose[@]}" run --rm frontend npm ci --no-audit
"${front_compose[@]}" up -d --force-recreate frontend
api_container="$(HTTP_PORT=0 "${api_compose[@]}" ps -q nginx)"
docker network connect --alias "$alias_name" "${front_project}_default" "$api_container"
for attempt in {1..30}; do
  if "${front_compose[@]}" exec -T frontend node -e 'fetch("http://localhost:4200/assets/config.json").then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))'; then break; fi
  if [[ "$attempt" -eq 30 ]]; then echo 'Frontend did not become ready.' >&2; exit 1; fi
  sleep 1
done
"${front_compose[@]}" exec -T -e "GITHUB_ACTIONS=${GITHUB_ACTIONS:-false}" -e "API_BASE_URL=http://$alias_name/api" -e E2E_BASE_URL=http://localhost:4200 frontend npm run e2e
if [[ "${E2E_VERIFY_REDIS_OUTAGE:-0}" == 1 && "$has_redis" == 1 ]]; then
  key_count="$(HTTP_PORT=0 "${api_compose[@]}" exec -T redis redis-cli DBSIZE)"
  [[ "$key_count" =~ ^[0-9]+$ && "$key_count" -gt 0 ]] || { echo 'Expected populated Redis before the outage test.' >&2; exit 1; }
  echo "Redis keys after the normal E2E: $key_count"
  echo 'Stopping the isolated Redis to verify the full task UI against MySQL fallback.'
  HTTP_PORT=0 "${api_compose[@]}" stop redis
  "${front_compose[@]}" exec -T -e "GITHUB_ACTIONS=${GITHUB_ACTIONS:-false}" -e "API_BASE_URL=http://$alias_name/api" -e E2E_BASE_URL=http://localhost:4200 -e PLAYWRIGHT_HTML_OUTPUT_DIR=/app/playwright-report/redis-outage frontend npm run e2e -- e2e/tasks.spec.ts --output=/app/test-results/redis-outage
  HTTP_PORT=0 "${api_compose[@]}" up -d --wait redis
fi
