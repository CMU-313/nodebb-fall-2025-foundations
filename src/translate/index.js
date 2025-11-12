/* eslint-disable strict */

const translatorApi = module.exports;

translatorApi.translate = async function (postData = {}) {
	const TRANSLATOR_API = process.env.TRANSLATOR_API_URL || 'http://translator:5000';
	const TRANSLATOR_TIMEOUT = parseInt(process.env.TRANSLATOR_TIMEOUT || '8000', 10);
	const content = postData.content ? postData.content.toString() : '';

	if (!content.trim()) {
		if (process.env.NODE_ENV !== 'production') {
			console.warn('[translator] empty post content received, skipping translation');
		}
		return [true, content];
	}

	try {
		const response = await fetch(`${TRANSLATOR_API}/?content=${encodeURIComponent(content)}`, {
			signal: AbortSignal.timeout(TRANSLATOR_TIMEOUT),
		});

		if (!response.ok) {
			throw new Error(`Translator API returned status ${response.status}`);
		}

		const data = await response.json();
		return [data.is_english, data.translated_content];
	} catch (err) {
		if (process.env.NODE_ENV !== 'production') {
			console.warn('[translator] translation service unavailable, fallback to original content', {
				message: err && err.message,
			});
		}
		return [false, content];
	}
};
