FROM node:20-slim

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copier les fichiers de dépendances
COPY package.json ./
RUN npm install

# Générer le client Prisma
COPY prisma ./prisma
RUN npx prisma generate

# Compiler TypeScript
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

EXPOSE 4000

# Appliquer les migrations (tolère l'échec si DB pas prête) puis démarrer
CMD ["sh", "-c", "npx prisma migrate deploy || echo 'Migration skipped' && node dist/main.js"]
