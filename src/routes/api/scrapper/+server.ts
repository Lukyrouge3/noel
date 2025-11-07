import { JSDOM } from "jsdom";
import createDOMPurify from "dompurify";
import { JSDOM as SanitizerDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import OpenAI from 'openai';
import z from 'zod';
import { zodTextFormat } from "openai/helpers/zod";
import { PRIVATE_OPENAPI_KEY } from "$env/static/private";
import fs from 'fs';

async function fetchCleanHTML(url: string, agent: string): Promise<string> {
	const res = await fetch(url, {
		headers: {
			"User-Agent": agent
		}
	});
	const raw = await res.text();

	const { window } = new SanitizerDOM("");
	const DOMPurify = createDOMPurify(window);

	// sanitize & remove scripts, iframes, forms, etc.
	const clean = DOMPurify.sanitize(raw, {
		WHOLE_DOCUMENT: true,
		FORBID_TAGS: ["script", "style", "iframe", "form", "noscript", "input", "button", "svg", "canvas", "nav", "footer", "header", "aside"],
		// FORBID_ATTR: ["style", "onerror", "onclick", "onload", "class"]
		ALLOW_DATA_ATTR: false,
		ALLOWED_ATTR: ["id", "role", "alt"]
	});

	return clean.replace(/\s+/g, ' ').trim();
}
const ProductInfoSchema = z.object({
	product_title: z.string(),
	price: z.number(),
	images: z.array(z.string()),
	currency: z.string(),
});

// export const scrapper = query('unchecked', async (url: string) => {
// Idea is to download the raw html from the page, clean it and use openai to extract relevant info

export const POST = async ({ request }) => {
	const { url, agent } = await request.json();
	const cleanHTML = await fetchCleanHTML(url, agent);

	// fs.writeFileSync('cleanHTML.html', cleanHTML);
	console.log(cleanHTML.length);

	// return new Response(JSON.stringify({ message: "HTML fetched and cleaned." }));
	const client = new OpenAI({
		apiKey: PRIVATE_OPENAPI_KEY
	});

	const response = await client.responses.parse({
		model: "gpt-4.1-mini",
		text: {
			format: zodTextFormat(ProductInfoSchema, "result"),
		},
		input: cleanHTML,
		temperature: 0
	});

	const result = response.output_parsed;

	// fs.writeFileSync('result.json', JSON.stringify(result, null, 2));

	return new Response(JSON.stringify(result));
}
// });