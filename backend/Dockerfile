FROM node:20-slim

RUN apt-get update -y && apt-get install -y openssl dos2unix && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npx tsc

COPY start.sh ./
RUN dos2unix start.sh && chmod +x start.sh

EXPOSE 4000

CMD ["./start.sh"]
