#!/bin/bash

echo "🔍 Checking Docker containers..."
docker-compose ps

echo "🔍 Checking PostgreSQL health..."
docker-compose exec postgres pg_isready -U postgres -d auth-db

echo "🔍 Checking database list..."
docker-compose exec postgres psql -U postgres -d auth-db -c "\l"

echo "🔍 Checking NestJS app..."
curl -s http://localhost:3000 | head -1

echo "🔍 Checking application logs for DB connection..."
docker-compose logs app | grep "database" | tail -5
