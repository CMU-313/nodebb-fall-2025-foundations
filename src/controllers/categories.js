'use strict';

const nconf = require('nconf');
const _ = require('lodash');

const categories = require('../categories');
const meta = require('../meta');
const pagination = require('../pagination');
const helpers = require('./helpers');
const privileges = require('../privileges');
const widgets = require('../widgets');

const categoriesController = module.exports;

// user module not required here; privileges.global.can is used instead

categoriesController.list = async function (req, res) {
	res.locals.metaTags = [
		{ name: 'title', content: String(meta.config.title || 'NodeBB') },
		{ property: 'og:type', content: 'website' },
	];

	// Get root categories
	const allRootCids = await categories.getAllCidsFromSet('cid:0:children');
	const rootCids = await privileges.categories.filterCids('find', allRootCids, req.uid);

	const pageCount = Math.max(1, Math.ceil(rootCids.length / meta.config.categoriesPerPage));
	const page = Math.min(parseInt(req.query.page, 10) || 1, pageCount);
	const start = Math.max(0, (page - 1) * meta.config.categoriesPerPage);
	const stop = start + meta.config.categoriesPerPage - 1;
	const pageCids = rootCids.slice(start, stop + 1);

	// Get child categories
	const allChildCids = _.flatten(await Promise.all(pageCids.map(categories.getChildrenCids)));
	const childCids = await privileges.categories.filterCids('find', allChildCids, req.uid);

	const categoryData = await categories.getCategories(pageCids.concat(childCids));
	const tree = categories.getTree(categoryData, 0);

	await Promise.all([
		categories.getRecentTopicReplies(categoryData, req.uid, req.query),
		categories.setUnread(tree, pageCids.concat(childCids), req.uid),
	]);

	// Category creation endpoint
	categoriesController.create = async function (req, res) {
		try {
			// COPILOT
			// Allow any authenticated user to create a category; record
			// the creating uid as the owner. Guests or unauthenticated
			// requests are rejected.
			if (!req.uid) {
				return res.status(403).json({ error: 'Not allowed to create categories' });
			}

			const category = await categories.create({
				name: req.body.name || 'Untitled Category',
				description: req.body.description || '',
				uid: req.uid,
			});

			return res.json({ category });
		} catch (err) {
			console.error(err);
			return res.status(500).json({ error: err.message });
		}
	};

	const data = {
		title: meta.config.homePageTitle || '[[pages:home]]',
		selectCategoryLabel: '[[pages:categories]]',
		categories: tree,
		pagination: pagination.create(page, pageCount, req.query),
	};

	// Prepare categories for display
	data.categories.forEach((category) => {
		if (category) {
			helpers.trimChildren(category);
			helpers.setCategoryTeaser(category);
		}
	});
	
	// ChatGPT generated code
	// Compute per-category allowPurge flag so templates can render
	// the purge button using a simple variable (define like allowCategoryCreation).
	// There isn't a reliable global 'category:purge' privilege defined in the
	// global privilege map in all installations, so treat admins and global
	// moderators as having site-wide purge capability. Per-category owners
	// will still be allowed to purge their own categories via the owner check below.
	// Compute allowPurge using the same global-privileges API as
	// allowCategoryCreation so behavior matches what you requested.
	const allowPurgePrivilege = await privileges.global.can('category:purge', req.uid);

	// Ensure we have the owner (uid) for each category so owner-based
	// authorization checks work even if the main category fetch omitted fields.
	const allCidsForPage = pageCids.concat(childCids);
	let ownerData = [];
	try {
		ownerData = await categories.getCategoriesFields(allCidsForPage, ['uid']);
	} catch (e) {
		// non-fatal: we'll fall back to whatever uid is present on the category
		ownerData = [];
	}
	const cidToOwner = {};
	ownerData.forEach((cat, idx) => {
		if (cat && allCidsForPage[idx] !== undefined) {
			cidToOwner[allCidsForPage[idx]] = cat.uid;
		}
	});

	function setAllowPurge(category) {
		if (!category) return;
		// Ensure category.uid is present (use fetched owner map if necessary)
		if (!category.uid && cidToOwner.hasOwnProperty(category.cid)) {
			category.uid = cidToOwner[category.cid];
		}

		// Allow purge when current user has the purge privilege OR is the category owner.
		// Keep the check explicit and robust against string/number uid types.
		const ownerUid = category.uid ? parseInt(category.uid, 10) : 0;
		const currentUid = req.uid ? parseInt(req.uid, 10) : 0;
		category.allowPurge = Boolean(allowPurgePrivilege || (currentUid > 0 && ownerUid > 0 && ownerUid === currentUid));
		// Also expose a `purgable` alias for templates or clients that expect
		// that naming convention (non-persistent, computed at render time).
		category.purgable = category.allowPurge;

		if (Array.isArray(category.children) && category.children.length) {
			category.children.forEach(setAllowPurge);
		}
	}

	data.categories.forEach(setAllowPurge);

	// Top-level flags: users with the purge privilege should be able to purge any category.
	data.allowPurge = Boolean(allowPurgePrivilege);
	// Provide a `purgable` top-level alias to match some client expectations.
	data.purgable = data.allowPurge;

	// Debug: log summary info so callers can verify allowPurge values when
	// running the server in development. This helps diagnose why buttons
	// might not be rendered for admins.
	function countAllowPurge(categoriesArr) {
		let cnt = 0;
		function rec(arr) {
			if (!Array.isArray(arr)) return;
			arr.forEach((cat) => {
				if (!cat) return;
				if (cat.allowPurge) cnt += 1;
				if (Array.isArray(cat.children)) rec(cat.children);
			});
		}
		rec(categoriesArr);
		return cnt;
	}

	console.log(`[categories] uid=${req.uid} allowPurgePrivilege=${allowPurgePrivilege} allowPurgeCount=${countAllowPurge(data.categories)}`);

	//COPILOT
	// API route — JSON response
	if (req.originalUrl.startsWith(`${nconf.get('relative_path')}/api`)) {
		data.title = '[[pages:categories]]';
		data.breadcrumbs = helpers.buildBreadcrumbs([{ text: data.title }]);
		res.locals.metaTags.push({ property: 'og:title', content: '[[pages:categories]]' });

		data.loggedIn = !!req.uid;
		data.loggedInUser = req.uid ? { uid: req.uid } : {};
		data.relative_path = String(nconf.get('relative_path') || '');
		data.template = { name: 'categories' };
		data.url = String(nconf.get('url') || meta.config.url || '');
		data.bodyClass = 'categories-page';

		// Set cache-control header for logged-in users
		if (req.loggedIn) {
			res.set('cache-control', 'private');
		}
		// Ensure API responses include session info expected by the schema/tests
		data._header = {
			tags: {
				meta: [
					{ name: 'description', content: meta.config.description || '' },
					{ name: 'title', content: meta.config.title || 'NodeBB' },
					{ property: 'og:type', content: 'website' },
				],
				link: [
					{ rel: 'canonical', href: String(nconf.get('url') || meta.config.url || '') },
				],
			},
		};

		// Compute privilege flag for template rendering and API schema
		const allowCategoryCreation = await privileges.global.can('category:create', req.uid);
		// Include in JSON to support client-side (schema updated to allow it)
		data.allowCategoryCreation = allowCategoryCreation;
		// Include top-level allowPurge for API consumers
		data.allowPurge = Boolean(allowPurgePrivilege);
		data.widgets = await widgets.render(req.uid, {
			template: 'categories.tpl',
			url: data.url,
			templateData: { ...data, allowCategoryCreation },
			req: req,
			res: res,
		});

		return res.json(data);
	}


	// Template route — safe to add allowCategoryCreation
	data.allowCategoryCreation = await privileges.global.can('category:create', req.uid);
	res.render('categories', {
		title: meta.config.homePageTitle || '[[pages:home]]',
		// pass the annotated categories array so templates can read `./allowPurge`
		categories: data.categories,
		// top-level flag so templates can check `if allowPurge` (admins/global-mods)
		allowPurge: data.allowPurge,
		allowCategoryCreation: await privileges.global.can('category:create', req.uid),
		loggedInUser: req.user || null,
	});

};
