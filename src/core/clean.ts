import { confirm } from '@inquirer/prompts';
import {
  formatDate,
  fromUnixTime,
  getDayOfYear,
  getMonth,
  getWeek,
  getYear,
  isAfter,
  startOfDay,
  subDays,
  subMonths,
  subWeeks,
  subYears,
} from 'date-fns';
import { Client } from 'minio';
import { z } from 'zod';

import { config } from '@buc/src/utils/environment';

export const DateMarkerSchema = z.enum(['name', 'metadata']);
export type DateMarkerSchemaType = z.infer<typeof DateMarkerSchema>;

export const Prompting = z.boolean().optional();
export type PromptingType = z.infer<typeof Prompting>;

export const Pattern = z.string().transform((val) => {
  // We make it case insensitive because in huge files sometimes common patterns are not exact
  return new RegExp(val, 'i');
});
export type PatternType = z.infer<typeof Pattern>;

export const RulesSchema = z
  .object({
    dailyPeriod: z.coerce.number().int().nonnegative(),
    weeklyPeriod: z.coerce.number().int().nonnegative(),
    monthlyPeriod: z.coerce.number().int().nonnegative(),
    yearlyPeriod: z.coerce.number().int().nonnegative(),
    skipRecentDays: z.coerce.number().int().nonnegative(),
  })
  .strip();
export type RulesSchemaType = z.infer<typeof RulesSchema>;

export const CleanOptions = RulesSchema.merge(
  z.object({
    groupPatterns: z.array(Pattern),
    dateMarker: DateMarkerSchema,
    dryRun: z.boolean(),
    prompting: Prompting,
  })
).strip();
export type CleanOptionsType = z.infer<typeof CleanOptions>;

export const FileSchema = z
  .object({
    name: z.string().min(1),
    date: z.coerce.date(),
  })
  .strip();
export type FileSchemaType = z.infer<typeof FileSchema>;

export interface File {
  name: string;
  date: Date;
}

export async function listFiles(minioClient: Client, bucketName: string): Promise<File[]> {
  return new Promise((resolve, reject) => {
    const stream2 = minioClient.extensions.listObjectsV2WithMetadata(bucketName, undefined, true);
    const stream = minioClient.listObjectsV2(bucketName, undefined, true);
    const files: File[] = [];

    stream.on('data', function (obj) {
      const file = FileSchema.safeParse({
        name: obj.name,
        date: obj.lastModified,
      });

      if (file.success) {
        files.push(file.data);
      }
    });

    stream.on('end', function () {
      resolve(files);
    });

    stream.on('error', function (err) {
      reject(err);
    });
  });
}

export function makeGroupsFromFiles(files: File[], groupPatterns: PatternType[]): File[][] {
  const groupedFiles: File[][] = Array.from({ length: groupPatterns.length }, () => []);

  for (const file of files) {
    // We do not break the loop once found to be sure there is no pattern overlapping another one
    let found = 0;

    for (let i = 0; i < groupPatterns.length; i++) {
      const groupPattern = groupPatterns[i];

      if (groupPattern.test(file.name)) {
        groupedFiles[i].push(file);

        found++;
      }
    }

    if (found > 1) {
      throw new Error(
        `a same file is matching ${found} group patterns, it must have no overlap between patterns because it's at risk for deletion (file: "${file.name}")`
      );
    }
  }

  return groupedFiles;
}

export function extractDateFromFilename(filename: string): Date {
  // TODO: in the future we could manage different date formats like `['yyyy-MM-dd', 'yyyyMMdd', 'yyyy-MM-dd_HH-mm-ss']`
  const regex = /\b\d{10}\b/g;
  const matches = filename.match(regex);

  if (matches) {
    if (matches.length > 1) {
      throw new Error(`a file contains multiple timestamps, it can lead the libary to making a mistake (file: "${filename}")`);
    }

    return fromUnixTime(parseInt(matches[0], 10));
  } else {
    throw new Error(`a file does not contain a timestamp, this is not possible, adjust the group pattern if needed (file: "${filename}")`);
  }
}

export function getFilesToDeleteFromGroup(group: File[], currentDate: Date, rules: RulesSchemaType): File[] {
  const referenceDate = subDays(startOfDay(currentDate), rules.skipRecentDays);

  const dailyStart = subDays(referenceDate, rules.dailyPeriod);
  const weeklyStart = subWeeks(referenceDate, rules.weeklyPeriod);
  const monthlyStart = subMonths(referenceDate, rules.monthlyPeriod);
  const yearlyStart = subYears(referenceDate, rules.yearlyPeriod);

  // They need to be ordered to keep a simple logic of filtering
  const sortedFilesAsc = group.sort((a, b) => {
    return a.date.getTime() - b.date.getTime();
  });

  const tracking: string[] = []; // Helps avoiding multiple dates for the same allowed "range"
  const filesToDelete: File[] = [];

  for (const file of sortedFilesAsc) {
    // Start filtering
    if (isAfter(file.date, referenceDate)) {
      // If skipped, do not consider for deletion
      continue;
    }

    let toDelete = true;

    if (isAfter(file.date, yearlyStart)) {
      const id = `yearly-${getYear(file.date)}`;

      if (!tracking.includes(id)) {
        tracking.push(id);

        toDelete = false;
      }
    }

    if (isAfter(file.date, monthlyStart)) {
      const id = `monthly-${getYear(file.date)}-${getMonth(file.date)}`;

      if (!tracking.includes(id)) {
        tracking.push(id);

        toDelete = false;
      }
    }

    if (isAfter(file.date, weeklyStart)) {
      const id = `weekly-${getYear(file.date)}-${getWeek(file.date)}`;

      if (!tracking.includes(id)) {
        tracking.push(id);

        toDelete = false;
      }
    }

    if (isAfter(file.date, dailyStart)) {
      const id = `daily-${getYear(file.date)}-${getDayOfYear(file.date)}`;

      if (!tracking.includes(id)) {
        tracking.push(id);

        toDelete = false;
      }
    }

    // If not filtered, we can delete the file
    if (toDelete) {
      filesToDelete.push(file);
    }
  }

  return filesToDelete;
}

export async function clean(options: CleanOptionsType) {
  const minioClient = new Client({
    endPoint: config.endpoint,
    port: config.port,
    useSSL: true,
    accessKey: config.accessKey,
    secretKey: config.secretKey,
  });

  const files = await listFiles(minioClient, config.name);

  // If requested we take as reference the date from the name
  if (options.dateMarker === 'name') {
    for (const file of files) {
      file.date = extractDateFromFilename(file.name);
    }
  }

  const groupedFiles = makeGroupsFromFiles(files, options.groupPatterns);

  const currentDate = new Date();
  const filesToDelete: File[] = [];
  for (const group of groupedFiles) {
    const groupFilesToDelete = getFilesToDeleteFromGroup(group, currentDate, options);

    filesToDelete.push(...groupFilesToDelete);
  }

  if (filesToDelete.length === 0) {
    console.log(`there is no file to delete according to the chosen options`);

    return;
  }

  if (options.prompting) {
    const answer = await confirm({
      message: `${filesToDelete.map((fileToDelete) => {
        return `- ${fileToDelete.name} (${formatDate(fileToDelete.date, 'PPPP')})`;
      })}\n\nare you sure you want to delete the ${filesToDelete.length} files listed above?`,
      default: false,
    });

    if (!answer) {
      console.warn('the deletion has been aborted');

      return;
    }
  }

  if (options.dryRun) {
    console.log(`a dry run has been requested so no file will be deleted`);

    return;
  }

  await minioClient.removeObjects(
    config.name,
    filesToDelete.map((fileToDelete) => {
      return fileToDelete.name;
    })
  );

  console.log(`${filesToDelete.length} files have been deleted`);
}
