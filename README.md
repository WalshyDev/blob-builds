# Blob Builds

TODO: Add description

## Development

Run `npm run dev` from the root of the repo

### Setup

Once you have cloned the repo, you can setup local development with the following commands:
```
$ npm ci

$ npx wrangler d1 create blob-builds
# Then update the `wrangler.toml` with the new `database_id` provided

# Apply DB migrations in `worker`
$ cd worker && npm run migrate:local

# Seed local dev
$ npm run migrate:seed-local
```
