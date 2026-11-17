import { z } from 'zod';

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

export type ProductImport = {
	title: string | null;
	price: number | null;
	currency: string | null;
	image_url: string | null;
	url: string;
	description: string | null;
};

export type ImportStatus = 'complete' | 'partial';
export type ImportSource = 'direct' | 'reader' | 'llm' | 'none';

export type ImportResult = {
	ok: boolean;
	status: ImportStatus;
	product: ProductImport;
	source: ImportSource;
	warnings: string[];
	error: string | null;
};

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
