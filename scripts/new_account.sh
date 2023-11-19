#!/bin/bash

if [ $# -eq 0 ]; then
  echo "Usage: new_account.sh <username>"
	exit 1
fi

USERNAME="$1"
API_TOKEN=$(LC_ALL=C tr -dc A-Za-z0-9 </dev/urandom | head -c 64)

wrangler d1 execute DB --command "INSERT INTO users (name, api_token) VALUES (\"$USERNAME\", \"$API_TOKEN\")"
