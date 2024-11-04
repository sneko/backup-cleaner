# backup-cleaner

This library is a cleaner of backups set onto a S3 bucket, it will fit your needs:

- To rationalize backups by having a retention policy
- To be more flexible than just removing backups older than a certain date

[![npm package][npm-img]][npm-url]
[![Build Status][build-img]][build-url]
[![Downloads][downloads-img]][downloads-url]
[![Issues][issues-img]][issues-url]
[![Commitizen Friendly][commitizen-img]][commitizen-url]
[![Semantic Release][semantic-release-img]][semantic-release-url]

## Usage

### Basic

```shell
npx backup-cleaner ...
```

### Avoid command prompts

It's possible to prefill S3 information into environment variables to avoid typing those each time:

- `S3_BUCKET_ENDPOINT`
- `S3_BUCKET_PORT`
- `S3_BUCKET_ACCESS_KEY`
- `S3_BUCKET_SECRET_KEY`

### Use it inside a CI/CD pipeline

For us the best idea is to define a scheduler directly into the pipeline of either your application to back up if it's app-specific, or the global infrasctructure if it's about shared resources.

We provide [a few pipeline examples in to the `examples` folder](./examples/). Feel free to adapt them to your needs.

## Frequently Asked Questions

### Why is specifying patterns mandatory?

Cleaning backups is at risk because you are maybe about deleting the last instance of a specific data. So we prefer to have an explicit whitelist so you are aware of what is on your bucket, instead of providing a default magic that could make a mess.

## Contribute

If you didn't face a specific issue but you are willing to help, please have a look at the reported issues https://github.com/sneko/backup-cleaner/issues. I will do my best to address your work, but keep in mind the maintenance of this project is in my spare time or on the time of other contributors.

### Setup

Make sure to use a Node.js version aligned with one specified into `.nvmrc`. Then:

```shell
npm install
```

Open `.env.local` and fill it with information as for a normal library usage. Then you are able to run:

```shell
docker compose up
npm run cli ...
```

_This will use MinIO as a local S3 server to make your tests._

### Testing

```shell
npm run jest --- --ci --passWithNoTests "./src/core/clean.spec.ts"
```

It would be great while contributing to keep testing things since deletion of backups is at risk.

[build-img]: https://github.com/sneko/backup-cleaner/actions/workflows/ci.yml/badge.svg?branch=main
[build-url]: https://github.com/sneko/backup-cleaner/actions/workflows/ci.yml
[downloads-img]: https://img.shields.io/npm/dt/backup-cleaner
[downloads-url]: https://www.npmtrends.com/backup-cleaner
[npm-img]: https://img.shields.io/npm/v/backup-cleaner
[npm-url]: https://www.npmjs.com/package/backup-cleaner
[issues-img]: https://img.shields.io/github/issues/sneko/backup-cleaner
[issues-url]: https://github.com/sneko/backup-cleaner/issues
[semantic-release-img]: https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg
[semantic-release-url]: https://github.com/semantic-release/semantic-release
[commitizen-img]: https://img.shields.io/badge/commitizen-friendly-brightgreen.svg
[commitizen-url]: http://commitizen.github.io/cz-cli/
