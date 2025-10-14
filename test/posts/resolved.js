'use strict';

// AI Assistance: Claude assisted by examining other test files in NodeBB (test/posts.js,
// test/topics.js, test/flags.js) to follow their general format and testing patterns.

const assert = require('assert');

const topics = require('../../src/topics');
const posts = require('../../src/posts');
const categories = require('../../src/categories');
const user = require('../../src/user');
const groups = require('../../src/groups');
const apiPosts = require('../../src/api/posts');

describe('Posts - Resolved Status', () => {
	let adminUid;
	let globalModUid;
	let categoryModUid;
	let regularUserUid;
	let postAuthorUid;
	let commentsCid;
	let otherCid;
	let commentsMainPid;
	let otherMainPid;

	before(async function () {
		this.timeout(10000);
		// Create users
		adminUid = await user.create({ username: 'resolvedadmin', password: 'adminpass123' });
		globalModUid = await user.create({ username: 'resolvedglobalmod', password: 'globalmodpass123' });
		categoryModUid = await user.create({ username: 'resolvedcategorymod', password: 'categorymodpass123' });
		regularUserUid = await user.create({ username: 'resolvedregularuser', password: 'regularpass123' });
		postAuthorUid = await user.create({ username: 'resolvedpostauthor', password: 'authorpass123' });

		// Assign privileges
		await groups.join('administrators', adminUid);
		await groups.join('Global Moderators', globalModUid);

		// Create "Comments & Feedback" category
		const commentsCategory = await categories.create({
			name: 'Comments & Feedback',
			description: 'Test category for resolved functionality',
		});
		commentsCid = commentsCategory.cid;

		// Create another category
		const otherCategory = await categories.create({
			name: 'General Discussion',
			description: 'Another test category',
		});
		otherCid = otherCategory.cid;

		// Make categoryModUid a moderator of Comments & Feedback only
		await groups.join(`cid:${commentsCid}:privileges:moderate`, categoryModUid);

		// Create a topic in Comments & Feedback by postAuthor
		const commentsResult = await topics.post({
			uid: postAuthorUid,
			cid: commentsCid,
			title: 'Test Question in Comments & Feedback',
			content: 'This is a test question that needs resolution',
		});
		commentsMainPid = commentsResult.postData.pid;

		// Create a topic in another category
		const otherResult = await topics.post({
			uid: postAuthorUid,
			cid: otherCid,
			title: 'Test Topic in Other Category',
			content: 'This is a post in another category',
		});
		otherMainPid = otherResult.postData.pid;
	});

	describe('Permission Checks - canResolve()', () => {
		it('should allow administrators to resolve posts in Comments & Feedback', async () => {
			const canResolve = await posts.canResolve(commentsMainPid, adminUid);
			assert.strictEqual(canResolve, true);
		});

		it('should allow global moderators to resolve posts in Comments & Feedback', async () => {
			const canResolve = await posts.canResolve(commentsMainPid, globalModUid);
			assert.strictEqual(canResolve, true);
		});

		it('should allow Comments & Feedback category moderators to resolve posts', async () => {
			const canResolve = await posts.canResolve(commentsMainPid, categoryModUid);
			assert.strictEqual(canResolve, true);
		});

		it('should allow post authors to resolve their own posts', async () => {
			const canResolve = await posts.canResolve(commentsMainPid, postAuthorUid);
			assert.strictEqual(canResolve, true);
		});

		it('should not allow regular users to resolve posts they did not author', async () => {
			const canResolve = await posts.canResolve(commentsMainPid, regularUserUid);
			assert.strictEqual(canResolve, false);
		});

		it('should not allow guests to resolve posts', async () => {
			const canResolve = await posts.canResolve(commentsMainPid, 0);
			assert.strictEqual(canResolve, false);
		});

		it('should return false for canResolve with invalid pid', async () => {
			const canResolve = await posts.canResolve(9999999, adminUid);
			assert.strictEqual(canResolve, false);
		});
	});

	describe('Category-Specific Authorization', () => {
		it('should not allow resolved functionality in non-Comments & Feedback categories', async () => {
			const canResolve = await posts.canResolve(otherMainPid, adminUid);
			assert.strictEqual(canResolve, false);
		});

		it('should not allow post author to resolve in non-Comments & Feedback categories', async () => {
			const canResolve = await posts.canResolve(otherMainPid, postAuthorUid);
			assert.strictEqual(canResolve, false);
		});

		it('should not allow global moderators to resolve in other categories', async () => {
			const canResolve = await posts.canResolve(otherMainPid, globalModUid);
			assert.strictEqual(canResolve, false);
		});

		it('should not allow moderators of other categories to resolve Comments & Feedback posts', async () => {
			const otherModUid = await user.create({ username: 'resolvedothermod', password: 'password123456' });
			await groups.join(`cid:${otherCid}:privileges:moderate`, otherModUid);
			
			const canResolve = await posts.canResolve(commentsMainPid, otherModUid);
			assert.strictEqual(canResolve, false);
		});
	});

	describe('Authorization Enforcement via setResolved()', () => {
		it('should throw error when unauthorized user tries to set resolved status', async () => {
			await assert.rejects(
				posts.setResolved(commentsMainPid, true, regularUserUid),
				{ message: '[[error:no-privileges]]' }
			);
		});

		it('should allow admin to set resolved status', async () => {
			const result = await posts.setResolved(commentsMainPid, true, adminUid);
			assert.strictEqual(result.resolved, true);
		});

		it('should allow post author to set resolved status', async () => {
			const result = await posts.setResolved(commentsMainPid, false, postAuthorUid);
			assert.strictEqual(result.resolved, false);
		});
	});

	describe('API Integration via apiPosts', () => {
		it('should set resolved status via apiPosts as admin', async () => {
			const result = await apiPosts.setResolved(
				{ uid: adminUid },
				{ pid: commentsMainPid, resolved: true }
			);
			assert.strictEqual(result.resolved, true);
		});

		it('should set resolved status via apiPosts as post author', async () => {
			const result = await apiPosts.setResolved(
				{ uid: postAuthorUid },
				{ pid: commentsMainPid, resolved: false }
			);
			assert.strictEqual(result.resolved, false);
		});

		it('should fail via apiPosts for unauthorized users', async () => {
			await assert.rejects(
				apiPosts.setResolved(
					{ uid: regularUserUid },
					{ pid: commentsMainPid, resolved: true }
				),
				{ message: '[[error:no-privileges]]' }
			);
		});

		it('should fail when not logged in', async () => {
			await assert.rejects(
				apiPosts.setResolved(
					{ uid: 0 },
					{ pid: commentsMainPid, resolved: true }
				),
				{ message: '[[error:not-logged-in]]' }
			);
		});

		it('should fail with invalid data - missing resolved field', async () => {
			await assert.rejects(
				apiPosts.setResolved(
					{ uid: adminUid },
					{ pid: commentsMainPid }
				),
				{ message: '[[error:invalid-data]]' }
			);
		});

		it('should fail with invalid data - missing pid', async () => {
			await assert.rejects(
				apiPosts.setResolved(
					{ uid: adminUid },
					{ resolved: true }
				),
				{ message: '[[error:invalid-data]]' }
			);
		});
	});

	describe('Multiple Users Cross-Authorization', () => {
		let user1Uid;
		let user2Uid;
		let user1Pid;
		let user2Pid;

		before(async () => {
			user1Uid = await user.create({ username: 'resolveduser1', password: 'pass123456' });
			user2Uid = await user.create({ username: 'resolveduser2', password: 'pass123456' });

			// User1 creates a post
			const result1 = await topics.post({
				uid: user1Uid,
				cid: commentsCid,
				title: 'User1 Question',
				content: 'Question from user1',
			});
			user1Pid = result1.postData.pid;

			// User2 creates a post
			const result2 = await topics.post({
				uid: user2Uid,
				cid: commentsCid,
				title: 'User2 Question',
				content: 'Question from user2',
			});
			user2Pid = result2.postData.pid;
		});

		it('should allow user to resolve their own post but not others', async () => {
			// Can resolve own post
			const canResolveOwn = await posts.canResolve(user1Pid, user1Uid);
			assert.strictEqual(canResolveOwn, true);

			// Cannot resolve other user's post
			const canResolveOther = await posts.canResolve(user2Pid, user1Uid);
			assert.strictEqual(canResolveOther, false);
		});

		it('should allow admin to resolve any user\'s post', async () => {
			const canResolve1 = await posts.canResolve(user1Pid, adminUid);
			const canResolve2 = await posts.canResolve(user2Pid, adminUid);
			assert.strictEqual(canResolve1, true);
			assert.strictEqual(canResolve2, true);
		});

		it('should enforce authorization when user1 tries to set user2\'s resolved status', async () => {
			await assert.rejects(
				posts.setResolved(user2Pid, true, user1Uid),
				{ message: '[[error:no-privileges]]' }
			);
		});
	});
});
