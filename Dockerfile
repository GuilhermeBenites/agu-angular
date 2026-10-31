FROM node:20.20.2-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends chromium ca-certificates \
    && apt-get clean && rm -rf /var/lib/apt/lists/*
ENV CHROME_BIN=/usr/bin/chromium NG_CLI_ANALYTICS=false
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit
COPY . .
CMD ["npm", "start", "--", "--host", "0.0.0.0"]
