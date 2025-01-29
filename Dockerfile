FROM ubuntu:20.04

ENV DEBIAN_FRONTEND=noninteractive \
    TZ=Europe/Budapest

RUN apt-get update && apt-get install -y \
    curl \
    tzdata \
    nodejs \
    npm \
    libnss3 \
    libnspr4 \
    libdbus-1-3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libatspi2.0-0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libxkbcommon0 \
    libasound2 && \
    ln -fs /usr/share/zoneinfo/$TZ /etc/localtime && \
    echo $TZ > /etc/timezone && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

RUN npm install -g pnpm

WORKDIR /app

COPY package.json ./
RUN pnpm install
RUN pnpm exec playwright install

COPY . .

CMD ["pnpm", "start"]