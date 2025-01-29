# Use a base image
FROM ubuntu:20.04

# Install Node.js and pnpm dependencies
RUN apt-get update && apt-get install -y curl
RUN apt-get install -y nodejs npm

# Install pnpm and additional dependencies
RUN apt-get install -y libnss3 \
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
    libasound2

# Install pnpm
RUN npm install -g pnpm

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package.json ./

# Install dependencies using pnpm
RUN pnpm install
RUN pnpm exec playwright install

# Copy the rest of the application code
COPY . .

# Start the application
CMD ["pnpm", "start"]
