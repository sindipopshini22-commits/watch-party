import Redis from 'ioredis';

export const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null,
});

redis.on('error', (err) => {
  if ((err as any).code === 'ECONNREFUSED') {
    return;
  }
  console.error('Redis error:', err);
});
