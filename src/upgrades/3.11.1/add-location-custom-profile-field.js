'use strict';

const db = require('../../database');

module.exports = {
	name: 'Add location as custom profile field',
	timestamp: Date.UTC(2025, 9, 8),
	method: async function () {
		const existing = await db.getSortedSetRange('user-custom-fields', 0, -1);
		if (existing && existing.includes('location')) {
			return;
		}

		const location = {
			icon: 'fa-solid fa-location-dot',
			key: 'location',
			'min:rep': 0,
			name: 'Location',
			'type': 'input-text',
			'select-options': '',
		};

		await db.sortedSetAdd('user-custom-fields', 0, 'location');
		await db.setObject(`user-custom-field:location`, location);
	},
};
