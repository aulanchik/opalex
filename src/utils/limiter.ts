import { env } from '@/config/env';

interface TokenBucket {
    tokens: number;
    lastRefill: number;
}

export class RateLimiter {
    private bucket: TokenBucket;
    private readonly capacity: number;
    private readonly refillRate: number;

    /**
     * @param capacity - Max tokens in bucket (max requests per burst)
     * @param refillRate - Tokens added per second
     */
    constructor(capacity: number, refillRate: number) {
        this.capacity = capacity;
        this.refillRate = refillRate;
        this.bucket = {
            tokens: capacity,
            lastRefill: Date.now(),
        };
    }

    /**
     * Refill tokens based on elapsed time
     */
    private refill(): void {
        const now = Date.now();
        const elapsed = (now - this.bucket.lastRefill) / 1000; // seconds

        // Add tokens based on elapsed time
        const tokensToAdd = elapsed * this.refillRate;
        this.bucket.tokens = Math.min(
            this.bucket.tokens + tokensToAdd,
            this.capacity
        );
        this.bucket.lastRefill = now;
    }

    /**
     * Try to acquire a token
     * @returns true if token acquired, false if bucket empty
     */
    private tryAcquire(): boolean {
        this.refill();

        if (this.bucket.tokens >= 1) {
            this.bucket.tokens -= 1;
            return true;
        }

        return false;
    }

    /**
     * Calculate wait time until token is available
     * @returns milliseconds to wait
     */
    private getWaitTime(): number {
        if (this.bucket.tokens >= 1) {
            return 0;
        }

        const tokensNeeded = 1 - this.bucket.tokens;
        const waitSeconds = tokensNeeded / this.refillRate;
        return waitSeconds * 1000; // convert to ms
    }

    /**
     * Wait until a token is available, then consume it
     * @param timeout - Max time to wait (ms). Default: 30 seconds
     * @throws Error if timeout exceeded
     */
    async acquire(timeout: number = 30000): Promise<void> {
        const startTime = Date.now();

        while (true) {
            if (this.tryAcquire()) {
                return; // Got token, proceed
            }

            const waitTime = this.getWaitTime();
            const elapsed = Date.now() - startTime;

            if (elapsed + waitTime > timeout) {
                throw new Error(
                    `Rate limit timeout: waited ${elapsed}ms, max ${timeout}ms`
                );
            }

            // Wait for token to become available
            await new Promise(resolve => setTimeout(resolve, waitTime + 10));
        }
    }

    /**
     * Wrap an async operation with rate limiting
     * @param operation - Async function to execute
     * @param timeout - Max wait time for rate limit
     * @returns Result of the operation
     */
    async throttle<T>(
        operation: () => Promise<T>,
        timeout?: number
    ): Promise<T> {
        await this.acquire(timeout);
        return operation();
    }

    /**
     * Get current bucket status (for monitoring)
     */
    getStatus(): {
        availableTokens: number;
        capacity: number;
        isFull: boolean;
    } {
        this.refill();
        return {
            availableTokens: Math.floor(this.bucket.tokens),
            capacity: this.capacity,
            isFull: this.bucket.tokens >= this.capacity,
        };
    }
}

export const rateLimiter = new RateLimiter(
    env.rateLimitCapacity,
    env.rateLimitRefillRate
);
