FROM node:22-bookworm-slim

ENV NODE_ENV=production

WORKDIR /app

# Манифесты копируются отдельно: слой с зависимостями переиспользуется,
# пока package.json и package-lock.json не менялись.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY . .

# Каталог загрузок должен быть доступен на запись пользователю,
# под которым идёт процесс (в него монтируется volume).
RUN mkdir -p uploads && chown -R node:node uploads

# Не работаем под root.
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "require('http').get('http://127.0.0.1:3000/', r => process.exit(r.statusCode < 500 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "server.js"]
