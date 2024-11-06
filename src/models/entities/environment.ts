import { z } from 'zod';

export const S3BucketConfigSchema = z
  .object({
    endpoint: z.string().min(1),
    port: z.coerce.number().nonnegative(),
    useSsl: z.preprocess((value) => {
      // Needed a simple `z.coerce.boolean()` results in `Boolean('false') === true` (due to JavaScript rules)
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true';
      }

      return value;
    }, z.coerce.boolean()),
    region: z.string().min(1),
    accessKey: z.string().min(1),
    secretKey: z.string().min(1),
    name: z.string().min(1),
  })
  .strict();
export type S3BucketConfigSchemaType = z.infer<typeof S3BucketConfigSchema>;

export const S3BucketEnvironmentVariablesSchema = z
  .object({
    S3_BUCKET_ENDPOINT: S3BucketConfigSchema.shape.endpoint,
    S3_BUCKET_PORT: S3BucketConfigSchema.shape.port,
    S3_BUCKET_USE_SSL: S3BucketConfigSchema.shape.useSsl.optional().default(true),
    S3_BUCKET_REGION: S3BucketConfigSchema.shape.region,
    S3_BUCKET_ACCESS_KEY: S3BucketConfigSchema.shape.accessKey,
    S3_BUCKET_SECRET_KEY: S3BucketConfigSchema.shape.secretKey,
    S3_BUCKET_NAME: S3BucketConfigSchema.shape.name,
  })
  .strip();
export type S3BucketEnvironmentVariablesSchemaType = z.infer<typeof S3BucketEnvironmentVariablesSchema>;
