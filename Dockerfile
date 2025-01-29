FROM node:20-slim

ENV TZ=Europe/Budapest \
    DEBIAN_FRONTEND=noninteractive

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
RUN pnpm exec playwright install chromium
RUN pnpm exec playwright install-deps 

COPY . .

CMD ["pnpm", "start"]
