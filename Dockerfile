FROM node:20-slim

# Install ClamAV
RUN apt-get update && apt-get install -y \
  clamav \
  clamav-daemon \
  && rm -rf /var/lib/apt/lists/*

# Configure ClamAV daemon
RUN sed -i 's/^User .*$/User root/g' /etc/clamav/clamd.conf && \
  sed -i 's/^LocalSocket .*$/LocalSocket \/var\/run\/clamav\/clamd.ctl/g' /etc/clamav/clamd.conf && \
  mkdir -p /var/run/clamav && \
  chmod 755 /var/run/clamav

# Update virus definitions
RUN freshclam

WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy source code (excluding node_modules due to .dockerignore)
COPY . .

# Install dev dependencies and build
RUN npm install && npm run build && npm prune --production

# Expose API port
EXPOSE 3000

# Create startup script
RUN echo '#!/bin/sh\nservice clamav-daemon start\nnpm start' > /start.sh && \
  chmod +x /start.sh

# Start the service
CMD ["/start.sh"] 