# Build Stage
FROM mcr.microsoft.com/devcontainers/javascript-node:1-22-bullseye AS build-stage

ARG COMMIT_SHA=dev
ENV VITE_COMMIT_SHA=$COMMIT_SHA

WORKDIR /app
# Copy the rest of the application files to the working directory
COPY . .
# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Use Yarn version from package.json (Berry); image ships Yarn 1 by default
RUN corepack enable
RUN yarn install

# Build the React application
RUN yarn build

# Production Stage
FROM nginx:latest

# Copy the NGINX configuration file
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the build artifacts from the build stage to NGINX web server
COPY --from=build-stage /app/dist/ /usr/share/nginx/html

# We need to make sure not to run the container as a non root user
# for better security
WORKDIR /app
RUN chown -R nginx:nginx /app && chmod -R 755 /app && \
        chown -R nginx:nginx /var/cache/nginx && \
        chown -R nginx:nginx /var/log/nginx && \
        chown -R nginx:nginx /etc/nginx/conf.d
RUN touch /var/run/nginx.pid && \
        chown -R nginx:nginx /var/run/nginx.pid

USER nginx

# Expose port 80 for the NGINX server
EXPOSE 80

# Command to start NGINX when the container is run
CMD ["nginx", "-g", "daemon off;"]