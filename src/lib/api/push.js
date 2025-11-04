import { apiRequestProducer } from './producers';

export async function registerProducerPushToken(token) {
  await apiRequestProducer('/api/producer/push-token', {
    method: 'POST',
    body: { token, platform: 'web' },
  });
}

export async function unregisterProducerPushToken(token) {
  await apiRequestProducer('/api/producer/push-token', {
    method: 'DELETE',
    body: { token },
  });
}
