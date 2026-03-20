import { generateReactHelpers } from '@uploadthing/react';
import { getBackendUrl } from '@/lib/api/client';

const backendUrl = getBackendUrl()?.replace(/\/$/, '');

let backendOrigin: string | undefined;
let backendBasePath = '';

if (backendUrl) {
	try {
		const u = new URL(backendUrl);
		backendOrigin = u.origin;
		const raw = u.pathname.replace(/\/$/, '');
		backendBasePath = raw === '' || raw === '/' ? '' : raw;
	} catch {
		backendOrigin = undefined;
		backendBasePath = '';
	}
}

const uploadthingApiUrl =
	backendUrl && backendOrigin
		? `${backendOrigin}${backendBasePath}/api/uploadthing`
		: '/api/uploadthing';

function toRequestUrl(input: RequestInfo | URL): string {
	if (typeof input === 'string') return input;
	if (input instanceof URL) return input.toString();
	if (input instanceof Request) return input.url;
	return String(input);
}

function isUploadthingApiRequest(requestUrl: string): boolean {
	if (requestUrl.startsWith('/api/uploadthing')) return true;

	if (!backendOrigin) return false;

	try {
		const resolved = new URL(requestUrl, window.location.origin);
		const uploadthingPathPrefix = backendBasePath
			? `${backendBasePath}/api/uploadthing`
			: '/api/uploadthing';
		return (
			resolved.origin === backendOrigin &&
			resolved.pathname.startsWith(uploadthingPathPrefix)
		);
	} catch {
		return false;
	}
}

const uploadthingFetch: typeof fetch = (input, init) => {
	const requestUrl = toRequestUrl(input);
	const shouldIncludeCredentials = isUploadthingApiRequest(requestUrl);

	return fetch(input, shouldIncludeCredentials ? { ...init, credentials: 'include' } : init);
};


export const { useUploadThing } = generateReactHelpers({
	url: uploadthingApiUrl,
	fetch: uploadthingFetch,
});