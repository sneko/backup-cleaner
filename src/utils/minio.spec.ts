/**
 * @jest-environment node
 */
import { MinioContainer, setupMinio } from '@buc/src/utils/minio';

describe('database', () => {
  let minio: MinioContainer;

  beforeAll(async () => {
    minio = await setupMinio();
  }, 30 * 1000);

  afterAll(async () => {
    if (minio) {
      await minio.container.stop();
    }
  }, 30 * 1000);

  describe('minio', () => {
    it('populate with backups', async () => {
      // TODO
    });

    it('clean', async () => {
      // TODO
    });
  });
});
