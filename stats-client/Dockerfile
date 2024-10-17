# Dockerfile for vana-stats-client (build from git)

# Base image
FROM debian:latest

# Install curl, git, and build tools
RUN apt-get update && apt-get install -y curl git build-essential

# Add the Node.js 18.x repository and install Node.js
RUN curl -sL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs

# Create a new user for running the client
RUN adduser --disabled-password --gecos "" vananetintel

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

# Fix permissions for the new user
RUN chown -R vananetintel:vananetintel /home/vananetintel

# Switch to the new user
USER vananetintel

# Expose necessary port
EXPOSE 3000

# Start the app with PM2
CMD ["pm2-runtime", "start", "app.json"]
