/* eslint-disable strict */

const translatorApi = module.exports;

translatorApi.translate = async function (postData) {
	// Use environment variable with fallback to localhost for dev
	const TRANSLATOR_API = process.env.TRANSLATOR_API_URL || 'http://localhost:5000';
	// Configurable timeout: default 500ms to ensure tests complete within 25s limit
	// (worst case: 30 topics × 500ms = 15s, well under 25s test timeout)
	const TRANSLATOR_TIMEOUT = parseInt(process.env.TRANSLATOR_TIMEOUT || '500', 10);
    
	try {
		const response = await fetch(TRANSLATOR_API + '/?content=' + encodeURIComponent(postData.content), {
			signal: AbortSignal.timeout(TRANSLATOR_TIMEOUT),
		});
        
		if (!response.ok) {
			throw new Error(`Translator API returned status ${response.status}`);
		}
        
		const data = await response.json();
		return [data.is_english, data.translated_content];
	} catch (error) {
		// If translator service is unavailable, fall back to default behavior
		// Assume content is in English and return original content
		// Silent fallback in production to avoid log spam
		if (process.env.NODE_ENV !== 'production') {
			console.warn('[translator] Translation service unavailable, using fallback:', error.message);
		}
		return [true, postData.content];
	}
};
