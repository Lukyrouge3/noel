export type ProductImport = {
	title: string | null;
	price: number | null;
	currency: string | null;
	image_url: string | null;
	url: string;
	description: string | null;
};

export type ImportStatus = 'complete' | 'partial';
export type ImportSource = 'direct' | 'reader' | 'llm' | 'vision' | 'none';

export type ImportResult = {
	ok: boolean;
	status: ImportStatus;
	product: ProductImport;
	source: ImportSource;
	warnings: string[];
	error: string | null;
};
