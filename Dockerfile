# Use Node.js official image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy application files
COPY . .

# Install dependencies
RUN npm install --production

# Environment variables (can be overridden at runtime)
ENV SERVER_HOST=0.0.0.0
ENV PORT=3000
ENV OLLAMA_HOST=localhost
ENV OLLAMA_PORT=11434

# Expose port
EXPOSE 8000

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Start the application
CMD ["node", "start-server.js"]