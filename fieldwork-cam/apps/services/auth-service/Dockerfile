FROM node:20-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production

COPY fieldwork-cam/package*.json ./
COPY fieldwork-cam/apps/services/auth-service/package.json ./apps/services/auth-service/package.json
COPY fieldwork-cam/packages/shared-events/package.json ./packages/shared-events/package.json
RUN npm install --workspace=auth-service --omit=dev --no-audit --no-fund

COPY fieldwork-cam/apps/services/auth-service/src ./apps/services/auth-service/src
COPY fieldwork-cam/packages/shared-events/src ./packages/shared-events/src

WORKDIR /app/apps/services/auth-service

EXPOSE 4001

CMD ["npm", "run", "start"]
