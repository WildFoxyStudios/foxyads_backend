FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY bun.lockb ./

# Install dependencies (using npm since bun might not be in standard node image, or use oven/bun image)
# Let's use a standard node image and install dependencies with npm or bun if verified.
# The user uses bun locally. Let's try to use bun in docker for consistency or stick to npm if package-lock is present.
# The user has package-lock.json (saw it in file list earlier).
# Let's use standard Node.js and npm for stability on Render unless user specifically wants Bun.
# Actually, the user ran 'bun install' earlier. 
# Let's use base image 'oven/bun' to match local environment.

FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install

COPY . .

EXPOSE 3000

CMD ["bun", "run", "start"]
