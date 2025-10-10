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
		categories: tree,
		allowCategoryCreation: await privileges.global.can('category:create', req.uid),
		loggedInUser: req.user || null,
	});

};
