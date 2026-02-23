# ── Stage 1: deps ─────────────────────────────────────────────────────────────
# Use Debian-slim (NOT alpine) — Puppeteer needs glibc + shared libs
FROM node:20-slim AS deps

WORKDIR /app
COPY package.json ./
RUN npm install --production

# ── Stage 2: runtime ──────────────────────────────────────────────────────────
FROM node:20-slim

# Install Chromium + all libs whatsapp-web.js / Puppeteer needs + poppler for PDF extraction
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    fonts-noto-color-emoji \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    libxss1 \
    xdg-utils \
    poppler-utils \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Tell Puppeteer to use the system Chromium (skip its own download)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Copy deps from stage 1
COPY --from=deps /app/node_modules ./node_modules
COPY server.js ./

# Create ALL dirs the app needs and give node user full ownership BEFORE
# switching user — once we're USER node we can't chown anything.
RUN mkdir -p /app/.wwebjs_auth /app/.wwebjs_cache \
    && chown -R node:node /app

# Run as non-root (required for Chromium --no-sandbox to work safely)
USER node

EXPOSE 8103
CMD ["node", "server.js"]