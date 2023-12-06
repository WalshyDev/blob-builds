# Blob Builds

TODO: Add description

## Development

### Setup

Once you have cloned the repo, you can setup local development with the following commands:
```
$ npm install

$ npx wrangler d1 create blob-builds
# Then update the `wrangler.toml` with the new `database_id` provided

# Apply DB migrations
$ npx wrangler d1 migrations apply DB --local

# Seed local dev
$ npx wrangler d1 execute DB --local --file migrations/seed/seed.sql
```
