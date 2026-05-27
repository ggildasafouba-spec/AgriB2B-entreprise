#!/bin/bash
set -e

echo "🚀 AgroMarket Enterprise - Setup"
echo "=================================="
echo ""

if [ ! -f .env ]; then
  echo "📝 Creating .env file..."
  cp .env.example .env
  echo "✅ .env file created"
else
  echo "✅ .env file already exists"
fi

echo ""
DOCKER_CMD="docker"
if docker context show >/dev/null 2>&1 && docker --context default info >/dev/null 2>&1; then
  DOCKER_CMD="docker --context default"
  echo "ℹ️ Using Docker context: default"
else
  echo "ℹ️ Using Docker CLI directly"
fi

echo ""
echo "🐳 Starting Docker services..."
$DOCKER_CMD compose -f docker-compose.dev.yml up --build -d

echo ""
echo "✅ Setup complete!"
echo ""
echo "📍 Access the application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend: http://localhost:4000"
echo ""
