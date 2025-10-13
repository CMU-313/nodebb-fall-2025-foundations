/* eslint-env mocha */
// THIS ENTIRE FILE WAS WRITTEN BY CHAT
'use strict';

const assert = require('assert');

const db = require('../mocks/databasemock');

const User = require('../../src/user');
const adminUser = require('../../src/socket.io/admin/user');


describe('user university field', () => {
	let uid;

	before(async () => {
		uid = await User.create({ username: 'uniuser', password: '123456' });
		await User.setUserField(uid, 'email', 'uni@example.com');
		await User.email.confirmByUid(uid);

		// create the university custom field so updateProfile will accept it
		await adminUser.saveCustomFields({ uid: uid }, [
			{ key: 'university', icon: 'fa-solid fa-graduation-cap', name: 'University', type: 'input-text', visibility: 'all', 'min:rep': 0 },
		]);
	});

	it('should normalize university capitalization and small words', async () => {
		await User.updateProfile(uid, {
			uid: uid,
			university: '  the university of toronto  ',
		});

		const stored = await User.getUserField(uid, 'university');
		assert.strictEqual(stored, 'The University of Toronto');
	});

	it('should append graduation year when provided separately', async () => {
		await User.updateProfile(uid, {
			uid: uid,
			university: 'Massachusetts Institute of Technology',
			graduationYear: '2027',
		});

		const stored = await User.getUserField(uid, 'university');
		assert.strictEqual(stored.endsWith(' (\'27)'), true);
	});

	it('should replace existing trailing graduation year when updating year', async () => {
		// set with a trailing year
		await User.updateProfile(uid, {
			uid: uid,
			university: 'Graduation (\'25)',
		});

		// now update only graduationYear
		await User.updateProfile(uid, {
			uid: uid,
			graduationYear: '2030',
		});

		const stored = await User.getUserField(uid, 'university');
		assert.strictEqual(stored, 'Graduation (\'30)');
	});
});
