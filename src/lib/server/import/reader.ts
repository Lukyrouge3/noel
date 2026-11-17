import { env } from '$env/dynamic/private';

export type ReaderResult = {
	title: string | null;
	content: string;
	source: 'deepseek' | 'jina';
};

function apiKey(): string | undefined {
	if (env.DEEPSEEK_API_KEY) return env.DEEPSEEK_API_KEY;

	const base = env.LLM_BASE_URL ?? 'https://api.deepseek.com';
	if (!base.includes('deepseek')) return undefined;

	return env.LLM_API_KEY ?? env.OPENAI_API_KEY ?? env.PRIVATE_OPENAPI_KEY;
}

export function readerProvider(): 'deepseek' | 'jina' | 'none' {
	const provider = (env.READER_PROVIDER ?? 'deepseek').toLowerCase();
	if (provider === 'none') return 'none';
	if (provider === 'jina') return 'jina';
	return 'deepseek';
}

export function readerConfigured(): boolean {
	const provider = readerProvider();
	if (provider === 'none') return false;
	if (provider === 'jina') return true;
	return Boolean(apiKey());
}

function deepseekEndpoint(): string {
	const base = (env.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com').replace(/\/+$/, '');
	return base.endsWith('/v1') ? `${base}/tools/fetch` : `${base}/v1/tools/fetch`;
}

async function fetchWithDeepseek(url: string): Promise<ReaderResult | null> {
	const key = apiKey();
	if (!key) return null;

	try {
		const response = await fetch(deepseekEndpoint(), {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${key}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ url }),
			signal: AbortSignal.timeout(Number(env.LLM_TIMEOUT_MS ?? 30_000))
		});

		if (!response.ok) return null;

		const data = (await response.json()) as { title?: unknown; content?: unknown };
		const content = typeof data.content === 'string' ? data.content.trim() : '';
		if (!content) return null;

		return {
			title: typeof data.title === 'string' && data.title.trim() ? data.title.trim() : null,
			content: content.slice(0, 60_000),
			source: 'deepseek'
		};
	} catch {
		return null;
	}
}

export async function fetchWithJinaReader(url: string): Promise<ReaderResult | null> {
	try {
		const headers: Record<string, string> = {
			Accept: 'text/plain',
			'User-Agent': 'NoelWishlist/1.0'
		};
		if (env.JINA_API_KEY) headers.Authorization = `Bearer ${env.JINA_API_KEY}`;

		const response = await fetch(`https://r.jina.ai/${url}`, {
			headers,
			signal: AbortSignal.timeout(Number(env.LLM_TIMEOUT_MS ?? 30_000))
		});

		if (!response.ok) return null;

		const content = (await response.text()).trim();
		if (!content) return null;

		const title = content.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? null;

		return {
			title,
			content: content.slice(0, 60_000),
			source: 'jina'
		};
	} catch {
		return null;
	}
}

export async function fetchWithReader(url: string): Promise<ReaderResult | null> {
	const provider = readerProvider();
	if (provider === 'none') return null;
	if (provider === 'jina') return fetchWithJinaReader(url);
	return fetchWithDeepseek(url);
}
