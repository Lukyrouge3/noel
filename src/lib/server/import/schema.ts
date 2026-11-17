import { z } from 'zod';
import type { ProductImport } from '$lib/import';

export type { ImportResult, ImportSource, ImportStatus, ProductImport } from '$lib/import';

export const importUrlSchema = z.object({
	url: z.string().trim().min(1).max(8192)
});

export const llmProductSchema = z.object({
	title: z.string().nullable().optional(),
	price: z.union([z.number(), z.string()]).nullable().optional(),
	currency: z.string().nullable().optional(),
	image_url: z.string().nullable().optional(),
	description: z.string().nullable().optional()
});

export type LlmProduct = z.infer<typeof llmProductSchema>;

export function emptyProduct(url: string): ProductImport {
	return {
		title: null,
		price: null,
		currency: null,
		image_url: null,
		url,
		description: null
	};
}
