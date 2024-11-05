import { parseISO } from 'date-fns';
import { secondsToMilliseconds } from 'date-fns/secondsToMilliseconds';
import { Client } from 'minio';

import { extractDateFromFilename, getFilesToDeleteFromGroup, listFiles, makeGroupsFromFiles } from '@buc/src/core/clean';

const describeWhenManual = process.env.TEST_MANUAL === 'true' ? describe : describe.skip;
const itWhenManual = process.env.TEST_MANUAL === 'true' ? it : it.skip;

describeWhenManual('listFiles()', () => {
  const bucketName = 'test';
  let minioClient: Client;

  beforeAll(async () => {
    minioClient = new Client({
      endPoint: 'localhost',
      port: 9000,
      useSSL: false,
      accessKey: 'random-key',
      secretKey: 'random-key',
    });

    if (!(await minioClient.bucketExists(bucketName))) {
      await minioClient.makeBucket(bucketName);
      await minioClient.putObject(bucketName, 'random/test.txt', 'test');
    }
  });

  afterAll(async () => {
    if (minioClient) {
      await minioClient.removeObject(bucketName, 'random/test.txt');
      await minioClient.removeBucket(bucketName);
    }
  });

  it(
    'should return a response',
    async () => {
      const files = await listFiles(minioClient, bucketName);

      expect(files).toStrictEqual([
        {
          name: 'random/test.txt',
          date: expect.any(Date),
        },
      ]);
    },
    secondsToMilliseconds(20)
  );
});

describe('makeGroupsFromFiles()', () => {
  it('should detect correct groups', () => {
    const groupedFiles = makeGroupsFromFiles(
      [
        'data/backups/mytool/mytool-db/pg-dump-mytool-1726750074.dmp',
        'data/backups/mytool/mytool-db/pg-dump-mytool-1727222402.dmp',
        'data/backups/databases/postgresql-database/pg-dump-postgres-1730332802.dmp',
        'data/backups/databases/postgresql-database/pg-dump-postgres-1730419202.dmp',
      ].map((filepath) => {
        return { name: filepath, date: new Date() };
      }),
      [
        new RegExp('data/backups/mytool/mytool-db/pg-dump-mytool-\\d+\\.dmp'),
        new RegExp('data/backups/databases/postgresql-database/pg-dump-postgres-\\d+\\.dmp'),
      ]
    );

    expect(groupedFiles).toStrictEqual([
      [
        {
          name: 'data/backups/mytool/mytool-db/pg-dump-mytool-1726750074.dmp',
          date: expect.any(Date),
        },
        {
          name: 'data/backups/mytool/mytool-db/pg-dump-mytool-1727222402.dmp',
          date: expect.any(Date),
        },
      ],
      [
        {
          name: 'data/backups/databases/postgresql-database/pg-dump-postgres-1730332802.dmp',
          date: expect.any(Date),
        },
        {
          name: 'data/backups/databases/postgresql-database/pg-dump-postgres-1730419202.dmp',
          date: expect.any(Date),
        },
      ],
    ]);
  });

  it('should throw an error due to overlapping patterns', () => {
    expect(() =>
      makeGroupsFromFiles(
        ['data/backups/mytool/mytool-db/pg-dump-mytool-1726750074.dmp'].map((filepath) => {
          return { name: filepath, date: new Date() };
        }),
        [new RegExp('.*'), new RegExp('.*')]
      )
    ).toThrow();
  });
});

describe('extractDateFromFilename()', () => {
  it('should return the correct dates', () => {
    expect(extractDateFromFilename('data/backups/databases/postgresql-database/pg-dump-postgres-1730419202.dmp')).toStrictEqual(
      new Date('2024-11-01T00:00:02.000Z')
    );
    expect(extractDateFromFilename('data/backups/databases/postgresql-database-1726750074/pg-dump-postgres.dmp')).toStrictEqual(
      new Date('2024-09-19T12:47:54.000Z')
    );
  });

  it('should throw due to multiple dates', () => {
    expect(() => extractDateFromFilename('data/backups/databases/postgresql-database-1726750074/pg-dump-postgres-1730419202.dmp')).toThrow();
  });

  it('should throw due to no date', () => {
    expect(() => extractDateFromFilename('data/backups/databases/postgresql-database/pg-dump-postgres-1730419202000.dmp')).toThrow();
    expect(() => extractDateFromFilename('data/backups/databases/postgresql-database/pg-dump-postgres.dmp')).toThrow();
  });
});

describe('getFilesToDeleteFromGroup()', () => {
  it('should keep one per year in the range', () => {
    const currentDate = parseISO('2024-01-13');

    const filesToDelete = getFilesToDeleteFromGroup(
      [
        { name: 'a', date: parseISO('2024-01-01') },
        { name: 'a', date: parseISO('2024-01-01') },
        { name: 'a', date: parseISO('2023-01-01') },
        { name: 'a', date: parseISO('2023-01-01') },
        { name: 'a', date: parseISO('2022-01-01') },
        { name: 'a', date: parseISO('2021-01-01') },
        { name: 'a', date: parseISO('2020-01-01') },
      ],
      currentDate,
      {
        dailyPeriod: 0,
        weeklyPeriod: 0,
        monthlyPeriod: 0,
        yearlyPeriod: 2,
        skipRecentDays: 0,
      }
    );

    expect(filesToDelete).toStrictEqual([
      { name: 'a', date: parseISO('2020-01-01') },
      { name: 'a', date: parseISO('2021-01-01') },
      { name: 'a', date: parseISO('2022-01-01') },
      { name: 'a', date: parseISO('2023-01-01') },
      { name: 'a', date: parseISO('2024-01-01') },
    ]);
  });

  it('should keep one per month in the range', () => {
    const currentDate = parseISO('2024-01-13');

    const filesToDelete = getFilesToDeleteFromGroup(
      [
        { name: 'a', date: parseISO('2024-01-01') },
        { name: 'a', date: parseISO('2024-01-01') },
        { name: 'a', date: parseISO('2023-12-01') },
        { name: 'a', date: parseISO('2023-11-01') },
        { name: 'a', date: parseISO('2023-10-01') },
      ],
      currentDate,
      {
        dailyPeriod: 0,
        weeklyPeriod: 0,
        monthlyPeriod: 2,
        yearlyPeriod: 0,
        skipRecentDays: 0,
      }
    );

    expect(filesToDelete).toStrictEqual([
      { name: 'a', date: parseISO('2023-10-01') },
      { name: 'a', date: parseISO('2023-11-01') },
      { name: 'a', date: parseISO('2024-01-01') },
    ]);
  });

  it('should keep one per week in the range', () => {
    const currentDate = parseISO('2024-01-13');

    const filesToDelete = getFilesToDeleteFromGroup(
      [
        { name: 'a', date: parseISO('2024-01-12') },
        { name: 'a', date: parseISO('2024-01-11') },
        { name: 'a', date: parseISO('2024-01-04') },
        { name: 'a', date: parseISO('2024-01-03') },
        { name: 'a', date: parseISO('2023-12-10') },
      ],
      currentDate,
      {
        dailyPeriod: 0,
        weeklyPeriod: 2,
        monthlyPeriod: 0,
        yearlyPeriod: 0,
        skipRecentDays: 0,
      }
    );

    expect(filesToDelete).toStrictEqual([
      { name: 'a', date: parseISO('2023-12-10') },
      { name: 'a', date: parseISO('2024-01-04') },
      { name: 'a', date: parseISO('2024-01-12') },
    ]);
  });

  it('should keep one per day in the range', () => {
    const currentDate = parseISO('2024-01-13');

    const filesToDelete = getFilesToDeleteFromGroup(
      [
        { name: 'a', date: parseISO('2024-01-12') },
        { name: 'a', date: parseISO('2024-01-12') },
        { name: 'a', date: parseISO('2024-01-11') },
        { name: 'a', date: parseISO('2024-01-11') },
        { name: 'a', date: parseISO('2024-01-11') },
        { name: 'a', date: parseISO('2024-01-09') },
        { name: 'a', date: parseISO('2024-01-08') },
        { name: 'a', date: parseISO('2024-01-02') },
      ],
      currentDate,
      {
        dailyPeriod: 7,
        weeklyPeriod: 0,
        monthlyPeriod: 0,
        yearlyPeriod: 0,
        skipRecentDays: 0,
      }
    );

    expect(filesToDelete).toStrictEqual([
      { name: 'a', date: parseISO('2024-01-02') },
      { name: 'a', date: parseISO('2024-01-11') },
      { name: 'a', date: parseISO('2024-01-11') },
      { name: 'a', date: parseISO('2024-01-12') },
    ]);
  });

  it('should skip recent days', () => {
    const currentDate = parseISO('2024-01-13');

    const filesToDelete = getFilesToDeleteFromGroup(
      [
        { name: 'a', date: parseISO('2024-01-12') },
        { name: 'a', date: parseISO('2024-01-09') },
      ],
      currentDate,
      {
        dailyPeriod: 0,
        weeklyPeriod: 0,
        monthlyPeriod: 0,
        yearlyPeriod: 0,
        skipRecentDays: 2,
      }
    );

    expect(filesToDelete).toStrictEqual([{ name: 'a', date: parseISO('2024-01-09') }]);
  });

  it('should keep the right files with a combination of parameters', () => {
    const currentDate = parseISO('2024-01-13');

    const filesToDelete = getFilesToDeleteFromGroup(
      [
        { name: 'a', date: parseISO('2024-01-12') },
        { name: 'a', date: parseISO('2024-01-11') },
        { name: 'a', date: parseISO('2024-01-11') },
        { name: 'a', date: parseISO('2024-01-10') },
        { name: 'a', date: parseISO('2024-01-09') },
        { name: 'a', date: parseISO('2024-01-08') },
        { name: 'a', date: parseISO('2024-01-07') },
        { name: 'a', date: parseISO('2024-01-06') },
        { name: 'a', date: parseISO('2024-01-05') },
        { name: 'a', date: parseISO('2024-01-04') },
        { name: 'a', date: parseISO('2023-12-30') },
        { name: 'a', date: parseISO('2023-12-29') },
        { name: 'a', date: parseISO('2023-12-20') },
        { name: 'a', date: parseISO('2023-12-19') },
        { name: 'a', date: parseISO('2023-12-03') },
        { name: 'a', date: parseISO('2023-12-02') },
        { name: 'a', date: parseISO('2023-12-01') },
        { name: 'a', date: parseISO('2023-11-26') },
        { name: 'a', date: parseISO('2023-11-01') },
        { name: 'a', date: parseISO('2023-10-26') },
        { name: 'a', date: parseISO('2023-09-11') },
        { name: 'a', date: parseISO('2023-09-10') },
        { name: 'a', date: parseISO('2023-02-01') },
        { name: 'a', date: parseISO('2023-01-01') },
        { name: 'a', date: parseISO('2022-12-01') },
        { name: 'a', date: parseISO('2022-11-01') },
        { name: 'a', date: parseISO('2021-11-01') },
        { name: 'a', date: parseISO('2021-01-01') },
        { name: 'a', date: parseISO('2020-01-01') },
      ],
      currentDate,
      {
        dailyPeriod: 7,
        weeklyPeriod: 4,
        monthlyPeriod: 12,
        yearlyPeriod: 2,
        skipRecentDays: 1,
      }
    );

    expect(filesToDelete).toStrictEqual([
      { name: 'a', date: parseISO('2020-01-01') },
      { name: 'a', date: parseISO('2021-01-01') },
      { name: 'a', date: parseISO('2021-11-01') },
      { name: 'a', date: parseISO('2022-12-01') },
      { name: 'a', date: parseISO('2023-09-11') },
      { name: 'a', date: parseISO('2023-11-26') },
      { name: 'a', date: parseISO('2023-12-02') },
      { name: 'a', date: parseISO('2023-12-03') },
      { name: 'a', date: parseISO('2023-12-20') },
      { name: 'a', date: parseISO('2023-12-30') },
      { name: 'a', date: parseISO('2024-01-05') },
      { name: 'a', date: parseISO('2024-01-11') },
    ]);
  });
});
