#!/bin/bash

# Change to the directory where the script is located (server folder)
cd "$(dirname "$0")"

# Check if .env file exists
if [ ! -f .env ]; then
  echo "Error: .env file not found."
  exit 1
fi

# Update MAINTENANCE_MODE to false using a temporary file for cross-platform support
tmp_file=$(mktemp)
awk '/^MAINTENANCE_MODE=/{print "MAINTENANCE_MODE=false"; next}1' .env > "$tmp_file"
mv "$tmp_file" .env

# If the variable wasn't in the file, append it
if ! grep -q "^MAINTENANCE_MODE=false" .env; then
  echo "MAINTENANCE_MODE=false" >> .env
fi

echo "✅ Maintenance mode is now OFF."
echo "Applying changes to the app container..."
docker compose up -d app

echo "Done!"
