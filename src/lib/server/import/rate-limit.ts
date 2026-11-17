const WINDOW_MS = 60 * 60 * 1000;

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function isRateLimited(userId: string, maxPerWindow = 20): boolean {
	const now = Date.now();
	const bucket = buckets.get(userId);

	if (!bucket || bucket.resetAt <= now) {
		buckets.set(userId, { count: 1, resetAt: now + WINDOW_MS });
		return false;
	}

	if (bucket.count >= maxPerWindow) return true;

	bucket.count += 1;
	return false;
}
