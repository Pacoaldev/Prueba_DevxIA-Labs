FROM node:22-alpine AS builder
RUN apk add --no-cache openssl ca-certificates
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps --ignore-scripts
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runner
RUN apk add --no-cache openssl ca-certificates
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN npm install --omit=dev --legacy-peer-deps --ignore-scripts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["sh", "-c", "npx prisma db push && npx tsx prisma/seed.ts && node dist/main.js"]
