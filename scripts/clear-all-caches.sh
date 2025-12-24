#!/bin/bash

# Clear All Build Caches Script
# Usage: ./scripts/clear-all-caches.sh

echo "========================================"
echo "  Clearing All Build Caches"
echo "========================================"
echo ""

# Remove Next.js cache
if [ -d ".next" ]; then
  echo "Removing .next directory..."
  rm -rf .next
  echo "✓ .next removed"
fi

# Remove TypeScript build info
if [ -f ".tsbuildinfo" ]; then
  echo "Removing .tsbuildinfo..."
  rm -f .tsbuildinfo
  echo "✓ .tsbuildinfo removed"
fi

# Remove node_modules cache
if [ -d "node_modules/.cache" ]; then
  echo "Removing node_modules/.cache..."
  rm -rf node_modules/.cache
  echo "✓ node_modules/.cache removed"
fi

# Remove local cache
if [ -d ".local-cache" ]; then
  echo "Removing .local-cache..."
  rm -rf .local-cache
  echo "✓ .local-cache removed"
fi

# Remove Turbopack cache
if [ -d ".turbo" ]; then
  echo "Removing .turbo cache..."
  rm -rf .turbo
  echo "✓ .turbo removed"
fi

echo ""
echo "✓ All caches cleared successfully!"
echo ""

