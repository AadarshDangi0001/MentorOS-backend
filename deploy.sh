#!/bin/bash

set -e

echo "Pulling latest code..."
git pull origin main

echo "Stopping old containers..."
docker compose down

echo "Building and starting containers..."
docker compose up -d --build

echo "Cleaning images..."
docker image prune -f

echo "Deployment successful!"