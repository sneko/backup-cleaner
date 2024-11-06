/**
 * @jest-environment node
 */
import { getUnixTime, parseISO } from 'date-fns';
import { Client } from 'minio';

import { clean, listFiles } from '@buc/src/core/clean';
import { datesBeforeClean, datesDeletedAfterClean } from '@buc/src/fixtures/dates';
import { ensureS3BucketConfig } from '@buc/src/utils/environment';
import { MinioContainer, setupMinio } from '@buc/src/utils/minio';

describe('minio', () => {
  let minio: MinioContainer;
  let minioClient: Client;
  const bucketName = 'test';

  beforeAll(async () => {
    minio = await setupMinio();

    // Prepare environment variables for running the CLI command directly
    // Note: finally not used since customizing the reference date through the CLI would be a huge workaround
    process.env.S3_BUCKET_ENDPOINT = minio.bucket.endpoint;
    process.env.S3_BUCKET_PORT = minio.bucket.port.toString();
    process.env.S3_BUCKET_USE_SSL = minio.bucket.useSsl.toString();
    process.env.S3_BUCKET_ACCESS_KEY = minio.bucket.accessKey;
    process.env.S3_BUCKET_SECRET_KEY = minio.bucket.secretKey;
    process.env.S3_BUCKET_NAME = bucketName;

    minioClient = new Client({
      endPoint: minio.bucket.endpoint,
      port: minio.bucket.port,
      useSSL: minio.bucket.useSsl,
      accessKey: minio.bucket.accessKey,
      secretKey: minio.bucket.secretKey,
    });
  }, 30 * 1000);

  afterAll(async () => {
    if (minio) {
      await minio.container.stop();
    }
  }, 30 * 1000);

  describe('test end-to-end', () => {
    it('populate with backups', async () => {
      await minioClient.makeBucket(bucketName);

      // Same combination test than within `src/core/clean.spec.ts`
      await Promise.all(
        datesBeforeClean.map((date) => {
          return minioClient.putObject(bucketName, `backup-${getUnixTime(date)}.sql.gz`, '');
        })
      );

      const files = await listFiles(minioClient, bucketName);

      expect(files.length).toBe(29);
    });

    it('clean backups', async () => {
      // Needed to load sensible environment variables
      await ensureS3BucketConfig(false);

      // We use the name date marker to easily set it (because the object metadata one is the MinIO internal logic)
      // Note: we do not use direct CLI command because it would have to let the user the ability to set the reference date
      await clean({
        referenceDate: parseISO('2024-01-13'),
        groupPatterns: [new RegExp('backup-\\d+\\.sql\\.gz')],
        dateMarker: 'name',
        dailyPeriod: 7,
        weeklyPeriod: 4,
        monthlyPeriod: 12,
        yearlyPeriod: 2,
        skipRecentDays: 1,
        dryRun: false,
      });

      // Then check they have been removed
      const remainingFiles = await listFiles(minioClient, bucketName);

      for (const remainingFile of remainingFiles) {
        expect(
          datesDeletedAfterClean.find((date) => {
            // Look for the date into the file name
            return remainingFile.name.includes(getUnixTime(date).toString());
          })
        ).toBeUndefined();
      }
    });
  });
});
