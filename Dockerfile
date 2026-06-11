# Use the official Node.js 20 Alpine image as a base
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies (production only to keep image size small)
# Note: Since the app requires 'firebase-admin' which might need some build tools depending on the architecture,
# Alpine is usually fine but sometimes we need to add python/make. If it fails, we will adjust.
RUN npm ci --only=production || npm install --production

# Copy the rest of the application files
COPY . .

# Expose the port the Express server runs on
EXPOSE 3000

# Set Node environment to production
ENV NODE_ENV=production
# Note: You need to provide the .env variables when running the container
# e.g., docker run --env-file .env -p 3000:3000 epik-dunia-studio

# Command to run the application
CMD ["npm", "start"]
