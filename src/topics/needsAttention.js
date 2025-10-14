'use strict';

// AI Assistance: This file was created with assistance from Claude for implementing
// the needs attention functionality. Claude helped with:
// - Understanding NodeBB's database structure and topic/post relationships
// - Implementing the logic to check topic age, resolved status, and recent activity
// - Creating helper functions for getting latest reply times and topic filtering

const posts = require('../posts');
const categories = require('../categories');

module.exports = function (Topics) {
	/**
	 * Check if a topic needs attention
	 * A topic needs attention if:
	 * - It's in the "Comments & Feedback" category
	 * - It's more than 7 days old
	 * - It's unresolved (resolved status is 0 or false)
	 * - No replies in the last 3 days
	 */
	Topics.needsAttention = async function (tid) {
		const topicData = await Topics.getTopicData(tid);
		if (!topicData) {
			return false;
		}

		// Check if it's in "Comments & Feedback" category
		const categoryData = await categories.getCategoryData(topicData.cid);
		if (!categoryData) {
			return false;
		}

		// Handle HTML entities in category name
		const categoryName = categoryData.name.replace(/&amp;/g, '&');
		if (categoryName !== 'Comments & Feedback') {
			return false;
		}

		// Check if topic is more than 7 days old
		const topicAge = Date.now() - topicData.timestamp;
		const oneWeek = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
		if (topicAge < oneWeek) {
			return false;
		}

		// Check if the main post is resolved
		const postData = await posts.getPostData(topicData.mainPid);
		if (!postData) {
			return false;
		}

		// Check resolved status (0 or false means unresolved)
		const isResolved = postData.resolved === 1 || postData.resolved === true;
		if (isResolved) {
			return false;
		}

		// Check if there's been recent activity (last 3 days)
		const lastReplyTime = await Topics.getLatestReplyTime(tid);
		if (lastReplyTime) {
			const lastActivity = Date.now() - lastReplyTime;
			const threeDays = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds
			if (lastActivity < threeDays) {
				return false; // Has recent activity, doesn't need attention
			}
		}

		return true;
	};

	/**
	 * Get the latest reply time for a topic
	 */
	Topics.getLatestReplyTime = async function (tid) {
		const pids = await Topics.getPids(tid);
		if (pids.length <= 1) {
			return null; // Only main post, no replies
		}

		// Get the latest post (excluding main post)
		const latestPid = pids[pids.length - 1];
		const latestPost = await posts.getPostData(latestPid);
		
		return latestPost ? latestPost.timestamp : null;
	};
};
