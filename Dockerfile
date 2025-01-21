FROM arm64v8/node:18

RUN apt update && apt install -y \
  chromium-browser \
  libnss3 \
  libxss1 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libdrm2 \
  libxcomposite1 \
  libgbm1 \
  libasound2 \
  libpangocairo-1.0-0 \
  libcups2 && \
  rm -rf /var/lib/apt/lists/*

RUN npm install puppeteer

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

CMD ["node"]