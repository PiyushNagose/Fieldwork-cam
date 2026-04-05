FROM node:20-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production

COPY fieldwork-cam/package*.json ./
COPY fieldwork-cam/apps/services/user-service/package.json ./apps/services/user-service/package.json
COPY fieldwork-cam/packages/shared-events/package.json ./packages/shared-events/package.json
RUN npm install --workspace=user-service --omit=dev --no-audit --no-fund

COPY fieldwork-cam/apps/services/user-service/src ./apps/services/user-service/src
COPY fieldwork-cam/packages/shared-events/src ./packages/shared-events/src

WORKDIR /app/apps/services/user-service

EXPOSE 4002

CMD ["npm", "run", "start"]
