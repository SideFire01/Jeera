# Stage 1: Build the React application
# We use the 'alpine' variant for a smaller image size
FROM node:20-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy package headers first to cache dependencies
COPY package.json package-lock.json ./

# Install dependencies strictly based on lockfile
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the production bundle
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy the built assets from the builder stage to Nginx's default html directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80 to the outside world
EXPOSE 80

# Start Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
