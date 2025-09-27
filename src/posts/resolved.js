'use strict';

// AI Assistance: This file was created with assistance from ChatGPT for implementing
// the resolved/unresolved functionality, including permission logic and database operations.

const user = require('../user');
const plugins = require('../plugins');
const events = require('../events');

module.exports = function (Posts) {
	Posts.setResolved = async function (pid, resolved, uid) {
		// Check if user has permission to mark posts as resolved
		const canResolve = await Posts.canResolve(pid, uid);
		if (!canResolve) {
			throw new Error('[[error:no-privileges]]');
		}

		const postData = await Posts.getPostData(pid);
		if (!postData) {
			throw new Error('[[error:no-post]]');
		}

		// Set the resolved status
		await Posts.setPostField(pid, 'resolved', resolved ? 1 : 0);

		// Fire plugin hook for resolved status change
		await plugins.hooks.fire('action:post.resolved', {
			pid: pid,
			resolved: resolved,
			uid: uid,
			post: postData,
		});

		// Log the event
		await events.log({
			type: resolved ? 'post-resolved' : 'post-unresolved',
			uid: uid,
			pid: pid,
			tid: postData.tid,
		});

		return { resolved: resolved };
	};

	Posts.canResolve = async function (pid, uid) {
		// Only allow moderators, administrators, or course instructors to resolve posts
		const [isAdmin, isGlobalModerator, postData] = await Promise.all([
			user.isAdministrator(uid),
			user.isGlobalModerator(uid),
			Posts.getPostData(pid),
		]);

		if (!postData) {
			return false;
		}

		// Get category data to check if it's "Comments & Feedback"
		const topics = require('../topics');
		const topicData = await topics.getTopicData(postData.tid);
		const cid = topicData ? topicData.cid : null;
		
		const db = require('../database');
		const categoryData = await db.getObject(`category:${cid}`);
		
		// Only allow resolved functionality in "Comments & Feedback" category
		const categoryName = categoryData ? categoryData.name.replace(/&amp;/g, '&') : '';
		if (!categoryData || categoryName !== 'Comments & Feedback') {
			return false;
		}

		// Check if user is moderator of the category
		const isCategoryModerator = await user.isModerator(uid, cid);

		// Allow if user is admin, global moderator, or category moderator
		return isAdmin || isGlobalModerator || isCategoryModerator;
	};

	Posts.getResolvedStatus = async function (pid) {
		const resolved = await Posts.getPostField(pid, 'resolved');
		return parseInt(resolved, 10) === 1;
	};
};
