import { input, password } from '@inquirer/prompts';

import { S3BucketConfigSchema, S3BucketConfigSchemaType, S3BucketEnvironmentVariablesSchema } from '@buc/src/models/entities/environment';

export const config: S3BucketConfigSchemaType = {
  endpoint: '',
  port: 0,
  accessKey: '',
  secretKey: '',
};

export async function ensureS3BucketConfig(prompting: boolean = true) {
  const result = S3BucketEnvironmentVariablesSchema.safeParse(process.env);

  if (!result.success) {
    if (prompting) {
      const s3BucketEndpoint = await input({ message: 'What is your S3 bucket endpoint?' });
      const s3BucketPort = await input({ message: 'What is your S3 bucket port?' });
      const s3BucketAccessKey = await input({ message: 'What is your S3 bucket access key?' });
      const s3BucketSecretKey = await password({ message: 'What is your S3 bucket secret key?' });

      const tmpConfig = S3BucketConfigSchema.parse({
        endpoint: s3BucketEndpoint,
        port: s3BucketPort,
        accessKey: s3BucketAccessKey,
        secretKey: s3BucketSecretKey,
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
    config.accessKey = result.data.S3_BUCKET_ACCESS_KEY;
    config.secretKey = result.data.S3_BUCKET_SECRET_KEY;
  }
}
