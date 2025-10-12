'use strict';

const assert = require('assert');

const db = require('../mocks/databasemock');

const User = require('../../src/user');
const adminUser = require('../../src/socket.io/admin/user');

describe('user location field', () => {
	let uid;
	let adminUid;

	before(async () => {
		adminUid = await User.create({ username: 'locationadmin' });
		await db.setObjectField(`user:${adminUid}`, 'reputation', 20);
		await db.sortedSetAdd('users:reputation', 20, adminUid);

		uid = await User.create({ username: 'locationuser', password: '123456' });
		await User.setUserField(uid, 'email', 'location@example.com');
		await User.email.confirmByUid(uid);

		// Create the location custom field
		await adminUser.saveCustomFields({ uid: adminUid }, [
			{ key: 'location', icon: 'fa-solid fa-location-dot', name: 'Location', type: 'input-text', visibility: 'all', 'min:rep': 0 },
		]);
	});

	it('should store valid location text', async () => {
		await User.updateProfile(uid, {
			uid: uid,
			location: 'Pittsburgh, PA',
		});

		const stored = await User.getUserField(uid, 'location');
		assert.strictEqual(stored, 'Pittsburgh, Pa');
	});

	it('should reject location with URLs', async () => {
		await assert.rejects(
			User.updateProfile(uid, {
				uid: uid,
				location: 'https://maps.example.com',
			}),
			{ message: '[[error:custom-user-field-invalid-text, Location]]' },
		);
	});

	it('should reject overly long location text', async () => {
		await assert.rejects(
			User.updateProfile(uid, {
				uid: uid,
				location: new Array(300).fill('x').join(''),
			}),
			{ message: '[[error:custom-user-field-value-too-long, Location]]' },
		);
	});

	it('should clear location when empty string provided', async () => {
		// First set a location
		await User.updateProfile(uid, {
			uid: uid,
			location: 'Somewhere, Place',
		});

		// Then clear it
		await User.updateProfile(uid, {
			uid: uid,
			location: '',
		});

		const stored = await User.getUserField(uid, 'location');
		assert.strictEqual(stored, '');
	});
});