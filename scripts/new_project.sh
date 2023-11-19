#!/bin/bash

if [ $# -eq 0 ]; then
  echo "Usage: new_project.sh <name> <owner-id> <supported-versions>"
	exit 1
fi

PROJECT="$1"
OWNER_ID="$2"
DESCRIPTION="A new project"
SUPPORTED_VERSIONS="$3"

wrangler d1 execute DB --command "INSERT INTO projects (user_id, name, description) VALUES ($OWNER_ID, \"$PROJECT\", \"$DESCRIPTION\")"

CREATE_OUTPUT=$(wrangler d1 execute DB --json --command "SELECT project_id from projects WHERE name = '$PROJECT' AND user_id = $OWNER_ID")
PROJECT_ID=$(echo "$CREATE_OUTPUT" | tail -n +3 | jq .[0].results[0].project_id)
echo "Created project $PROJECT_ID"

wrangler d1 execute DB --command "INSERT INTO release_channels (
	project_id,
	name,
	supported_versions,
	dependencies,
	file_naming
) VALUES (
	$PROJECT_ID,
	'Dev',
	'$SUPPORTED_VERSIONS',
	'[]',
	'\$project.jar'
)"
