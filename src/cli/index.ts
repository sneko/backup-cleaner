#!/usr/bin/env node
import { program } from '@buc/src/cli/program';
import { gracefulExit } from '@buc/src/utils/system';

program.parseAsync().catch((error) => {
  gracefulExit(error);
});
