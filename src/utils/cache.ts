interface CacheEntry<T> {
    data: T;
    expiresAt: number;
}

export class Cache {
    private static cache = new Map<string, CacheEntry<any>>();

    static get<T>(key: string): T | null {
        const entry = this.cache.get(key);

        if (!entry) {
            return null;
        }

        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return entry.data as T;
    }

    static set<T>(key: string, data: T, ttlMs: number): void {
        this.cache.set(key, {
            data,
            expiresAt: Date.now() + ttlMs,
        });
    }

    static delete(key: string): void {
        this.cache.delete(key);
    }

    static clear(): void {
        this.cache.clear();
    }

    static size(): number {
        return this.cache.size;
    }
}
