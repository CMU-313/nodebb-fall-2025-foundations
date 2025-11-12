'use strict';

import { fire as fireHook } from 'hooks';
import { confirm } from 'bootbox';

const baseUrl = config.relative_path + '/api/v3';

async function call(options, callback) {
	options.url = options.url.startsWith('/api') ?
		config.relative_path + options.url :
		baseUrl + options.url;

	if (typeof callback === 'function') {
		xhr(options).then(
			result => callback(null, result), 
			err => {
				// Ensure error is an Error object with a proper message
				let errorToPass = err;
				if (!(err instanceof Error)) {
					errorToPass = new Error(String(err));
				}
				// Only transform if it's already a translation key or a known network error
				// Don't transform server error messages (403, 404, etc.)
				const errMessage = errorToPass.message || String(errorToPass);
				if (errMessage && !errMessage.startsWith('[[error:')) {
					// Only transform actual network errors, not HTTP error responses
					const isNetworkError = (errMessage.toLowerCase() === 'fetch failed' ||
						errMessage.toLowerCase() === 'failed to fetch' ||
						errMessage.toLowerCase().includes('networkerror') ||
						(errMessage.toLowerCase().includes('network') && 
						 errMessage.toLowerCase().includes('failed')));
					
					if (isNetworkError) {
						const networkErr = new Error('[[error:no-connection]]');
						networkErr.originalError = errorToPass;
						errorToPass = networkErr;
					}
				}
				callback(errorToPass);
			}
		);
		return;
	}

	try {
		const result = await xhr(options);
		return result;
	} catch (err) {
		if (err.message === 'A valid login session was not found. Please log in and try again.') {
			const { url } = await fireHook('filter:admin.reauth', { url: 'login' });
			return confirm('[[error:api.reauth-required]]', (ok) => {
				if (ok) {
					ajaxify.go(url);
				}
			});
		}
		throw err;
	}
}

async function xhr(options) {
	// Normalize body based on type
	const { url } = options;
	delete options.url;

	// Ensure headers object exists
	if (!options.headers) {
		options.headers = {};
	}

	if (options.data && !(options.data instanceof FormData)) {
		options.data = JSON.stringify(options.data || {});
		options.headers['content-type'] = 'application/json; charset=utf-8';
	}

	// Allow options to be modified by plugins, etc.
	try {
		({ options } = await fireHook('filter:api.options', { options }));
	} catch (err) {
		console.error('[API] Error in filter:api.options hook:', err);
	}

	/**
	 * Note: pre-v4 backwards compatibility
	 *
	 * This module now passes in "data" to xhr().
	 * This is because the "filter:api.options" hook (and plugins using it) expect "data".
	 * fetch() expects body, so we rename it here.
	 *
	 * In v4, replace all instances of "data" with "body" and record as breaking change.
	 */
	if (options.data) {
		options.body = options.data;
		delete options.data;
	}

	let res;
	try {
		res = await fetch(url, options);
	} catch (err) {
		// Only catch actual network/CORS failures, not HTTP error responses
		// Network errors: TypeError (failed to connect), CORS errors, etc.
		// HTTP errors (403, 404, 500) are NOT network errors - they're server responses
		const errMessage = err.message || err.toString() || String(err);
		const errName = err.name || 'Error';
		
		// Only treat as network error if it's a TypeError (connection failed)
		// or explicitly mentions network/CORS issues
		const isNetworkError = (errName === 'TypeError' &&
			(errMessage.toLowerCase().includes('fetch') ||
				errMessage.toLowerCase().includes('network') ||
				errMessage.toLowerCase().includes('failed to fetch') ||
				errMessage.toLowerCase().includes('load failed'))) ||
			errMessage.toLowerCase().includes('cors') ||
			errMessage.toLowerCase().includes('networkerror');
		
		if (isNetworkError) {
			console.error('[API] Network error:', {
				url: url,
				method: options.method || 'GET',
				error: errMessage,
				name: errName,
			});
			const networkErr = new Error('[[error:no-connection]]');
			networkErr.originalError = err;
			throw networkErr;
		}
		
		// Re-throw other errors (they might be important)
		console.error('[API] Unexpected fetch error:', {
			url: url,
			method: options.method || 'GET',
			error: errMessage,
			name: errName,
		});
		throw err;
	}
	const { headers } = res;

	if (headers.get('x-redirect')) {
		return xhr({ url: headers.get('x-redirect'), ...options });
	}

	const contentType = headers.get('content-type');
	const isJSON = contentType && contentType.startsWith('application/json');

	let response;
	if (options.method !== 'HEAD') {
		try {
			if (isJSON) {
				response = await res.json();
			} else {
				response = await res.text();
			}
		} catch (parseErr) {
			console.error('[API] Error parsing response:', {
				url: url,
				status: res.status,
				statusText: res.statusText,
				contentType: contentType,
				error: parseErr.message,
			});
			throw new Error('[[error:invalid-json]]');
		}
	}

	if (!res.ok) {
		let errorMessage;
		if (response) {
			if (isJSON && response.status && response.status.message) {
				errorMessage = response.status.message;
			} else if (typeof response === 'string') {
				errorMessage = response;
			} else {
				errorMessage = res.statusText || 'Request failed';
			}
		} else {
			errorMessage = res.statusText || 'Request failed';
		}
		throw new Error(errorMessage);
	}

	return isJSON && response && response.hasOwnProperty('status') && response.hasOwnProperty('response') ?
		response.response :
		response;
}

export function get(route, data, onSuccess) {
	return call({
		url: route + (data && Object.keys(data).length ? ('?' + $.param(data)) : ''),
	}, onSuccess);
}

export function head(route, data, onSuccess) {
	return call({
		url: route + (data && Object.keys(data).length ? ('?' + $.param(data)) : ''),
		method: 'HEAD',
	}, onSuccess);
}

export function post(route, data, onSuccess) {
	return call({
		url: route,
		method: 'POST',
		data,
		headers: {
			'x-csrf-token': config.csrf_token,
		},
	}, onSuccess);
}

export function patch(route, data, onSuccess) {
	return call({
		url: route,
		method: 'PATCH',
		data,
		headers: {
			'x-csrf-token': config.csrf_token,
		},
	}, onSuccess);
}

export function put(route, data, onSuccess) {
	return call({
		url: route,
		method: 'PUT',
		data,
		headers: {
			'x-csrf-token': config.csrf_token,
		},
	}, onSuccess);
}

export function del(route, data, onSuccess) {
	return call({
		url: route,
		method: 'DELETE',
		data,
		headers: {
			'x-csrf-token': config.csrf_token,
		},
	}, onSuccess);
}
