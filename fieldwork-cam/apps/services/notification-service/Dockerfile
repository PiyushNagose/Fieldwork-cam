FROM node:20-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production

COPY fieldwork-cam/package*.json ./
COPY fieldwork-cam/apps/services/notification-service/package.json ./apps/services/notification-service/package.json
COPY fieldwork-cam/packages/shared-events/package.json ./packages/shared-events/package.json
RUN npm install --workspace=notification-service --omit=dev --no-audit --no-fund

COPY fieldwork-cam/apps/services/notification-service/src ./apps/services/notification-service/src
COPY fieldwork-cam/packages/shared-events/src ./packages/shared-events/src

WORKDIR /app/apps/services/notification-service

EXPOSE 4004

CMD ["npm", "run", "start"]
