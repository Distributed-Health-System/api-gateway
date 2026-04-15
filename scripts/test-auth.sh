#!/bin/bash
# Fetches a token from Keycloak and tests the API gateway auth guard.
# Usage: bash scripts/test-auth.sh

KEYCLOAK_URL="http://localhost:8080"
REALM="health-system"
CLIENT_ID="health-system-client"
USERNAME="${1:-testdoctor}"
PASSWORD="${2:-test}"
GATEWAY_URL="http://localhost:3001"

echo "Getting token for $USERNAME..."

TOKEN=$(curl -s -X POST "$KEYCLOAK_URL/realms/$REALM/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password&client_id=$CLIENT_ID&username=$USERNAME&password=$PASSWORD" \
  | python3 -c "import sys,json; data=json.load(sys.stdin); print(data.get('access_token', data))")

if [[ "$TOKEN" == "{"* ]]; then
  echo "Failed to get token: $TOKEN"
  exit 1
fi

echo "Token acquired. Testing gateway..."
echo ""

curl -v "$GATEWAY_URL" -H "Authorization: Bearer $TOKEN"
