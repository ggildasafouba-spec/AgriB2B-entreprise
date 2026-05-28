FROM node:20-slim

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npx tsc

EXPOSE 4000

ENV NODE_ENV=production
ENV PRISMA_HIDE_UPDATE_MESSAGE=1
ENV CHECKPOINT_DISABLE=1

ENTRYPOINT []
CMD sh -c "npx prisma migrate deploy; exec node dist/main.js"
