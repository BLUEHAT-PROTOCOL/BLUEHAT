# VOID-X PLATFORM - DOCKERFILE
# Code-Name: VANILLA
# Deployment: Railway.app

FROM node:20-slim

ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    perl \
    libimage-exiftool-perl \
    curl \
    wget \
    git \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp
RUN pip3 install -U yt-dlp --break-system-packages

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy app source
COPY . .

# Build frontend
RUN npm run build

# Create necessary directories
RUN mkdir -p logs uploads downloads server/downloads server/uploads

# Set permissions
RUN chmod -R 755 logs uploads downloads

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
 CMD curl -f http://localhost:3000/api/health || exit 1

# Start command
CMD ["npm", "start"]
