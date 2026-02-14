#!/bin/bash

# Deployment Script for Chabaqa Frontend

# 1. Stop existing containers
echo "Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down

# 2. Pull latest changes (assuming git is initialized)
# echo "Pulling latest changes..."
# git pull origin main

# 3. Build the Docker image
echo "Building Docker image..."
# You can pass build args here if needed
docker-compose -f docker-compose.prod.yml build

# 4. Start the container in detached mode
echo "Starting container..."
docker-compose -f docker-compose.prod.yml up -d

# 5. Prune unused images to save space
echo "Cleaning up..."
docker image prune -f

echo "Deployment complete! Frontend is running on port 8080."
