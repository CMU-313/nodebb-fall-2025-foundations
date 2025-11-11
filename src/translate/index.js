
/* eslint-disable strict */

const translatorApi = module.exports;

translatorApi.translate = function (postData) {
	return ['is_english', postData];
};

translatorApi.translate = async function (postData) {
	// Use environment variable with fallback to localhost for dev
	const TRANSLATOR_API = process.env.TRANSLATOR_API_URL || 'http://localhost:5000';
	const response = await fetch(TRANSLATOR_API + '/?content=' + encodeURIComponent(postData.content));
	const data = await response.json();
	return [data.is_english, data.translated_content];
};