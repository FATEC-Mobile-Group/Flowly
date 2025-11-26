FROM node:20-alpine AS builde

# Install build dependencies, copy package files and install production deps
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Expose default port used by the app
EXPOSE 5000

# Start the application
CMD ["npm", "start"]

