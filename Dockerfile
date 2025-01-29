# Use a base image
FROM ubuntu:20.04

# Set non-interactive mode to avoid timezone prompt
ENV DEBIAN_FRONTEND=noninteractive \
    TZ=Europe/Budapest \
    NODE_VERSION=latest

# Install required dependencies
RUN apt-get update && apt-get install -y \
    curl \
    tzdata \
    ca-certificates \
    gnupg && \
    ln -fs /usr/share/zoneinfo/$TZ /etc/localtime && \
    echo $TZ > /etc/timezone

# Add NodeSource repository for the latest Node.js version
RUN curl -fsSL https://deb.nodesource.com/setup_current.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Ensure npm is up to date
RUN corepack enable && npm install -g npm

# Enable pnpm using corepack (no need for npm install -g pnpm)
RUN corepack prepare pnpm@latest --activate

# Verify installations
RUN node -v && npm -v && pnpm -v

# Install system dependencies required for Playwright
RUN apt-get update && apt-get install -y \
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
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json ./
RUN pnpm install
RUN pnpm exec playwright install

# Copy the rest of the application code
COPY . .

# Start the application
CMD ["pnpm", "start"]