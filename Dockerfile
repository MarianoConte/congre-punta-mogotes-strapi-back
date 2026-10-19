# Dockerfile
FROM node:18-bookworm-slim
# Installing libvips-dev for sharp compatibility
RUN apt-get update && apt-get install -y libvips-dev && rm -rf /var/lib/apt/lists/*
# Set environment to production
ENV NODE_ENV=production
# Copy the configuration files
WORKDIR /opt/
COPY ./package.json ./package-lock.json ./
ENV PATH="/opt/node_modules/.bin:$PATH"
# Install dependencies
RUN npm install
# Copy the application files
WORKDIR /opt/app
COPY ./ .
# Build the Strapi application
RUN npm run build
# Expose the Strapi port
EXPOSE 1337
# Start the Strapi application
# El provider de uploads falla si la carpeta no existe, y en un volumen nuevo no existe.
CMD ["sh", "-c", "mkdir -p \"${PUBLIC_DIR:-./public}/uploads\" && exec npm start"]
