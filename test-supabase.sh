#!/bin/bash
# Direct Supabase test - bypass browser authentication
# This will test the actual database operations

# Load environment variables from .env file
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/.env" ]; then
  export $(grep -v '^#' "$SCRIPT_DIR/.env" | xargs)
  echo "✓ Loaded environment from .env"
elif [ -f "$SCRIPT_DIR/.env.local" ]; then
  export $(grep -v '^#' "$SCRIPT_DIR/.env.local" | xargs)
  echo "✓ Loaded environment from .env.local"
else
  echo "✗ No .env or .env.local found"
  exit 1
fi

# Check if Supabase URL is set
if [ -z "$VITE_SUPABASE_URL" ]; then
  echo "✗ VITE_SUPABASE_URL not set"
  exit 1
fi

echo "Supabase URL: ${VITE_SUPABASE_URL:0:60}..."
echo ""

# Test 1: Check if profile exists
echo "=== Test 1: Check profile ==="
curl -s "${VITE_SUPABASE_URL}/rest/v1/profiles?email=eq.arjav@eagleinfoservice.com&select=*" \
  -H "apikey: ${VITE_SUPABASE_ANON_KEY}" \
  | head -100
echo ""

# Test 2: Check if user is authenticated (this will fail without proper auth)
echo "=== Test 2: Get user session ==="
curl -s "${VITE_SUPABASE_URL}/auth/v1/user" \
  -H "apikey: ${VITE_SUPABASE_ANON_KEY}" \
  | head -100
echo ""

# Test 3: Check setters table (will fail without admin role)
echo "=== Test 3: Get setters ==="
curl -s "${VITE_SUPABASE_URL}/rest/v1/setters?select=*" \
  -H "apikey: ${VITE_SUPABASE_ANON_KEY}" \
  | head -100
echo ""

echo "=== Tests complete ==="
echo "If Test 3 shows empty array or permission error, admin role is missing"