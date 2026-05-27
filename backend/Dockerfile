# ═══════════════════════════════════════════════════════════════════════════════
# AgriB2B Backend — Dockerfile Production (Railway / Docker)
# ═══════════════════════════════════════════════════════════════════════════════

FROM node:20-slim AS builder

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Installer les dépendances
COPY package.json package-lock.json ./
RUN npm ci

# Générer le client Prisma
COPY prisma ./prisma
RUN npx prisma generate

# Compiler TypeScript
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ── Image de production ───────────────────────────────────────────────────────
FROM node:20-slim AS runner

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app
ENV NODE_ENV=production

# Copier uniquement ce qui est nécessaire
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./

EXPOSE 4000

# Appliquer les migrations puis démarrer le serveur
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
