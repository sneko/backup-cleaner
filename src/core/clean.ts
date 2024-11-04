import { z } from 'zod';

export const CleanOptions = z.object({
  // TODO
});
export type CleanOptionsType = z.infer<typeof CleanOptions>;

export async function clean(options: CleanOptionsType) {
  // TODO
}
