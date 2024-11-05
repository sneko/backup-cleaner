import { z } from 'zod';

export const S3BucketConfigSchema = z
  .object({
    endpoint: z.string().min(1),
    port: z.coerce.number().nonnegative(),
    useSsl: z.coerce.boolean(),
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
    S3_BUCKET_USE_SSL: S3BucketConfigSchema.shape.useSsl,
    S3_BUCKET_ACCESS_KEY: S3BucketConfigSchema.shape.accessKey,
    S3_BUCKET_SECRET_KEY: S3BucketConfigSchema.shape.secretKey,
    S3_BUCKET_NAME: S3BucketConfigSchema.shape.name,
  })
  .strict();
export type S3BucketEnvironmentVariablesSchemaType = z.infer<typeof S3BucketEnvironmentVariablesSchema>;
