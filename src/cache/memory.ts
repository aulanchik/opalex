import { TtlCache } from '@/utils/cache';
import type { Cache, CacheStatus } from './types';

export class MemoryCache<V> implements Cache<V> {
  readonly driver = 'memory' as const;

  private readonly store: TtlCache<V>;

  constructor(maxEntries: number, ttlSeconds: number) {
    this.store = new TtlCache<V>(maxEntries, ttlSeconds * 1000);
  }

  async get(key: string): Promise<V | undefined> {
    return this.store.get(key);
  }

  async set(key: string, value: V): Promise<void> {
    this.store.set(key, value);
  }

  status(): CacheStatus {
    return { driver: 'memory', size: this.store.size };
  }

  async close(): Promise<void> {
    this.store.clear();
  }
}
