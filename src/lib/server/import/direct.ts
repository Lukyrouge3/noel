import { assertPublicHttpUrl } from './ssrf';

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_REDIRECTS = 5;
const TIMEOUT_MS = 12_000;

const BROWSER_HEADERS = {
	'User-Agent':
		'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
	Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
	'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
	'Cache-Control': 'no-cache',
	Pragma: 'no-cache',
	'Upgrade-Insecure-Requests': '1',
	'Sec-Fetch-Dest': 'document',
	'Sec-Fetch-Mode': 'navigate',
	'Sec-Fetch-Site': 'none',
	'Sec-Fetch-User': '?1'
};

export type DirectFetchResult = {
	ok: boolean;
	blocked: boolean;
	status: number;
	finalUrl: string;
	html: string;
	reason: string | null;
};

const BLOCK_TITLE_MARKERS = [
	'just a moment',
	'attention required',
	'access denied',
	'verify you are human',
	'enable javascript and cookies',
	'datadome',
	'captcha'
];

function detectBlock(status: number, headers: Headers, html: string): string | null {
	if (headers.get('cf-mitigated')) return 'cloudflare-challenge';
	if (headers.get('x-datadome') || headers.get('x-dd-b')) return 'datadome';

	const setCookie = headers.get('set-cookie')?.toLowerCase() ?? '';
	if (setCookie.includes('datadome')) return 'datadome';

	if (status === 401 || status === 403 || status === 407 || status === 429 || status === 451) {
		return `http-${status}`;
	}

	if (status === 503) return 'http-503';

	const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.toLowerCase() ?? '';
	const head = html.slice(0, 6000).toLowerCase();

	if (BLOCK_TITLE_MARKERS.some((marker) => title.includes(marker))) {
		return 'challenge-page';
	}

	if (
		head.includes('cf-chl') ||
		head.includes('challenge-platform') ||
		head.includes('captcha-delivery') ||
		head.includes('px-captcha')
	) {
		return 'challenge-page';
	}

	return null;
}

async function readLimited(response: Response, maxBytes: number): Promise<string> {
	const reader = response.body?.getReader();
	if (!reader) return response.text();

	const chunks: Uint8Array[] = [];
	let total = 0;

	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		if (!value) continue;

		const remaining = maxBytes - total;
		if (remaining <= 0) {
			await reader.cancel();
			break;
		}

		const chunk = value.byteLength > remaining ? value.slice(0, remaining) : value;
		chunks.push(chunk);
		total += chunk.byteLength;
	}

	const merged = new Uint8Array(total);
	let offset = 0;
	for (const chunk of chunks) {
		merged.set(chunk, offset);
		offset += chunk.byteLength;
	}

	return new TextDecoder('utf-8', { fatal: false }).decode(merged);
}

export async function fetchDirect(input: string): Promise<DirectFetchResult> {
	let current = await assertPublicHttpUrl(input);

	for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
		let response: Response;
		try {
			response = await fetch(current, {
				headers: BROWSER_HEADERS,
				redirect: 'manual',
				signal: AbortSignal.timeout(TIMEOUT_MS)
			});
		} catch {
			return {
				ok: false,
				blocked: false,
				status: 0,
				finalUrl: current.toString(),
				html: '',
				reason: 'network'
			};
		}

		if ([301, 302, 303, 307, 308].includes(response.status)) {
			const location = response.headers.get('location');
			if (!location) break;

			try {
				current = await assertPublicHttpUrl(new URL(location, current).toString());
			} catch {
				return {
					ok: false,
					blocked: false,
					status: response.status,
					finalUrl: current.toString(),
					html: '',
					reason: 'redirect-blocked'
				};
			}

			continue;
		}

		const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
		if (contentType && !contentType.includes('text/html') && !contentType.includes('xhtml')) {
			return {
				ok: false,
				blocked: false,
				status: response.status,
				finalUrl: current.toString(),
				html: '',
				reason: 'unsupported-content-type'
			};
		}

		const html = await readLimited(response, MAX_BYTES);
		const blockReason = detectBlock(response.status, response.headers, html);

		return {
			ok: response.ok && !blockReason,
			blocked: blockReason !== null,
			status: response.status,
			finalUrl: current.toString(),
			html,
			reason: blockReason ?? (response.ok ? null : `http-${response.status}`)
		};
	}

	return {
		ok: false,
		blocked: false,
		status: 0,
		finalUrl: current.toString(),
		html: '',
		reason: 'too-many-redirects'
	};
}
