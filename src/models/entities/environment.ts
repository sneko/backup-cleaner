import { z } from 'zod';

export const S3BucketConfigSchema = z
  .object({
    endpoint: z.string().min(1),
    port: z.coerce.number().nonnegative(),
    accessKey: z.string().min(1),
    secretKey: z.string().min(1),
  })
  .strict();
export type S3BucketConfigSchemaType = z.infer<typeof S3BucketConfigSchema>;

export const S3BucketEnvironmentVariablesSchema = z
  .object({
    S3_BUCKET_ENDPOINT: S3BucketConfigSchema.shape.endpoint,
    S3_BUCKET_PORT: S3BucketConfigSchema.shape.port,
    S3_BUCKET_ACCESS_KEY: S3BucketConfigSchema.shape.accessKey,
    S3_BUCKET_SECRET_KEY: S3BucketConfigSchema.shape.secretKey,
  })
  .strict();
export type S3BucketEnvironmentVariablesSchemaType = z.infer<typeof S3BucketEnvironmentVariablesSchema>;
