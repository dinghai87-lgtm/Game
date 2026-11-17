# © 2026 万泰游戏开发 Wantai Game Development
# Lucky Vault server image. Build:  docker build -t luckyvault .
# Data (SQLite database, admin password, backups) lives in /app/data — mount a volume there.
FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund || true
COPY server.js ./
COPY lib ./lib
COPY public ./public
COPY CHANGELOG.md COPYRIGHT.txt README.md ./
ENV NODE_ENV=production PORT=8080 TRUST_PROXY=1
EXPOSE 8080
VOLUME ["/app/data"]
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://127.0.0.1:8080/api/health || exit 1
CMD ["node", "server.js"]
