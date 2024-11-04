import { Command } from '@commander-js/extra-typings';

import { CleanOptions, clean } from '@buc/src/core/clean';

export const program = new Command();

program.name('backup-cleaner').description('CLI to perform actions between Figma and Penpot').version('0.0.0');

program
  .command('clean')
  .description('clean s3 backups')
  .action(async (options) => {
    await clean(
      CleanOptions.parse({
        // TODO
      })
    );
  });
