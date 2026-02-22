import { Logger } from './logger';

const inFlightRequests = new Map<string, Promise<any>>();

/**
 * Wraps an async operation to prevent duplicate concurrent calls.
 * If the same key is already in-flight, returns the existing promise.
 * 
 * @param key - Unique identifier for the request (e.g., cache key)
 * @param operation - The async operation to deduplicate
 * @returns Promise that resolves to the operation result
 */
export async function deduplicate<T>(
    key: string,
    operation: () => Promise<T>
): Promise<T> {
    // Checking if there's already an in-flight request with this key
    const existing = inFlightRequests.get(key);
    if (existing) {
        Logger.info(`[Dedupe] HIT for key: ${key}`);
        return existing as Promise<T>;
    }

    // No in-flight request, start a new one
    Logger.info(`[Dedupe] MISS for key: ${key}`);

    // Clean up: remove from map when done (success or failure)
    const promise = operation().finally(() => {
        inFlightRequests.delete(key);
    });

    // Store the promise in the map
    inFlightRequests.set(key, promise);

    return promise;
}

/**
 * Returns the number of currently in-flight requests.
 * Useful for monitoring/debugging.
 */
export function getInFlightCount(): number {
    return inFlightRequests.size;
}

/**
 * Clears all in-flight requests.
 * Useful for testing or manual cleanup.
 */
export function clearInFlightRequests(): void {
    inFlightRequests.clear();
}
