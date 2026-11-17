import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

export class ImportUrlError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'ImportUrlError';
	}
}

const BLOCKED_HOSTNAMES = new Set([
	'localhost',
	'localhost.localdomain',
	'metadata.google.internal',
	'instance-data'
]);

function isPrivateIpv4(address: string): boolean {
	const parts = address.split('.').map(Number);
	if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) return true;

	const [a, b] = parts;
	return (
		a === 0 ||
		a === 10 ||
		a === 127 ||
		(a === 100 && b >= 64 && b <= 127) ||
		(a === 169 && b === 254) ||
		(a === 172 && b >= 16 && b <= 31) ||
		(a === 192 && b === 0) ||
		(a === 192 && b === 168) ||
		(a === 192 && b === 18) ||
		(a === 198 && (b === 18 || b === 19)) ||
		a >= 224
	);
}

function isPrivateIpv6(address: string): boolean {
	const normalized = address.toLowerCase();
	if (normalized === '::1' || normalized === '::') return true;
	if (
		normalized.startsWith('fe80:') ||
		normalized.startsWith('fc') ||
		normalized.startsWith('fd')
	) {
		return true;
	}
	if (normalized.startsWith('::ffff:')) {
		return isPrivateIpv4(normalized.slice('::ffff:'.length));
	}
	return false;
}

function isPrivateAddress(address: string): boolean {
	const version = isIP(address);
	if (version === 4) return isPrivateIpv4(address);
	if (version === 6) return isPrivateIpv6(address);
	return true;
}

export async function assertPublicHttpUrl(input: string): Promise<URL> {
	let url: URL;
	try {
		url = new URL(input);
	} catch {
		throw new ImportUrlError("Ce lien n'est pas une URL valide.");
	}

	if (url.protocol !== 'http:' && url.protocol !== 'https:') {
		throw new ImportUrlError('Seuls les liens http(s) sont acceptés.');
	}

	if (url.username || url.password) {
		throw new ImportUrlError('Les liens avec identifiants intégrés ne sont pas acceptés.');
	}

	if (url.port && url.port !== '80' && url.port !== '443') {
		throw new ImportUrlError('Ce port réseau n’est pas autorisé.');
	}

	const hostname = url.hostname.toLowerCase();
	if (
		BLOCKED_HOSTNAMES.has(hostname) ||
		hostname.endsWith('.local') ||
		hostname.endsWith('.internal') ||
		hostname.endsWith('.localhost')
	) {
		throw new ImportUrlError('Cette adresse réseau n’est pas autorisée.');
	}

	const addresses = isIP(hostname)
		? [{ address: hostname, family: isIP(hostname) }]
		: await lookup(hostname, { all: true, verbatim: true }).catch(() => []);

	if (addresses.length === 0) {
		throw new ImportUrlError('Impossible de trouver ce site.');
	}

	if (addresses.some((entry) => isPrivateAddress(entry.address))) {
		throw new ImportUrlError('Cette adresse réseau n’est pas autorisée.');
	}

	return url;
}
