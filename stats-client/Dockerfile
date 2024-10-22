# Dockerfile for vana-stats-client (build from git)

# Base image
FROM debian:latest

# Install curl, git, Docker CLI, and build tools
RUN apt-get update && apt-get install -y curl git build-essential docker.io

# Add the Node.js 18.x repository and install Node.js
RUN curl -sL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs

# Set the working directory
WORKDIR /home/vananetintel/vana-stats-client

# Copy the source code into the Docker container
COPY ./ /home/vananetintel/vana-stats-client

# Install dependencies
RUN npm install && \
    npm install -g pm2 && \
    npm install web3@latest && \
    npm install web3-providers-http && \
    npm install web3-providers-ws

# Expose necessary port
EXPOSE 3000

# Start the app with PM2 (run as root user)
CMD ["pm2-runtime", "start", "app.json"]
