FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-bookworm-slim
WORKDIR /app
COPY package*.json ./
# bcrypt ships prebuilt binaries; build tools are kept as a fallback for
# platforms without prebuilds (remove for a smaller image if unneeded).
RUN apt-get update -qq && apt-get install -y -qq python3 make g++ >/dev/null \
 && npm install --only=production \
 && apt-get purge -y -qq python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/scripts ./scripts
EXPOSE 3000
CMD ["node", "dist/src/main.js"]
