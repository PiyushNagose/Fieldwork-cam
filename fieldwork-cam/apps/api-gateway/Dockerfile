FROM node:20-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund

COPY src ./src
RUN mkdir -p temp-uploads

EXPOSE 4000

CMD ["npm", "run", "start"]
