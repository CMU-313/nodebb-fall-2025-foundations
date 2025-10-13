'use strict';

const db = require('../../database');

module.exports = {
	name: 'Add university as custom profile field',
	timestamp: Date.UTC(2025, 9, 7),
	method: async function () {
		// Add 'university' to the sorted set of user custom fields if not already present
		const existing = await db.getSortedSetRange('user-custom-fields', 0, -1);
		if (existing && existing.includes('university')) {
			return;
		}

		const university = {
			icon: 'fa-solid fa-graduation-cap',
			key: 'university',
			'min:rep': 0,
			name: 'University',
			'type': 'input-text',
			'select-options': '',
		};

		await db.sortedSetAdd('user-custom-fields', 0, 'university');
		await db.setObject(`user-custom-field:university`, university);
	},
};
