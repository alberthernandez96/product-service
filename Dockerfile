FROM node:20-alpine

# Setup npm auth for private packages
ARG NPM_TOKEN
RUN test -n "$NPM_TOKEN" || (echo "NPM_TOKEN is required" && exit 1)

WORKDIR /app

RUN echo "@albertoficial:registry=https://npm.pkg.github.com" > .npmrc && \
    echo "//npm.pkg.github.com/:_authToken=${NPM_TOKEN}" >> .npmrc

# Copy only package files first
COPY package.json package-lock.json ./

# Install dependencies (ensure private packages are installed)
RUN npm install --legacy-peer-deps

# Verify private packages were installed
RUN test -d node_modules/@albertoficial/backend-shared || (echo "ERROR: backend-shared not installed" && exit 1)
RUN test -d node_modules/@albertoficial/api-contracts || (echo "ERROR: api-contracts not installed" && exit 1)

# Copy source code
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript
RUN npm run build

# Remove dev dependencies and .npmrc
RUN npm prune --production && rm -f .npmrc

ENV NODE_ENV=production
EXPOSE 3005

CMD ["node", "dist/index.js"]
