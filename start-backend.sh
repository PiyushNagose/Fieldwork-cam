#!/bin/bash

set -euo pipefail

cd /app/fieldwork-cam

pids=()

start_service() {
  local workspace="$1"
  shift
  env "$@" npm run start --workspace="$workspace" &
  pids+=("$!")
}

shutdown() {
  for pid in "${pids[@]:-}"; do
    kill "$pid" 2>/dev/null || true
  done
}

trap shutdown SIGINT SIGTERM

start_service \
  "auth-service" \
  "PORT=4001" \
  "MONGO_URI=${AUTH_MONGO_URI:-}" \
  "JWT_SECRET=${JWT_SECRET:-}" \
  "RABBITMQ_URL=${RABBITMQ_URL:-}" \
  "APP_WEB_URL=${APP_WEB_URL:-}" \
  "EMAIL_FROM=${EMAIL_FROM:-}" \
  "RESEND_API_KEY=${RESEND_API_KEY:-}" \
  "SMTP_HOST=${SMTP_HOST:-}" \
  "SMTP_PORT=${SMTP_PORT:-}" \
  "SMTP_SECURE=${SMTP_SECURE:-false}" \
  "SMTP_USER=${SMTP_USER:-}" \
  "SMTP_PASS=${SMTP_PASS:-}"
start_service \
  "user-service" \
  "PORT=4002" \
  "MONGO_URI=${USER_MONGO_URI:-}" \
  "JWT_SECRET=${JWT_SECRET:-}" \
  "RABBITMQ_URL=${RABBITMQ_URL:-}" \
  "AUTH_SERVICE_URL=http://127.0.0.1:4001"
start_service \
  "project-service" \
  "PORT=4003" \
  "MONGO_URI=${PROJECT_MONGO_URI:-}" \
  "JWT_SECRET=${JWT_SECRET:-}" \
  "NOTIFICATION_SERVICE_URL=http://127.0.0.1:4004"
start_service \
  "notification-service" \
  "PORT=4004" \
  "MONGO_URI=${NOTIFICATION_MONGO_URI:-}" \
  "JWT_SECRET=${JWT_SECRET:-}" \
  "RABBITMQ_URL=${RABBITMQ_URL:-}" \
  "USER_SERVICE_URL=http://127.0.0.1:4002"
start_service \
  "media-service" \
  "PORT=4005" \
  "MONGO_URI=${MEDIA_MONGO_URI:-}" \
  "JWT_SECRET=${JWT_SECRET:-}" \
  "BASE_URL=${MEDIA_BASE_URL:-}" \
  "UPLOAD_DIR=${UPLOAD_DIR:-uploads}"
start_service \
  "ai-service" \
  "PORT=4006" \
  "MONGO_URI=${AI_MONGO_URI:-}" \
  "JWT_SECRET=${JWT_SECRET:-}" \
  "MEDIA_SERVICE_URL=http://127.0.0.1:4005"
start_service \
  "report-service" \
  "PORT=4007" \
  "MONGO_URI=${REPORT_MONGO_URI:-}" \
  "JWT_SECRET=${JWT_SECRET:-}" \
  "MEDIA_SERVICE_URL=http://127.0.0.1:4005" \
  "PROJECT_SERVICE_URL=http://127.0.0.1:4003"
start_service \
  "billing-service" \
  "PORT=4008" \
  "MONGO_URI=${BILLING_MONGO_URI:-}" \
  "JWT_SECRET=${JWT_SECRET:-}" \
  "PROJECT_SERVICE_URL=http://127.0.0.1:4003" \
  "NOTIFICATION_SERVICE_URL=http://127.0.0.1:4004"
start_service \
  "submission-service" \
  "PORT=4009" \
  "MONGO_URI=${SUBMISSION_MONGO_URI:-}" \
  "JWT_SECRET=${JWT_SECRET:-}" \
  "PROJECT_SERVICE_URL=http://127.0.0.1:4003" \
  "MEDIA_SERVICE_URL=http://127.0.0.1:4005" \
  "NOTIFICATION_SERVICE_URL=http://127.0.0.1:4004"

sleep 3
start_service \
  "api-gateway" \
  "PORT=${PORT:-4000}" \
  "JWT_SECRET=${JWT_SECRET:-}" \
  "APP_WEB_URL=${APP_WEB_URL:-}" \
  "AUTH_SERVICE_URL=http://127.0.0.1:4001" \
  "USER_SERVICE_URL=http://127.0.0.1:4002" \
  "PROJECT_SERVICE_URL=http://127.0.0.1:4003" \
  "NOTIFICATION_SERVICE_URL=http://127.0.0.1:4004" \
  "MEDIA_SERVICE_URL=http://127.0.0.1:4005" \
  "AI_SERVICE_URL=http://127.0.0.1:4006" \
  "REPORT_SERVICE_URL=http://127.0.0.1:4007" \
  "BILLING_SERVICE_URL=http://127.0.0.1:4008" \
  "SUBMISSION_SERVICE_URL=http://127.0.0.1:4009"

wait -n "${pids[@]}"
status=$?

shutdown
wait || true

exit "$status"
