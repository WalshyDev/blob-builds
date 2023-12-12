---
title: API
description: Documentation around interacting with the API.
---

The API is located at `https://blob.build/api`.

Throughout this documentation, optional fields will be marked with a `?` at the end of the type. Nullable fields will have a `null` type in the schema.

## API format

All API responses will be returned in the format of:
```json
{
	// This indicates if the API request succeeded or not
	"success": boolean,

	// - If success is true:
	// Contains a message
	"message": string?,
	// Contains the data or null if there is no data to be returned
	"data": object | null?,

	// - If success is false:
	// Contains an error message explaining the failure
	// This is not considered stable and should not be used to check for a specific error
	"error": string?,
	// Contains an error code, these can be considered stable
	// If you want to check for specific errors, please use the code and not the message!
	"code": number?
}
```

## Authentication

Authentication to the API is done through API tokens. Currently, account creation does not exist. Contact Walshy or Jeff to get an account and API token.

With the API token, you can pass it into the `Authorization` header as a Bearer token.
Example:
```sh
curl https://blob.build/api/projects \
	-H 'Authorization: Bearer <API_TOKEN>'
```
