// Define create at the top level
categoriesController.create = async function (req, res) {
    try {
        // Make sure user has privilege
        const canCreate = await privileges.global.can('category:create', req.uid);
        if (!canCreate) {
            return res.status(403).json({ error: 'Not allowed to create categories' });
        }

        // Call your backend create logic
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

categoriesController.list = async function (req, res) {
    res.locals.metaTags = [{
        name: 'title',
        content: String(meta.config.title || 'NodeBB'),
    }, {
        property: 'og:type',
        content: 'website',
    }];

    const allRootCids = await categories.getAllCidsFromSet('cid:0:children');
    const rootCids = await privileges.categories.filterCids('find', allRootCids, req.uid);
    const pageCount = Math.max(1, Math.ceil(rootCids.length / meta.config.categoriesPerPage));
    const page = Math.min(parseInt(req.query.page, 10) || 1, pageCount);
    const start = Math.max(0, (page - 1) * meta.config.categoriesPerPage);
    const stop = start + meta.config.categoriesPerPage - 1;
    const pageCids = rootCids.slice(start, stop + 1);

    const allChildCids = _.flatten(await Promise.all(pageCids.map(categories.getChildrenCids)));
    const childCids = await privileges.categories.filterCids('find', allChildCids, req.uid);
    const categoryData = await categories.getCategories(pageCids.concat(childCids));
    const tree = categories.getTree(categoryData, 0);
    await Promise.all([
        categories.getRecentTopicReplies(categoryData, req.uid, req.query),
        categories.setUnread(tree, pageCids.concat(childCids), req.uid),
    ]);

    const data = {
        title: meta.config.homePageTitle || '[[pages:home]]',
        selectCategoryLabel: '[[pages:categories]]',
        categories: tree,
        pagination: pagination.create(page, pageCount, req.query),
    };

    // Pass allowCategoryCreation only to the template
    const allowCategoryCreation = await privileges.global.can('category:create', req.uid);

    data.categories.forEach((category) => {
        if (category) {
            helpers.trimChildren(category);
            helpers.setCategoryTeaser(category);
        }
    });

    if (req.originalUrl.startsWith(`${nconf.get('relative_path')}/api/categories`) || req.originalUrl.startsWith(`${nconf.get('relative_path')}/categories`)) {
        data.title = '[[pages:categories]]';
        data.breadcrumbs = helpers.buildBreadcrumbs([{ text: data.title }]);
        res.locals.metaTags.push({
            property: 'og:title',
            content: '[[pages:categories]]',
        });
    }

    res.render('categories', {
        ...data,
        allowCategoryCreation, // template-only
    });
};