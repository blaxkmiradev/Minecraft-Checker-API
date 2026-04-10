#!/bin/bash

API_URL="http://localhost:3000"

check_player() {
    local username="$1"
    response=$(curl -s -w "\n%{http_code}" "${API_URL}/api/check/${username}")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" -eq 200 ]; then
        echo "Player: $username"
        echo "$body" | jq '.'
    else
        echo "Error checking $username (HTTP $http_code)"
        echo "$body"
    fi
}

if [ -z "$1" ]; then
    echo "Usage: $0 <username>"
    exit 1
fi

check_player "$1"