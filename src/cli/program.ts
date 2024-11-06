import { Command, Option } from '@commander-js/extra-typings';

import { CleanOptions, clean } from '@buc/src/core/clean';
import { ensureS3BucketConfig } from '@buc/src/utils/environment';

export const program = new Command();

program.name('backup-cleaner').description('CLI to perform cleaning of S3 backups').version('0.0.0');

program
  .command('clean')
  .description('clean s3 backups')
  .addOption(new Option('-dp, --daily-period <count>', 'keep daily backups for N last days from today').default(7, '7 last days'))
  .addOption(new Option('-dp, --weekly-period <count>', 'keep weekly backups for N last weeks from today').default(5, '5 last weeks'))
  .addOption(new Option('-dp, --monthly-period <count>', 'keep monthly backups for N last months from today').default(12, '12 last months'))
  .addOption(new Option('-dp, --yearly-period <count>', 'keep yearly backups for N last years from today').default(2, '2 last years'))
  .addOption(new Option('-sd, --skip-recent-days <count>', 'skip processing backups too recent').default(1, 'last day'))
  .addOption(new Option('-gp, --group-pattern [groupPatterns...]', `regexp applied to form a group from backups names`).default([]))
  .addOption(new Option('-dm, --date-marker <marker>', 'which date reference to take into account').choices(['name', 'metadata']).default('name'))
  .addOption(new Option('-ci, --ci', 'answer "yes" to all command prompts, use it with caution').default(false))
  .addOption(new Option('-dry, --dry-run', 'to list backups to delete while skipping deletion').default(false))
  .action(async (options) => {
    await ensureS3BucketConfig(!options.ci);

    await clean(
      CleanOptions.parse({
        dailyPeriod: options.dailyPeriod,
        weeklyPeriod: options.weeklyPeriod,
        monthlyPeriod: options.monthlyPeriod,
        yearlyPeriod: options.yearlyPeriod,
        skipRecentDays: options.skipRecentDays,
        groupPatterns: options.groupPattern,
        dateMarker: options.dateMarker,
        prompting: !options.ci,
        dryRun: options.dryRun,
      })
    );
  });
