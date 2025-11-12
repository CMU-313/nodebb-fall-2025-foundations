/* eslint-disable strict */

const translatorApi = module.exports;

translatorApi.translate = async function (postData) {

	// Use environment variable
	const TRANSLATOR_API = process.env.TRANSLATOR_API_URL || 'http://translator:5000';
    
	try {
		const response = await fetch(TRANSLATOR_API + '/?content=' + postData.content);
		const data = await response.json();
		return [data.is_english, data.translated_content];
	} catch (error) {
		// If translator service is unavailable, fall back to default behavior
		return [false, postData.content];
	}
};
