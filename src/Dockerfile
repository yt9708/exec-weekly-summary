FROM node:20-slim AS base

# 安装 Puppeteer 依赖
RUN apt-get update && apt-get install -y \
    chromium \
    libnss3 \
    libnspr4 \
    libatk-bridge2.0-0 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 安装 Node 依赖
COPY package*.json ./
RUN npm install --production

# 复制源码
COPY . .

# 创建必要目录
RUN mkdir -p snapshots logs

# 设置 Puppeteer 使用系统 Chromium
ENV PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

EXPOSE 3457

CMD ["node", "app.js"]
