import { confirm, input, password } from '@inquirer/prompts';

import { S3BucketConfigSchema, S3BucketConfigSchemaType, S3BucketEnvironmentVariablesSchema } from '@buc/src/models/entities/environment';

export const config: S3BucketConfigSchemaType = {
  endpoint: '',
  port: 0,
  useSsl: true,
  accessKey: '',
  secretKey: '',
  name: '',
};

export async function ensureS3BucketConfig(prompting: boolean = true) {
  const result = S3BucketEnvironmentVariablesSchema.safeParse(process.env);

  if (!result.success) {
    if (prompting) {
      const s3BucketEndpoint = await input({ message: 'what is your s3 bucket endpoint?' });
      const s3BucketPort = await input({ message: 'what is your s3 bucket port?' });
      const s3BucketUseSsl = await confirm({ message: 'does this port requires SSL?' });
      const s3BucketAccessKey = await input({ message: 'what is your s3 bucket access key?' });
      const s3BucketSecretKey = await password({ message: 'what is your s3 bucket secret key?' });
      const s3BucketName = await password({ message: 'what is your s3 bucket name?' });

      const tmpConfig = S3BucketConfigSchema.parse({
        endpoint: s3BucketEndpoint,
        port: s3BucketPort,
        useSsl: s3BucketUseSsl,
        accessKey: s3BucketAccessKey,
        secretKey: s3BucketSecretKey,
        name: s3BucketName,
      });

      Object.assign(config, tmpConfig);
    } else {
      throw new Error(
        `prompting is disabled so $S3_BUCKET_ENDPOINT, $S3_BUCKET_PORT, $S3_BUCKET_ACCESS_KEY and $S3_BUCKET_SECRET_KEY environment variables must be provided`
      );
    }
  } else {
    config.endpoint = result.data.S3_BUCKET_ENDPOINT;
    config.port = result.data.S3_BUCKET_PORT;
    config.useSsl = result.data.S3_BUCKET_USE_SSL;
    config.accessKey = result.data.S3_BUCKET_ACCESS_KEY;
    config.secretKey = result.data.S3_BUCKET_SECRET_KEY;
    config.name = result.data.S3_BUCKET_NAME;
  }
}
