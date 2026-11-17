import type { ImportResult } from './schema';

type CacheEntry = {
	value: ImportResult;
	expires: number;
};

const CACHE_LIMIT = 200;
const COMPLETE_TTL = 24 * 60 * 60 * 1000;
const PARTIAL_TTL = 60 * 60 * 1000;

const cache = new Map<string, CacheEntry>();

export function getCachedImport(key: string): ImportResult | null {
	const entry = cache.get(key);
	if (!entry) return null;

	if (entry.expires <= Date.now()) {
		cache.delete(key);
		return null;
	}

	return entry.value;
}

export function setCachedImport(key: string, value: ImportResult): void {
	if (!value.ok) return;

	if (cache.size >= CACHE_LIMIT) {
		const oldest = cache.keys().next().value;
		if (oldest) cache.delete(oldest);
	}

	cache.set(key, {
		value,
		expires: Date.now() + (value.status === 'complete' ? COMPLETE_TTL : PARTIAL_TTL)
	});
}

export function clearImportCache(): void {
	cache.clear();
}
