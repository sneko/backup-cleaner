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

### Context

1. **A deletion tool must be used with caution! The maintainers cannot be responsible for any data loss**
2. We call a group pattern a regular expression that matches backups from the same origin but at different times, the calculation will be done for each group. **It's important to have precise group patterns so it does not mix 2 different kind of backups** _(let's say an overlap of backups for databases A and B)_ _(as regular expressions you can use all symbols to like the start of the file name with `^`, the end with `$`... and the normal dots must be escaped)_
3. The backup reference date is the base for the library to calculate what needs to be cleaned up
4. We advise you to run first the library interactively with the parameter `--dry-run` to adjust settings as you are expecting

### Using as date the timestamp from the file name

```shell
npx backup-cleaner clean --date-marker name --group-pattern "database-AAA-backup-\d+\.sql\.gz" --group-pattern "^subfolder/database-BBB-backup-\d+\.sql\.gz$"
```

This will match backups:

1. For database `AAA` having the pattern `database-AAA-backup-1726750074.sql.gz` in any folder
2. For database `BBB` having the pattern `subfolder/database-AAA-backup-1726750074.sql.gz` _(in this specific subfolder, no prefix of suffix possible)_

### Using as date the last modified property

**It's important to note that in the S3 standard there is no `createdAt` property, there is only the `lastModified` one. Use it with caution because this date can be updated if you use versioning, or in case of a metadata modification depending on your S3 provider.** _(If you have a doubt, try to make your backups having the date in the file name, while adopting the 1st approach)_

```shell
npx backup-cleaner clean --date-marker metadata --group-pattern "database-backup-.*\.sql\.gz"
```

This will make a group for backups having the pattern `database-backup-RANDOM-DYNAMIC-STRING.sql.gz` in any folder.

### Avoid command prompts

It's possible to prefill S3 information into environment variables to avoid typing those each time:

- `S3_BUCKET_ENDPOINT`
- `S3_BUCKET_PORT`
- `S3_BUCKET_REGION`
- `S3_BUCKET_ACCESS_KEY`
- `S3_BUCKET_SECRET_KEY`
- `S3_BUCKET_NAME`

_If you don't use SSL to connect to your S3 server, you can use `S3_BUCKET_USE_SSL=false` to disable the default._

### Use it inside a CI/CD pipeline

For us the best idea is to define a scheduler directly into the pipeline of either your application to back up if it's app-specific, or the global infrasctructure if it's about shared resources.

We provide [a few pipeline examples into the `examples` folder](./examples/). Feel free to adapt them to your needs.

## Frequently Asked Questions

### How to customize the retention rules?

The easiest way is to look at the CLI documentation with `npx backup-cleaner --help`.

### What are daily/weekly/monthly/yearly periods?

It keeps one backup per range (daily/weekly/...), over N periods in the past.

_For example: `--dailyPeriod 7`, it will keep one backup per day, over 7 days in the past._

It you set a range period to 0, it means this range won't be taken into account.

### Why is specifying patterns mandatory?

Cleaning backups is at risk because you are maybe about deleting the last instance of a specific data. So we prefer to have an explicit whitelist so you are aware of what is on your bucket, instead of providing a default magic that could make a mess.

### What rights to give to the S3 user?

We advise you to allow the minimum. In our case only `ListObjects` and `PutObject` are needed.

_Note: some S3 providers are not having granular scopes, and only allow `READ/READ+WRITE/WRITE`. In this case, you have to use `READ+WRITE`._

### Does the library manage chunked backups?

The library cannot manage for now the logic of a backup being splitted up into for example:

- `db-backup.part1.tar.gz`
- `db-backup.part2.tar.gz`

If you set a group pattern to match them at once, it will consider the first of the day, so most of the time `part1` will be kept whereas `part2` will be cleaned.

If it's an expected feature please open an issue.

### Does the library manage dates in the name not being UNIX format?

For now it only recognizes for example `backup-1726750074.tar.gz` as a valid date. It won't work for `backup-YYYY-MM-DD.tar.gz`.

If it's an expected feature please open an issue.

## Contribute

If you didn't face a specific issue but you are willing to help, please have a look at the [reported issues](https://github.com/sneko/backup-cleaner/issues). I will do my best to address your work, but keep in mind the maintenance of this project is in my spare time or on the time of other contributors.

### Setup

Make sure to use a Node.js version aligned with the one specified into `.nvmrc`, and use a local S3 server:

```shell
npm install
docker compose up
npm run cli --- clean ...
```

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
