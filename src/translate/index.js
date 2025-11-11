
/* eslint-disable strict */

const translatorApi = module.exports;

translatorApi.translate = function (postData) {
	return ['is_english',postData];
};

translatorApi.translate = async function (postData) {
//  Edit the translator URL below
	// const TRANSLATOR_API = "TODO"
	const TRANSLATOR_API = "http://localhost:5000";
	const response = await fetch(TRANSLATOR_API+'/?content='+encodeURIComponent(postData.content));
	const data = await response.json();
	return [data.is_english, data.translated_content];
};