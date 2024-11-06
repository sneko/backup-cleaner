import path from 'path';
import { DockerComposeEnvironment, Wait } from 'testcontainers';
import type { StartedGenericContainer } from 'testcontainers/dist/src/generic-container/started-generic-container';

import { bindContainerLogs, defaultEnvironment, formatContainerNameWithSuffix } from '@buc/src/utils/testcontainers';

const __root_dirname = process.cwd();

export interface MinioContainer {
  container: StartedGenericContainer;
  bucket: {
    endpoint: string;
    port: number;
    useSsl: boolean;
    region: string;
    accessKey: string;
    secretKey: string;
  };
}

export async function setupMinio(): Promise<MinioContainer> {
  const dummyUser = 'random-key';
  const dummyPassword = 'random-key';

  const isPipelineWorker = process.env.CI === 'true';
  if (isPipelineWorker) {
    process.env.TESTCONTAINERS_RYUK_DISABLED = 'true';
  }

  const composeFilePath = path.resolve(__root_dirname, './');
  const composeFile = 'docker-compose.yaml';
  const serviceName = 'minio';
  const containerName = formatContainerNameWithSuffix('buc_minio_container');

  const environment = await new DockerComposeEnvironment(composeFilePath, composeFile)
    .withEnvironment({
      ...defaultEnvironment,
      DOCKER_COMPOSE_MINIO_PORT_BINDING: '9000', // To use a random port from the host
      DOCKER_COMPOSE_MINIO_CONSOLE_PORT_BINDING: '9001', // To use a random port from the host
      MINIO_ROOT_USER: dummyUser,
      MINIO_ROOT_PASSWORD: dummyPassword,
    })
    .withWaitStrategy(serviceName, Wait.forHealthCheck())
    .up([serviceName]);

  const container = environment.getContainer(containerName);

  bindContainerLogs(container, {
    enabled: false,
  });

  const ip = container.getHost();
  const mappedPort = container.getMappedPort(9000);

  return {
    container,
    bucket: {
      endpoint: ip,
      port: mappedPort,
      useSsl: false,
      region: 'us-east-1',
      accessKey: dummyUser,
      secretKey: dummyPassword,
    },
  };
}
