import createDOMPurify from 'dompurify';
import { JSDOM as SanitizerDOM } from 'jsdom';
import OpenAI from 'openai';
import { z } from 'zod';
import { zodTextFormat } from 'openai/helpers/zod';
import { env } from '$env/dynamic/private';

async function fetchCleanHTML(url: string, agent: string): Promise<string> {
	const res = await fetch(url, {
		headers: {
			'User-Agent': agent
		}
	});
	const raw = await res.text();

	const { window } = new SanitizerDOM('');
	const DOMPurify = createDOMPurify(window);

	// sanitize & remove scripts, iframes, forms, etc.
	const clean = DOMPurify.sanitize(raw, {
		WHOLE_DOCUMENT: true,
		FORBID_TAGS: [
			'script',
			'style',
			'iframe',
			'form',
			'noscript',
			'input',
			'button',
			'svg',
			'canvas',
			'nav',
			'footer',
			'header',
			'aside'
		],
		ALLOW_DATA_ATTR: false,
		ALLOWED_ATTR: ['id', 'role', 'alt', 'src', 'href']
	});

	return clean.replace(/\s+/g, ' ').trim();
}

const ProductInfoSchema = z.object({
	product_title: z.string(),
	price: z.number(),
	images: z.array(z.string()),
	currency: z.string()
});

// Legacy scraper. Replaced in the import-engine commits.
export const POST = async ({ request }) => {
	const { url, agent } = (await request.json()) as { url: string; agent: string };
	const cleanHTML = await fetchCleanHTML(url, agent);
	const apiKey = env.LLM_API_KEY ?? env.OPENAI_API_KEY ?? env.PRIVATE_OPENAPI_KEY;

	const client = new OpenAI({ apiKey });

	const response = await client.responses.parse({
		model: env.LLM_MODEL ?? 'gpt-4.1-mini',
		text: {
			format: zodTextFormat(ProductInfoSchema, 'result')
		},
		input: cleanHTML,
		temperature: 0
	});

	return new Response(JSON.stringify(response.output_parsed));
};
