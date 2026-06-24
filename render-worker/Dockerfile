FROM mcr.microsoft.com/playwright:v1.61.1-noble

WORKDIR /app

ENV SKIP_PLAYWRIGHT_BROWSER_DOWNLOAD=1
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY scripts ./scripts

CMD ["npm", "start"]
