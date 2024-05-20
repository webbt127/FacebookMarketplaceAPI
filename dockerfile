# Use the official Node.js image as the base image
FROM node:16

# Create and set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install Puppeteer dependencies and project dependencies
# --unsafe-perm is required for Puppeteer to work properly in some environments
RUN npm install --unsafe-perm

# Install additional dependencies for Puppeteer
RUN apt-get update && apt-get install -y \
  ca-certificates \
  fonts-liberation \
  libappindicator3-1 \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libdbus-1-3 \
  libgdk-pixbuf2.0-0 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libx11-xcb1 \
  lsb-release \
  xdg-utils \
  libgbm1 \
  && rm -rf /var/lib/apt/lists/*

# Copy the rest of the application files
COPY . .

# Expose the port that your application will run on (if applicable)
# EXPOSE 3000

# Command to run the script
CMD ["npm", "start"]
